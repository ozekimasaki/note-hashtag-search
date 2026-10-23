# Chrome ウェブストア 提出フォーム（貼り付け用）

Developer Dashboard のタブと欄の名前の順に並べています（参照: https://developer.chrome.com/docs/webstore/cws-dashboard-listing 、 https://developer.chrome.com/docs/webstore/cws-dashboard-privacy 、 https://developer.chrome.com/docs/webstore/cws-dashboard-distribution ）。提出はまだしていません。

アップロードするパッケージ: `/workspace/archives/dev/note-hashtag-search/store/note-hashtag-search-1.1.0.zip`

拡張の名前と短い説明は、パッケージの `_locales/*/messages.json` から読み込まれます（ダッシュボードには入力欄がありません）。
- ja: 名前「タグ新着スイッチ」／説明「note.com の検索欄に「#検索」スイッチを足し、ハッシュタグの記事を新しい順に一覧します。非公式の拡張です。」
- en: Name "Tag Newest Switch" / Description "Adds a "#検索" switch to the note.com search box and lists hashtag posts newest first. Unofficial; not affiliated with note inc."

---

## 1. Store listing（ストアの掲載情報）

ページ上部の言語の切り替えで、日本語（ja）と英語（en）をそれぞれ入力します。

### Product details
**Description（説明）— ja**
```
note.com で #タグ を検索すると、今は AI がまとめたタグページが開き、記事は少なめに表示されます。

この拡張は、検索欄の右端に「#検索」スイッチを足します。スイッチをオンにして検索すると、https://note.com/search?q=%23<キーワード>&sort=new を開きます。以前のタグ検索に近い一覧が、新しい順に並びます。

・ヘッダーの検索欄と、検索ページの検索欄の両方で使えます。
・キーワードの先頭の # や ＃ は、あってもなくても同じ結果になります。
・オフのときは、note.com のいつもの検索のままです。
・スイッチの状態はブラウザの中だけに保存します。データの送信はしません。

この拡張は非公式で、note株式会社とは関係ありません。「note」は note株式会社の商標です。note.com の画面が変わると、動かなくなることがあります。

ソースコード: https://github.com/ozekimasaki/note-hashtag-search
```

**Description — en**
```
On note.com, searching for #tag now opens an AI-curated tag page with fewer posts.

This extension adds a "#検索" (hashtag search) switch to the right side of the search box. With the switch on, a search opens https://note.com/search?q=%23<keyword>&sort=new, which lists hashtag posts newest first, close to the old tag search.

- Works in the header search box and on the search page.
- A leading # or ＃ in the keyword is optional.
- With the switch off, note.com search works as usual.
- The switch state is stored only in your browser. No data is sent anywhere.

Unofficial extension, not affiliated with or endorsed by note inc. "note" is a trademark of note inc. It may break if note.com changes its pages.

Source code: https://github.com/ozekimasaki/note-hashtag-search
```

**Category（カテゴリ）**: `Productivity`（仕事効率化）。別の候補は `Tools`。
**Language（言語）**: `日本語 — Japanese`

### Graphic assets
| 欄 | ファイル |
|---|---|
| Store icon（128x128） | `store/assets/icon-128.png` |
| Screenshots（1280x800、1〜5枚） | `store/assets/screenshot-1-switch-off.png`、`store/assets/screenshot-2-hashtag-newest.png` |
| Small promo tile（440x280） | `store/assets/promo-small-440x280.png` |
| Marquee promo tile（1400x560） | なし（任意） |
| Global promo video | なし（任意） |

### Additional fields
- **Official URL**: 「None」のまま。確認済みのサイトがある場合だけ選べます。github.com は自分のサイトとして確認できません。
- **Homepage URL**: `https://github.com/ozekimasaki/note-hashtag-search`
- **Support URL**: `https://github.com/ozekimasaki/note-hashtag-search/issues`
- **Mature content**: オフ

---

## 2. Privacy（プライバシーへの取り組み）

**Single purpose description（単一用途の説明）**
```
note.com の検索で、ハッシュタグの記事を新しい順に一覧できるようにする。 / Let users list note.com hashtag posts newest first from the note.com search box.
```

**Permission justification（権限の理由）**
- `storage`:
```
「#検索」スイッチのオン・オフを chrome.storage.local に保存し、ページを移っても同じ状態にするためです。 / Saves the on/off state of the "#検索" switch in chrome.storage.local so it persists across pages.
```
- **Host permission justification**（content_scripts と web_accessible_resources の matches: `https://note.com/*`、`https://www.note.com/*`）:
```
note.com の検索欄にスイッチを付け、オンのときだけ検索の送り先を note.com/search?q=%23<キーワード>&sort=new に変えるためです。ほかのサイトでは動きません。 / Adds the switch to note.com's search box and, when it is on, changes the search destination to note.com/search?q=%23<keyword>&sort=new. Runs on no other site.
```

**Are you using remote code?（リモートコードを使っていますか）**: `No, I am not using remote code`
```
動かすコードはすべてパッケージの中にあります（src/loader.js から、同じパッケージの src/page.js と src/storage-bridge.js を chrome.runtime.getURL で読み込みます）。 / All code is bundled in the package; src/loader.js loads src/page.js and src/storage-bridge.js from the same package via chrome.runtime.getURL.
```

**Data usage（データの使用）: What user data do you plan to collect**: どれにもチェックを付けません。
Personally identifiable information／Health information／Financial and payment information／Authentication information／Personal communications／Location／Web history／User activity／Website content

**Certifications**: 次の3つすべてにチェックを付けます。
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL**: `https://github.com/ozekimasaki/note-hashtag-search/blob/main/PRIVACY.md`（store-prep をマージしたあとに有効になります）

---

## 3. Distribution（配布）

- **Payments（支払い）**: `Free of charge`（無料）
- **Visibility（公開設定）**: `Public`（公開）。まず限られた人に試してもらうなら `Unlisted`（限定公開）。
- **Distribution / Regions（地域）**: `All regions`（すべての地域）。日本の利用者に絞るなら `Japan` だけにします。

---

## 4. 審査担当への説明（Test instructions がある場合はそこに。なければ Single purpose の欄の後ろに足します）

```
No account or login is needed.
1. Install the extension.
2. Open https://note.com/search?q=AI&context=note&mode=search
3. A "#検索" toggle appears at the right end of the search box in the page header.
4. Turn it on, type a keyword (e.g. 読書) in the header search box, and press Enter.
5. The page navigates to https://note.com/search?q=%23読書&context=note&mode=search&sort=new (hashtag posts, newest first).
6. Turn it off: search behaves as note.com's default. The state is stored only via chrome.storage.local; the extension makes no network requests.
```
