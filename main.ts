import { MarkdownView, Platform, Plugin, PluginSettingTab, App, Setting, WorkspaceLeaf } from "obsidian";
import { minimatch } from "minimatch";

const DEFAULT_INACTIVE_THRESHOLD = 3_600_000; // 1 hour in ms
const DEFAULT_CHECK_INTERVAL     = 1_800_000; // 30 minutes in ms

declare module "obsidian" {
	interface WorkspaceLeaf {
		lastActiveTime?: number;
		pinned?: boolean;
	}
}

interface LazyTabPurgerSettings {
	inactiveThresholdMin: number;
	checkIntervalMin: number;
	excludePatterns: string[]; // vault-relative glob patterns, e.g. "01_Daily/**"
}

const DEFAULT_SETTINGS: LazyTabPurgerSettings = {
	inactiveThresholdMin: DEFAULT_INACTIVE_THRESHOLD / 60_000,
	checkIntervalMin:     DEFAULT_CHECK_INTERVAL     / 60_000,
	excludePatterns:      [],
};

export default class LazyTabPurger extends Plugin {
	settings: LazyTabPurgerSettings;
	private cleanupTimer: ReturnType<typeof setInterval> | null = null;

	async onload() {
		if (!Platform.isDesktop) return;

		await this.loadSettings();
		this.addSettingTab(new LazyTabPurgerSettingTab(this.app, this));

		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.lastActiveTime === undefined) leaf.lastActiveTime = Date.now();
		});

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf: WorkspaceLeaf | null) => {
				if (leaf) leaf.lastActiveTime = Date.now();
			})
		);

		// workspace切り替え時、新しく可視になった全leafをスタンプする
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				this.app.workspace.iterateAllLeaves((leaf) => {
					if (leaf.containerEl.isShown()) leaf.lastActiveTime = Date.now();
					else if (leaf.lastActiveTime === undefined) leaf.lastActiveTime = Date.now();
				});
			})
		);

		this.startCleanupLoop();

		this.addCommand({
			id: "purge-now",
			name: "今すぐ非アクティブタブを閉じる",
			callback: () => this.purgeInactiveTabs(),
		});

		console.log(
			`[LazyTabPurger] loaded — checking every ${this.settings.checkIntervalMin} min, ` +
			`threshold ${this.settings.inactiveThresholdMin} min`
		);
	}

	onunload() {
		this.stopCleanupLoop();
		console.log("[LazyTabPurger] unloaded — cleanup timer cleared");
	}

	startCleanupLoop() {
		this.stopCleanupLoop();
		this.cleanupTimer = setInterval(
			() => this.purgeInactiveTabs(),
			this.settings.checkIntervalMin * 60_000
		);
	}

	private stopCleanupLoop() {
		if (this.cleanupTimer !== null) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private isExcluded(filePath: string): boolean {
		return this.settings.excludePatterns.some((pattern) =>
			minimatch(filePath, pattern, { matchBase: true })
		);
	}

	private purgeInactiveTabs(): void {
		const now       = Date.now();
		const threshold = this.settings.inactiveThresholdMin * 60_000;
		const toClose: WorkspaceLeaf[] = [];

		console.log(`[LazyTabPurger] scanning...`);

		this.app.workspace.iterateAllLeaves((leaf) => {
			const isMarkdown  = leaf.getViewState().type === "markdown";
			const isVisible   = leaf.containerEl.isShown();
			const isPinned    = leaf.pinned ?? false;
			const lastActive  = leaf.lastActiveTime ?? now;
			const elapsed     = now - lastActive;
			const filePath    = (leaf.getViewState().state?.file as string | undefined) ?? "";
			const isExcluded  = filePath ? this.isExcluded(filePath) : false;

			console.log(
				`[LazyTabPurger] leaf="${leaf.getDisplayText()}" ` +
				`markdown=${isMarkdown} visible=${isVisible} pinned=${isPinned} excluded=${isExcluded} ` +
				`elapsed=${Math.round(elapsed / 1000)}s threshold=${threshold / 1000}s`
			);

			if (!isMarkdown) return;
			if (isVisible) return;
			if (isPinned) return;
			if (isExcluded) return;
			if (elapsed > threshold) toClose.push(leaf);
		});

		if (toClose.length > 0) {
			console.log(`[LazyTabPurger] closing ${toClose.length} inactive tab(s)`);
			toClose.forEach((leaf) => leaf.detach());
		} else {
			console.log(`[LazyTabPurger] nothing to close`);
		}
	}
}

class LazyTabPurgerSettingTab extends PluginSettingTab {
	plugin: LazyTabPurger;

	constructor(app: App, plugin: LazyTabPurger) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("放置タイムアウト（分）")
			.setDesc("バックグラウンドタブがこの時間を超えると自動で閉じられます。")
			.addText((text) =>
				text
					.setPlaceholder("60")
					.setValue(String(this.plugin.settings.inactiveThresholdMin))
					.onChange(async (value) => {
						const n = parseInt(value);
						if (!isNaN(n) && n > 0) {
							this.plugin.settings.inactiveThresholdMin = n;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("チェック間隔（分）")
			.setDesc("この間隔でバックグラウンドのタブをスキャンします。変更後は即時反映されます。")
			.addText((text) =>
				text
					.setPlaceholder("30")
					.setValue(String(this.plugin.settings.checkIntervalMin))
					.onChange(async (value) => {
						const n = parseInt(value);
						if (!isNaN(n) && n > 0) {
							this.plugin.settings.checkIntervalMin = n;
							await this.plugin.saveSettings();
							this.plugin.startCleanupLoop();
						}
					})
			);

		new Setting(containerEl)
			.setName("除外パターン")
			.setDesc(
				"自動クローズの対象外にするファイル・フォルダをグロブ形式で指定します（1行1パターン）。" +
				"例: 01_Daily/** / Templates/** / **/*.canvas"
			)
			.addTextArea((area) =>
				area
					.setPlaceholder("01_Daily/**\nTemplates/**")
					.setValue(this.plugin.settings.excludePatterns.join("\n"))
					.onChange(async (value) => {
						this.plugin.settings.excludePatterns = value
							.split("\n")
							.map((s) => s.trim())
							.filter((s) => s.length > 0);
						await this.plugin.saveSettings();
					})
			);
	}
}
