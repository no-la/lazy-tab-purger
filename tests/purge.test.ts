import { describe, it, expect } from "vitest";
import { isExcluded, shouldClose } from "../src/purge";

// ── isExcluded ────────────────────────────────────────────────────────────────

describe("isExcluded", () => {
	it("パターンなしは除外しない", () => {
		expect(isExcluded("01_Daily/2024-01-01.md", [])).toBe(false);
	});

	it("フォルダグロブに一致するファイルは除外する", () => {
		expect(isExcluded("01_Daily/2024-01-01.md", ["01_Daily/**"])).toBe(true);
	});

	it("拡張子グロブに一致するファイルは除外する", () => {
		expect(isExcluded("diagrams/foo.canvas", ["**/*.canvas"])).toBe(true);
	});

	it("パターンに一致しないファイルは除外しない", () => {
		expect(isExcluded("Projects/todo.md", ["01_Daily/**"])).toBe(false);
	});

	it("複数パターンのうち1つでも一致すれば除外する", () => {
		expect(isExcluded("Templates/weekly.md", ["01_Daily/**", "Templates/**"])).toBe(true);
	});

	// matchBase: true の検証 — パスを含まないパターンがベース名で一致することを確認
	it("matchBase: *.md がパス付きファイルのベース名に一致する", () => {
		expect(isExcluded("Notes/hello.md", ["*.md"])).toBe(true);
	});

	it("matchBase: *.canvas がネストしたパスのベース名に一致する", () => {
		expect(isExcluded("a/b/c/foo.canvas", ["*.canvas"])).toBe(true);
	});

	it("matchBase: 拡張子が異なるファイルは一致しない", () => {
		expect(isExcluded("Notes/hello.md", ["*.canvas"])).toBe(false);
	});

	it("空文字パターンはどのファイルにも一致しない", () => {
		expect(isExcluded("Notes/hello.md", [""])).toBe(false);
	});
});

// ── shouldClose ───────────────────────────────────────────────────────────────

const BASE = {
	isMarkdown: true,
	isVisible: false,
	isPinned: false,
	filePath: "Notes/hello.md",
	elapsed: 7_200_000,   // 2h
	threshold: 3_600_000, // 1h
	excludePatterns: [] as string[],
};

describe("shouldClose", () => {
	it("全条件を満たすとき閉じる", () => {
		expect(shouldClose(BASE)).toBe(true);
	});

	it("markdown でないタブは閉じない", () => {
		expect(shouldClose({ ...BASE, isMarkdown: false })).toBe(false);
	});

	it("表示中のタブは閉じない", () => {
		expect(shouldClose({ ...BASE, isVisible: true })).toBe(false);
	});

	it("ピン留めタブは閉じない", () => {
		expect(shouldClose({ ...BASE, isPinned: true })).toBe(false);
	});

	it("閾値未満の経過時間は閉じない", () => {
		expect(shouldClose({ ...BASE, elapsed: 1_800_000 })).toBe(false);
	});

	it("経過時間が閾値ちょうどは閉じない", () => {
		expect(shouldClose({ ...BASE, elapsed: 3_600_000 })).toBe(false);
	});

	it("除外パターンに一致するファイルは閉じない", () => {
		expect(shouldClose({ ...BASE, filePath: "01_Daily/2024-01-01.md", excludePatterns: ["01_Daily/**"] })).toBe(false);
	});

	it("filePath が空文字のとき elapsed > threshold なら閉じる", () => {
		expect(shouldClose({ ...BASE, filePath: "", excludePatterns: ["**"] })).toBe(true);
	});

	it("elapsed が 0 のとき閉じない", () => {
		expect(shouldClose({ ...BASE, elapsed: 0 })).toBe(false);
	});

	it("threshold が 0 のとき elapsed > 0 なら閉じる", () => {
		expect(shouldClose({ ...BASE, threshold: 0, elapsed: 1 })).toBe(true);
	});
});
