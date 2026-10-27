# 変更履歴

Keep a Changelog の形式。バージョンは Semantic Versioning。`manifest.json` の version が実際のバージョンで、このファイルと同じ値にします。

## [1.1.0] - 提出待ち

Chrome ウェブストアに出す版。

### Added

- 表示名を「note #検索」→「#検索スイッチ for note」に変更。`_locales/ja`・`_locales/en` と `default_locale` で UI 言語に合わせて切り替わります。
- `PRIVACY.md`（日本語・英語）。ストアのプライバシー欄に載せるポリシーです。
- ストア掲載文の下書き: `store/listing-ja.md`、`store/listing-en.md`、記入用 checklist `RELEASE_CHECKLIST.md`。
- Developer Dashboard の各欄に貼る文章をまとめた `store/submission-form.md`。
- ストア用の画像: アイコン 128x128、スクリーンショット 1280x800 を2枚、小さなプロモ画像 440x280（`store/assets/`）。他人の記事が映らないようスクリーンショットはぼかし入りです。
- `npm run validate` — manifest・掲載文の文字数・画像サイズ・権限・リモートコードの有無をまとめたリリースチェック（`scripts/validate.mjs`）。
- `npm run package` — ストア提出用の zip を `store/dist/` に生成（`scripts/package-store-bundle.mjs`）。拡張の実体だけを含み、test/ と scripts/ は除外します。
- GitHub Actions の CI（`.github/workflows/ci.yml`）。PR と push で validate + test + zip 作成、タグ `v*` で GitHub Release に zip を添付。
- `test/release.test.js` — リリースチェックと zip の中身をテスト実行に組み込み。

### Changed

- `package.json` に version・engines・scripts（`validate` / `package` / `release:check`）を追加。依存パッケージは増やしていません。
- README を新しい名前とストア導入の手順に更新。

## [1.0.1] - 2026-10-23

### Fixed

- content script を ES モジュールとして読み込めず、検索欄にスイッチが出ない問題を修正。`src/loader.js`（通常スクリプト）から `src/page.js` と `src/storage-bridge.js` を読み込みます（PR #1）。

## [1.0.0] - 2026-10-23

### Added

- 初めての公開（GitHub のみ）。検索欄に「#検索」スイッチを足し、オンのとき `https://note.com/search?q=%23<キーワード>&context=note&mode=search&sort=new` を開きます。
- `chrome.storage.local` によるスイッチ状態の保存と、`/search?q=%23...` を開いたときの自動オン。
- `src/search-url.js` の unit test（`node --test`）。
