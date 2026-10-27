# #検索スイッチ for note

note.com の検索欄に「#検索」スイッチを足す Chrome 拡張です（Manifest V3、ビルド不要）。

Chrome ウェブストア: `<未記入: ストアの URL>`（提出済みになったら [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) の 2.3 を埋めてください）

## これは何をするのか

note.com で `#タグ` を検索すると、いまは AI がまとめたタグページ（`/tag/...`）だけが開き、記事は少なめに出ます。

キーワードから `#` を外して検索し、URL の `q` の先頭だけ `%23` にすると、以前のタグ検索に近い一覧が新しい順で返ります。

```
https://note.com/search?q=%23AIパートナー&context=note&mode=search&sort=new
```

スイッチがオンのとき、この拡張はその URL へ直接移動します。note 自身のタグページへの遷移は、検索の送信時点で止めます。

## 入れ方

### Chrome ウェブストアから（公開後）

ストアの URL にアクセスして「Chrome に追加」を押すだけです。

### 手元で読み込む（パッケージ化されていない拡張機能）

1. このリポジトリをダウンロードするか `git clone` する。
2. Chrome で `chrome://extensions` を開く。
3. 右上の「デベロッパーモード」をオンにする。
4. 「パッケージ化されていない拡張機能を読み込む」を押す。
5. `manifest.json` があるフォルダを選ぶ。
6. note.com を開き直す。

更新したあとは、拡張機能カードの再読み込みボタンを押してからページを再読み込みしてください。

## 使い方

検索欄の右端に「#検索」スイッチが付きます。ヘッダーの検索と、`/search` の検索欄の両方が対象です。画面幅が狭いときの検索欄にも付きます。

1. スイッチをオンにする。
2. キーワードを入れる。先頭の `#` や `＃` はあってもなくても同じです。
3. Enter、または虫眼鏡ボタンで検索する。

オンのときは、次を開きます。

`https://note.com/search?q=%23<キーワード>&context=note&mode=search&sort=new`

オフのときは、note の検索のままです。スイッチの状態は `chrome.storage.local` に保存され、別のページへ移っても残ります。ブラウザの中だけにあり、外へは送りません（[PRIVACY.md](PRIVACY.md)）。

`/search` を開いたとき、`q` が `%23` で始まっていればスイッチはオンになります。

## コマンド

依存パッケージのインストールは不要です（Node.js 18 以降）。

```bash
npm test            # search-url の unit test とリリースチェック
npm run validate    # manifest・掲載文の文字数・画像・権限・リモートコードの有無
npm run package     # ストア提出用 zip を store/dist/ に生成
npm run release:check   # validate + test + package をまとめて
```

## リリース

提出までに埋める必要事項は [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)、ダッシュボードの各欄に貼る文章は [store/submission-form.md](store/submission-form.md) にまとめてあります。

- 掲載文の下書き: [store/listing-ja.md](store/listing-ja.md) / [store/listing-en.md](store/listing-en.md)
- 変更履歴: [CHANGELOG.md](CHANGELOG.md)
- 名前の文言は `_locales/ja/messages.json` と `_locales/en/messages.json` にあります（ストアには入力欄がなく、ここから読まれます）

## 動作メモ

2026-10-28 に note.com の実 DOM で確認したところ。

- 狭い画面（`md` を下回る幅）: `form[role="search"]` と `input[type="text"][aria-label="キーワードやクリエイターで検索"]`。このころの画面には検索フォームが1つだけ描画されていた。
- デスクトップのヘッダー: `form[action="/search"][role="search"]` と `input[type="search"][name="q"]`。
- `q=%23AI` を入れた検索 URL は 200 のまま `/search` に留まり、入力は `#AI` の状態で再描画される。`/hashtag/AI` は `/tag/AI` へリダイレクトする。

検索欄はページ遷移のたびに描き直されるため、`MutationObserver` で付け直します。入力欄が見つからないときは `input[type="search"]` やヘッダー内の検索欄、`aria-label` へフォールバックします（`src/page.js` の `INPUT_SELECTORS`）。

Manifest V3 の `content_scripts` は ES モジュールとして読み込めないため、`src/loader.js`（通常スクリプト）経由で `src/page.js` と `src/storage-bridge.js` を読み込みます。

検索候補（サジェスト）のクリックは note 側の遷移のままです。スイッチが効くのは、Enter と検索ボタンによる送信です。日本語入力の変換中の Enter では検索しません。

## 注意

非公式の拡張です。note株式会社とは関係ありません。「note」は note株式会社の商標です。note の画面や検索 URL の仕様が変わると動かなくなることがあります。壊れたときは issue まで。

## ライセンス

MIT License（[LICENSE](LICENSE) を参照）

---

## English (short)

Unofficial Chrome extension (Manifest V3, no build step) that adds a "#検索" toggle to the note.com search box. When the toggle is on, a search opens `https://note.com/search?q=%23<keyword>&context=note&mode=search&sort=new`, which lists hashtag posts newest first. It stores only the toggle state, locally, and makes no network requests. Not affiliated with note inc. MIT License.
