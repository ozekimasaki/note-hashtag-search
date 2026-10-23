# note #検索

note.com の検索欄に「#検索」スイッチを足す Chrome 拡張です（Manifest V3、ビルド不要）。

タグ名（`#タグ`）で検索すると、note の AI がまとめたタグページ（`/tag/...`）だけが開きます。記事の件数は少なめです。キーワードから `#` を外して検索し、URL の `q` の先頭だけ `%23` にすると、以前のタグ検索に近い一覧が新しい順で返ります。

```
https://note.com/search?q=%23AIパートナー&context=note&mode=search&sort=new
```

この拡張は、スイッチがオンのときその URL へ直接移動します。note 自身のタグページへの遷移は、検索の送信時点で止めます。

## 読み込み方（パッケージ化されていない拡張機能）

1. Chrome で `chrome://extensions` を開く。
2. 右上の「デベロッパーモード」をオンにする。
3. 「パッケージ化されていない拡張機能を読み込む」を押す。
4. このフォルダ（`manifest.json` がある場所）を選ぶ。
5. note.com を開き直す。

更新したあとは、拡張機能カードの再読み込みボタンを押してからページを再読み込みしてください。

## 使い方

検索欄の右端に「#検索」スイッチが付きます。ヘッダーの検索と、`/search` の検索欄の両方が対象です。画面幅が狭いときの検索欄にも付きます。

1. スイッチをオンにする。
2. キーワードを入れる。先頭の `#` や `＃` はあってもなくても同じです。
3. Enter、または虫眼鏡ボタンで検索する。

オンのときは、次の URL を開きます。

`https://note.com/search?q=%23<キーワード>&context=note&mode=search&sort=new`

オフのときは、note の検索のままです。スイッチの状態は `chrome.storage.local` に保存され、別のページへ移っても残ります。

`/search` を開いたとき、`q` が `%23` で始まっていればスイッチはオンになります。

## テスト

Node.js 18 以降で、このフォルダから実行します。

```bash
node --test
```

`npm test` でも同じです。依存パッケージのインストールは不要です。

## 動作メモ

2026-10-23 時点の note.com で、実際の画面にスイッチを出して確認しています。

- デスクトップのヘッダーは `form[action="/search"][role="search"]` と `input[type="search"][name="q"]`。
- 狭い画面では、同じ見出しの `form[role="search"]` と `input[type="text"]`（`aria-label="キーワードやクリエイターで検索"`）。
- トップページと `/search` のどちらも、この2つのフォームだけだった。
- `q=%23AI` の検索 URL は 200 のまま `/search` に留まる。`/hashtag/AI` は `/tag/AI` へリダイレクトする。

検索欄はページ遷移のたびに描き直されるため、`MutationObserver` で付け直します。入力欄が見つからないときは `input[type="search"]` やヘッダー内の検索欄へフォールバックします。

検索候補（サジェスト）のクリックは note 側の遷移のままです。スイッチが効くのは、Enter と検索ボタンによる送信です。日本語入力の変換中の Enter では検索しません。

## 注意

非公式の拡張です。note株式会社とは関係ありません。note の画面や検索 URL の仕様が変わると動かなくなることがあります。

## ライセンス

MIT License（`LICENSE` を参照）

---

## English (short)

Unofficial Chrome extension (Manifest V3, no build) that adds a "#検索" toggle to note.com search. When on, it opens `https://note.com/search?q=%23<keyword>&context=note&mode=search&sort=new` to list hashtag posts newest-first. Load via `chrome://extensions` → Developer mode → Load unpacked. Not affiliated with note inc. MIT License.
