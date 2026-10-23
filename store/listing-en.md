# Chrome Web Store listing (English)

## Name
Tag Newest Switch

## Short description (max 132 chars)
Adds a "#検索" switch to the note.com search box and lists hashtag posts newest first. Unofficial; not affiliated with note inc.

## Detailed description
On note.com, searching for `#tag` now opens an AI-curated tag page with fewer posts.

This extension adds a "#検索" (hashtag search) switch to the right side of the search box. With the switch on, a search opens `https://note.com/search?q=%23<keyword>&sort=new`, which lists hashtag posts newest first, close to the old tag search.

- Works in the header search box and on the search page.
- A leading `#` or `＃` in the keyword is optional.
- With the switch off, note.com search works as usual.
- The switch state is stored only in your browser. No data is sent anywhere.

Unofficial extension, not affiliated with or endorsed by note inc. "note" is a trademark of note inc. It may break if note.com changes its pages.

Source code: https://github.com/ozekimasaki/note-hashtag-search

## Single purpose
Let users list note.com hashtag posts newest first from the note.com search box.

## Permission justification
- `storage`: saves the on/off state of the "#検索" switch so it persists across pages.
- Host access (`https://note.com/*`, `https://www.note.com/*` in content_scripts and web_accessible_resources): adds the switch to note.com's search box and changes where the search goes. Runs on no other site.
- Remote code: none. All code is bundled in the package.

## Data usage disclosures
- Data collected: none (answer "No" for every category: personally identifiable info, health, financial, authentication, personal communications, location, web history, user activity, website content).
- Certify all three: not sold to third parties; not used for purposes unrelated to the single purpose; not used for creditworthiness or lending.
- Privacy policy URL: https://github.com/ozekimasaki/note-hashtag-search/blob/main/PRIVACY.md
