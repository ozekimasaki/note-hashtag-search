# リリース checklist（提出までに埋める必要事項）

Chrome ウェブストアへ 1.1.0 を出すまでの記入用ファイルです。`<未記入>` と書かれたところを埋めていきます。
各欄に貼る文章そのものは [store/submission-form.md](store/submission-form.md) に順番どおりあるので、コピーするだけです。

## 1. いまの状態

- [x] 拡張のコード（Manifest V3、ビルド不要）
- [x] content script の読み込み修正（PR #1 / 1.0.1）
- [x] 名前を「#検索スイッチ for note」に変更、ロケール ja / en を追加
- [x] `PRIVACY.md`（日本語・英語）
- [x] 掲載文の下書き（`store/listing-ja.md` / `store/listing-en.md`）
- [x] 画像 4 点（アイコン 128、スクリーンショット 1280x800 x2、プロモ 440x280）
- [x] `npm run validate`（リリースチェック）と `npm run package`（提出用 zip）
- [x] CI（テスト + zip 作成、タグで GitHub Release）
- [x] note.com の実 DOM で検索欄の selector と `q=%23...&sort=new` の挙動を確認（2026-10-28）
- [ ] Developer Dashboard での提出 ← ここから下を埋める

## 2. 必要事項の記入欄

### 2.1 出す前にはたらく枠

| 項目 | 決定・記入 | メモ |
|---|---|---|
| Chrome ウェブストア開発者登録 | `<未記入: 済/未>` | 登録料 US$5 を1回だけ。18歳以上、Google アカウントは本名で登録 |
| 開発者登録の日付 | `<未記入>` | 審査の日付管理に使う |
| 支払った方法 | `<未記入>` | レシートは保管 |
| main にマージ済みか | `<未記入>` | `PRIVACY.md` の URL は main に載っていないと 404 になる |
| バージョン | `1.1.0` | `manifest.json` と `package.json` と `CHANGELOG.md` が同じ値か |
| zip の場所 | `store/dist/note-hashtag-search-1.1.0.zip` | `npm run package` で作る。git には入れない |
| zip の SHA-256 | `<未記入>` | `npm run package` の出力を貼る |

### 2.2 ダッシュボードで選ぶ欄（推奨値が決まっているもの）

| 欄 | 値 | 出典 |
|---|---|---|
| 名前 | `_locales/*/messages.json` から自動で読める（入力欄なし） | ja: `#検索スイッチ for note` / en: `#Search Switch for note` |
| 短い説明 | 同じく自動（132 字以内） | `scripts/validate.mjs` が文字数を検査する |
| カテゴリ | `Productivity`（仕事効率化） | 別の候補は `Tools` |
| 言語 | `日本語 — Japanese` | en の掲載文も入れる |
| 支払い | `Free of charge` | 無料 |
| 公開設定 | `Public` | 先に少人数で試すなら `Unlisted` に変える |
| 地域 | `All regions` | 日本だけにしたい場合は `Japan` |
| 成人向け | オフ | |
| 公式サイト（Official URL） | `None` | github.com は自分のサイトとして確認できない |
| Homepage URL | `https://github.com/ozekimasaki/note-hashtag-search` | |
| Support URL | `https://github.com/ozekimasaki/note-hashtag-search/issues` | |
| Privacy policy URL | `https://github.com/ozekimasaki/note-hashtag-search/blob/main/PRIVACY.md` | main にマージ後に開くことを確認 |
| リモートコード | `No, I am not using remote code` | すべてのコードがパッケージ内 |
| データの使用 | すべて「集めない」、3つの certification にチェック | |

### 2.3 公開後に埋めに戻る欄

| 項目 | 記入 |
|---|---|
| アイテム ID | `<未記入: kk... 形式>` |
| ストアの URL | `<未記入: https://chromewebstore.google.com/detail/...>` |
| 提出日 | `<未記入>` |
| 審査結果 / 日付 | `<未記入>` |
| 公開日 | `<未記入>` |
| GitHub Release のリンク | `<未記入>` |
| 審査で指摘されたこと | `<未記入>` |
| インストール数の確認日 | `<未記入>` |

## 3. 提出手順

```bash
git checkout main && git pull            # store-prep をマージ後
npm run release:check                    # validate + test + zip 作成
unzip -l store/dist/note-hashtag-search-1.1.0.zip   # 中身を目視
```

1. `https://chrome-devtools-purchases.google.com/dashboard/`（Developer Dashboard）へ登録。US$5 を支払う。
2. Chrome ウェブストアのデベロッパープログラムポリシーと、[シングルパーパスの要件](https://developer.chrome.com/docs/webstore/program-policies/single-purpose) を読み、拡張が1つの用途に絞れていることを確認する。
3. 「新しいアイテムを追加」→ zip をアップロード。
4. Store listing の欄に `store/submission-form.md` の 1 章を貼る（ja / en を両方）。
5. Graphic assets に `store/assets/` の画像を放り込む。スクリーンショットは1280x800。
6. Privacy の欄に 2 章を貼る。権限の理由・リモートコード No・データは集めない。
7. Distribution は 3 章どおり（無料 / Public / 全地域）。
8. 「審査に提出」を押す。審査は数日〜2週間ほど。
9. 通ったら ストアの URL を入手。このファイルの 2.3 と README の `<未記入>` を埋めて PR を出す。
10. タグ `v1.1.0` を打つと CI が GitHub Release に zip を添付する。

## 4. 更新リリースを出すとき

1. `manifest.json` と `package.json` の version を上げる（ストアは同じバージョンでは再提出できない）。
2. `CHANGELOG.md` に追記。
3. `npm run release:check` を通す。
4. PR をマージ → タグ → CI が Release を作る。
5. Developer Dashboard に新しい zip をアップロードして「提出」。item id は変わらない。

## 5. 却下されやすい点と対処

| 起こること | 対処 |
|---|---|
| 用途が複数に見える（single purpose 違反） | 掲載文は「ハッシュタグの記事を新しい順に出す」の1点に絞った書き方にしてある。追加機能は版を分けて出す |
| 権限の理由が弱い | `storage` と note.com だけのホスト、という理由を 2 章に書いた。ホストを増やすときは理由も追記する |
| ストアの画像が他人の記事を映している | 2 枚ともぼかし済み。note.com の画面が変わったら撮り直す |
| プライバシーポリシー URL が開けない | main にマージされた後だけ動く。`https://github.com/ozekimasaki/note-hashtag-search/blob/main/PRIVACY.md` をブラウザで確認してから貼る |
| 「note」の商標 | 名前は独自（#検索スイッチ for note）。「非公式・note株式会社とは無関係・note は note株式会社の商標」を説明と PRIVACY に書いてある |
| note.com の画面変更でスイッチが出ない | selector を複数持たせてフォールバックする作り。`src/page.js` の `INPUT_SELECTORS` を直す → テスト → 即リリースの流れで対応する |
| ツールバーのアイコンを押すと何も起きない | `manifest.json` の `action` は popup も service worker も持たない（アイコン表示のためだけ）。審査から質問が来たら「設定画面を持たないため、押すと何もしません」と答える。それでも NG なら `action` を削れば `icons` だけで済む |
| 検索欄の上に出たスイッチがクリックしにくい | 実機で確認して必要なら `src/content.css` を調整（レビュー依頼は GitHub の issue へ） |

## 6. 参考リンク

- 提出手順: https://developer.chrome.com/docs/webstore/publish
- 掲載情報の欄: https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- プライバシー欄: https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- 配布設定: https://developer.chrome.com/docs/webstore/cws-dashboard-distribution
- アイテムの要件: https://developer.chrome.com/docs/webstore/item-scan-guidelines
