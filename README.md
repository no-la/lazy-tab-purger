# Lazy Tab Purger

[English](#lazy-tab-purger) | [日本語](#lazy-tab-purger日本語)

**Contents**
- [Features](#features) / [機能](#機能)
- [Installation](#installation) / [インストール](#インストール)
- [Configuration](#configuration) / [設定](#設定)
- [How it works](#how-it-works) / [仕組み](#仕組み)

---

Obsidian plugin that automatically closes background Markdown tabs that have been inactive for a specified duration.

## Features

- **Automatic cleanup** — Scans background tabs at a configurable interval and closes any that have exceeded the inactivity threshold
- **Smart protection** — Never closes the active tab, tabs visible in split panes, or pinned tabs
- **Deferred tab support** — Correctly handles tabs that Obsidian has lazy-loaded (not yet rendered as a MarkdownView)
- **Workspace-aware** — Resets inactivity timestamps when switching workspaces, so tabs that were visible before a switch are not immediately purged
- **Exclude patterns** — Specify folders or files to protect permanently using glob patterns (e.g. `01_Daily/**`, `Templates/**`)
- **Manual command** — Run "Purge inactive tabs now" from the command palette to purge immediately
- **Desktop only** — No effect on mobile

## Installation

### Via BRAT (recommended for beta)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from the community plugins
2. Open BRAT settings → **Add Beta plugin**
3. Enter `no-la/lazy-tab-purger`
4. Enable the plugin in Settings → Community plugins

### Manual

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/no-la/lazy-tab-purger/releases/latest)
2. Copy them to `.obsidian/plugins/lazy-tab-purger/` inside your vault
3. Enable the plugin in Settings → Community plugins

## Configuration

| Setting | Default | Description |
|---|---|---|
| Inactivity timeout (minutes) | 60 | Minutes of inactivity before a background tab is closed |
| Check interval (minutes) | 30 | How often to scan for inactive tabs |
| Exclude patterns | _(none)_ | Glob patterns for files/folders to never auto-close (one per line) |

### Exclude pattern examples

```
01_Daily/**
Templates/**
00_Inbox/**
**/*.canvas
```

Patterns are matched against the vault-relative file path. Standard glob syntax (`*`, `**`, `?`) is supported.

## How it works

1. Every time you switch tabs, the current tab is stamped with the current timestamp (`lastActiveTime`)
2. At each check interval, all background Markdown tabs are scanned
3. Any tab whose `lastActiveTime` exceeds the inactivity threshold is closed via `leaf.detach()`
4. Tabs that are active, visible in a split pane, pinned, or matching an exclude pattern are always protected

---

# Lazy Tab Purger（日本語）

放置されたバックグラウンドの Markdown タブを自動で閉じる Obsidian プラグインです。

## 機能

- **自動クリーンアップ** — 設定した間隔でバックグラウンドタブをスキャンし、放置時間を超えたものを自動で閉じます
- **スマートな保護** — アクティブなタブ・split で表示中のタブ・ピン留めされたタブは絶対に閉じません
- **遅延ロード対応** — Obsidian が lazy-load しているタブ（未レンダリングのもの）も正しく検出します
- **ワークスペース対応** — ワークスペース切り替え時に表示されていたタブのタイムスタンプをリセットするため、切り替え直後に誤って閉じることがありません
- **除外パターン** — グロブ形式で特定のフォルダやファイルを保護対象にできます（例: `01_Daily/**`、`Templates/**`）
- **手動実行コマンド** — コマンドパレットから「今すぐ非アクティブタブを閉じる」でいつでも即時実行できます
- **デスクトップ専用** — モバイルでは動作しません

## インストール

### BRAT を使う方法（ベータ版として推奨）

1. コミュニティプラグインから [BRAT](https://github.com/TfTHacker/obsidian42-brat) をインストール
2. BRAT の設定を開き **「Add Beta plugin」** をクリック
3. `no-la/lazy-tab-purger` を入力
4. 設定 → コミュニティプラグインでプラグインを有効化

### 手動インストール

1. [最新リリース](https://github.com/no-la/lazy-tab-purger/releases/latest) から `main.js` と `manifest.json` をダウンロード
2. Vault 内の `.obsidian/plugins/lazy-tab-purger/` にコピー
3. 設定 → コミュニティプラグインでプラグインを有効化

## 設定

| 項目 | デフォルト | 説明 |
|---|---|---|
| Inactivity timeout (minutes) — 放置タイムアウト（分） | 60 | この時間を超えたバックグラウンドタブを閉じます |
| Check interval (minutes) — チェック間隔（分） | 30 | スキャンを実行する間隔 |
| Exclude patterns — 除外パターン | _(なし)_ | 自動クローズの対象外にするファイル・フォルダ（1行1パターン） |

### 除外パターンの例

```
01_Daily/**
Templates/**
00_Inbox/**
**/*.canvas
```

パターンは Vault ルートからの相対パスに対してマッチします。標準的なグロブ構文（`*`、`**`、`?`）が使えます。

## 仕組み

1. タブを切り替えるたびに、そのタブに現在時刻（`lastActiveTime`）を記録
2. チェック間隔ごとに、すべてのバックグラウンド Markdown タブをスキャン
3. `lastActiveTime` が放置タイムアウトを超えているタブを `leaf.detach()` で閉じる
4. アクティブ・split 表示中・ピン留め・除外パターン一致のタブは常に保護
