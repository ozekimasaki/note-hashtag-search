import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildBundle } from "../scripts/package-store-bundle.mjs";
import { LIMITS, runReleaseChecks } from "../scripts/validate.mjs";

test("リリースチェックが全部通る", () => {
  const failed = runReleaseChecks().filter((check) => !check.ok);
  assert.deepEqual(
    failed.map((check) => `${check.name} — ${check.detail}`),
    [],
  );
});

test("ストア用 zip は拡張の実体だけを入れる", () => {
  const outDir = mkdtempSync(path.join(tmpdir(), "nhs-bundle-"));
  try {
    const result = buildBundle({ outDir });
    const names = result.entries.map((entry) => entry.name);

    assert.deepEqual(path.basename(result.outPath), "note-hashtag-search-1.1.0.zip");
    assert.ok(names.includes("manifest.json"), "manifest.json は最直下に必要");
    assert.ok(names.includes("src/loader.js"));
    assert.ok(names.includes("src/page.js"));
    assert.ok(names.includes("_locales/ja/messages.json"));
    assert.ok(names.includes("_locales/en/messages.json"));
    assert.ok(names.includes("icons/icon128.png"));
    assert.equal(names.some((name) => /^(test|scripts|store|\.github|node_modules)\//.test(name)), false);
    assert.equal(names.some((name) => name.includes("..") || path.isAbsolute(name)), false);
    assert.equal(names.length, new Set(names).size);
    assert.ok(result.sha256.match(/^[0-9a-f]{64}$/));
    assert.equal(readFileSync(result.outPath).equals(result.zip), true);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("掲載文はストアの文字数制限に収まる", () => {
  for (const locale of ["ja", "en"]) {
    const messages = JSON.parse(
      readFileSync(new URL(`../_locales/${locale}/messages.json`, import.meta.url), "utf8"),
    );
    assert.ok(messages.extName.message.length <= LIMITS.name, `${locale} の名前が長い`);
    assert.ok(
      messages.extDescription.message.length <= LIMITS.description,
      `${locale} の説明が長い`,
    );
  }
});
