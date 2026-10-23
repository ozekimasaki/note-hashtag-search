/**
 * Pure helpers for note.com hashtag search URLs.
 * Kept free of DOM and chrome.* so node:test can import them.
 */

const HASH_PREFIX = /^[#\uFF03]+/;

/**
 * Remove leading halfwidth "#" and fullwidth "＃", then trim.
 * Hashes in the middle of the keyword are kept.
 * @param {unknown} rawQuery
 * @returns {string}
 */
export function stripLeadingHash(rawQuery) {
  const trimmed = String(rawQuery ?? "").trim();
  return trimmed.replace(HASH_PREFIX, "").trim();
}

/**
 * Build the workaround search URL.
 * Returns null when the keyword is empty after stripping hashes,
 * so the caller can leave note's own submit alone.
 * @param {unknown} rawQuery
 * @returns {string | null}
 */
export function buildHashtagSearchUrl(rawQuery) {
  const keyword = stripLeadingHash(rawQuery);
  if (!keyword) return null;

  const params = new URLSearchParams();
  params.set("q", `#${keyword}`);
  params.set("context", "note");
  params.set("mode", "search");
  params.set("sort", "new");
  return `https://note.com/search?${params.toString()}`;
}

/**
 * True when href is a note.com /search URL whose q starts with "#".
 * URLSearchParams decodes "%23" to "#", which is what the address bar shows
 * as q=%23...
 * @param {string} href
 * @returns {boolean}
 */
export function isHashtagSearchLocation(href) {
  let url;
  try {
    url = new URL(String(href));
  } catch {
    return false;
  }

  const host = url.hostname.toLowerCase();
  if (host !== "note.com" && host !== "www.note.com") return false;

  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/search") return false;

  const query = url.searchParams.get("q");
  if (query == null) return false;
  return query.startsWith("#") || query.startsWith("\uFF03");
}
