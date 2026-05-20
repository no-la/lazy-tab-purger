# Lazy Tab Purger

Obsidian plugin that automatically closes background Markdown tabs that have been inactive for a specified duration.

## Features

- **Automatic cleanup** — Scans background tabs at a configurable interval and closes any that have exceeded the inactivity threshold
- **Smart protection** — Never closes the active tab, tabs visible in split panes, or pinned tabs
- **Deferred tab support** — Correctly handles tabs that Obsidian has lazy-loaded (not yet rendered as a MarkdownView)
- **Workspace-aware** — Resets inactivity timestamps when switching workspaces, so tabs that were visible before a switch are not immediately purged
- **Exclude patterns** — Specify folders or files to protect permanently using glob patterns (e.g. `01_Daily/**`, `Templates/**`)
- **Manual command** — Run "今すぐ非アクティブタブを閉じる" from the command palette to purge immediately
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
| 放置タイムアウト（分） | 60 | Minutes of inactivity before a background tab is closed |
| チェック間隔（分） | 30 | How often to scan for inactive tabs |
| 除外パターン | _(none)_ | Glob patterns for files/folders to never auto-close (one per line) |

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
