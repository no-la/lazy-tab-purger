# CLAUDE.md

## コミット・PRメッセージ

すべて日本語で書く。

## テスト

```bash
npm test   # vitest run
```

- テストは `tests/` 以下に配置
- Obsidian API のモックは作らない方針
- 削除判定など純粋ロジックは `src/purge.ts` に切り出してテストする

## ビルド

```bash
node esbuild.config.mjs production
```

## リリース手順

1. feature ブランチで `manifest.json` と `package.json` のバージョンを bump
2. main へ PR → マージ
3. CI が自動でビルド・GitHub Release 作成

## CI

- `test.yml` — 全ブランチへの push・main への PR でテスト実行
- `release.yml` — main に `manifest.json` の変更が入ったとき自動リリース

## 配布ファイル

GitHub Release には `main.js` と `manifest.json` を含める（CSS なし）。
