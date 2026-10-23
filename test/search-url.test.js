import assert from "node:assert/strict";
import test from "node:test";
import {
  buildHashtagSearchUrl,
  isHashtagSearchLocation,
  stripLeadingHash,
} from "../src/search-url.js";

const AI_PARTNER = "AIパートナー";
const AI_PARTNER_URL =
  "https://note.com/search?q=%23AI%E3%83%91%E3%83%BC%E3%83%88%E3%83%8A%E3%83%BC&context=note&mode=search&sort=new";

test("stripLeadingHash removes a leading halfwidth or fullwidth hash", () => {
  assert.equal(stripLeadingHash(`#${AI_PARTNER}`), AI_PARTNER);
  assert.equal(stripLeadingHash(`＃${AI_PARTNER}`), AI_PARTNER);
  assert.equal(stripLeadingHash(`##＃${AI_PARTNER}`), AI_PARTNER);
  assert.equal(stripLeadingHash(`  #${AI_PARTNER}  `), AI_PARTNER);
  assert.equal(stripLeadingHash(AI_PARTNER), AI_PARTNER);
  assert.equal(stripLeadingHash(`AI#${AI_PARTNER}`), `AI#${AI_PARTNER}`);
  assert.equal(stripLeadingHash("#"), "");
  assert.equal(stripLeadingHash("＃"), "");
  assert.equal(stripLeadingHash("   "), "");
  assert.equal(stripLeadingHash(null), "");
});

test("buildHashtagSearchUrl matches the note.com workaround URL", () => {
  assert.equal(buildHashtagSearchUrl(AI_PARTNER), AI_PARTNER_URL);
  assert.equal(buildHashtagSearchUrl(`#${AI_PARTNER}`), AI_PARTNER_URL);
  assert.equal(buildHashtagSearchUrl(`＃${AI_PARTNER}`), AI_PARTNER_URL);
  assert.equal(buildHashtagSearchUrl(`  #${AI_PARTNER}  `), AI_PARTNER_URL);
});

test("buildHashtagSearchUrl encodes spaces and keeps a hash inside the keyword", () => {
  assert.equal(
    buildHashtagSearchUrl("hello world"),
    "https://note.com/search?q=%23hello+world&context=note&mode=search&sort=new",
  );
  assert.equal(
    buildHashtagSearchUrl("AI#note"),
    "https://note.com/search?q=%23AI%23note&context=note&mode=search&sort=new",
  );
});

test("buildHashtagSearchUrl returns null for an empty keyword", () => {
  assert.equal(buildHashtagSearchUrl(""), null);
  assert.equal(buildHashtagSearchUrl("#"), null);
  assert.equal(buildHashtagSearchUrl("＃"), null);
  assert.equal(buildHashtagSearchUrl("  #  "), null);
  assert.equal(buildHashtagSearchUrl(undefined), null);
});

test("isHashtagSearchLocation detects q starting with %23", () => {
  assert.equal(isHashtagSearchLocation(AI_PARTNER_URL), true);
  assert.equal(
    isHashtagSearchLocation(
      "https://note.com/search?q=%23AI&context=note&mode=search&sort=new",
    ),
    true,
  );
  assert.equal(
    isHashtagSearchLocation("https://www.note.com/search/?q=%EF%BC%83AI"),
    true,
  );
  assert.equal(
    isHashtagSearchLocation("https://note.com/search?q=AI&context=note"),
    false,
  );
  assert.equal(isHashtagSearchLocation("https://note.com/search?sort=new"), false);
  assert.equal(isHashtagSearchLocation("https://note.com/tag/AI"), false);
  assert.equal(
    isHashtagSearchLocation("https://example.com/search?q=%23AI"),
    false,
  );
  assert.equal(isHashtagSearchLocation("not a url"), false);
});
