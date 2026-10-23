# プライバシーポリシー / Privacy Policy

対象: #検索スイッチ for note（#Search Switch for note）　最終更新: 2026-10-23

## 日本語

この拡張は、個人情報を集めません。外部へデータを送ることもありません。

- **保存するもの**: 「#検索」スイッチのオン・オフ（`true` か `false` の1つだけ）。`chrome.storage.local` を使い、お使いのブラウザの中だけに保存します。同期はしません。拡張を削除すると消えます。
- **送信するもの**: ありません。拡張には、通信のコード（fetch など）も、分析・広告・計測のツールも入っていません。
- **ページの読み取り**: 動くのは `https://note.com/*` と `https://www.note.com/*` だけです。検索欄にスイッチを付け、スイッチがオンのときは、入力したキーワードから `https://note.com/search?q=%23<キーワード>&sort=new` のURLを作って移動します。キーワードを保存したり、ほかへ送ったりはしません。移動した先のページでは、note.com 自身のプライバシーポリシーが適用されます。
- **権限**: `storage`（スイッチの状態を保存するため）だけです。
- **第三者への提供**: しません。

この拡張は非公式で、note株式会社とは関係ありません。

問い合わせ先: https://github.com/ozekimasaki/note-hashtag-search/issues

## English

This extension does not collect personal data and does not send any data anywhere.

- **Stored**: one on/off value for the "#検索" switch, saved locally with `chrome.storage.local` (not synced). It is removed when you uninstall the extension.
- **Sent**: nothing. There is no network code, analytics, ads, or tracking.
- **Page access**: runs only on `https://note.com/*` and `https://www.note.com/*`. It adds a switch to the search box. When the switch is on, it turns your keyword into a `https://note.com/search?q=%23<keyword>&sort=new` URL and navigates there. Keywords are not stored or sent elsewhere. note.com's own privacy policy applies to note.com pages.
- **Permissions**: `storage` only.
- **Sharing with third parties**: none.

This is an unofficial extension, not affiliated with note inc.

Contact: https://github.com/ozekimasaki/note-hashtag-search/issues
