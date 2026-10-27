// Release checks for the Chrome Web Store submission.
// Run directly (`npm run validate`) or from node:test via runReleaseChecks().

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const LIMITS = {
  name: 75,
  description: 132,
  screenshotBytes: 5 * 1024 * 1024,
  iconBytes: 1024 * 1024,
};

const ALLOWED_HOST_MATCHES = new Set(["https://note.com/*", "https://www.note.com/*"]);
const ALLOWED_API_PERMISSIONS = new Set(["storage"]);

// Code fetched from the network would fail review; only bundled code is allowed.
const REMOTE_CODE_PATTERNS = [
  [/\bfetch\s*\(/, "fetch()"],
  [/\bXMLHttpRequest\b/, "XMLHttpRequest"],
  [/\bEventSource\b/, "EventSource"],
  [/\bWebSocket\b/, "WebSocket"],
  [/\bimportScripts\s*\(/, "importScripts()"],
  [/\beval\s*\(/, "eval()"],
  [/\bnew\s+Function\s*\(/, "new Function()"],
  [/import\s*\(\s*["'`]https?:/, "dynamic import of an http(s) URL"],
  [/src\s*=\s*["'`]https?:/, "script src pointing at a remote URL"],
];

/** @typedef {{name: string, ok: boolean, detail: string}} Check */

function pngSize(file) {
  const buffer = readFileSync(file);
  const isPng = buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  if (!isPng) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), buffer };
}

function readJson(root, relative) {
  return JSON.parse(readFileSync(path.join(root, relative), "utf8"));
}

function listFiles(root, dir) {
  const out = [];
  const base = path.join(root, dir);
  if (!existsSync(base)) return out;
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(root, relative));
    else if (entry.isFile()) out.push(relative);
  }
  return out.sort();
}

function syntaxCheck(root, file) {
  const source = readFileSync(path.join(root, file), "utf8");
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--check", "-"],
    { input: source, encoding: "utf8" },
  );
  return { ok: result.status === 0, error: (result.stderr || result.stdout || "").trim() };
}

/**
 * @param {string} [root]
 * @returns {Check[]}
 */
export function runReleaseChecks(root = REPO_ROOT) {
  /** @type {Check[]} */
  const checks = [];
  const add = (name, ok, detail = "") => checks.push({ name, ok: Boolean(ok), detail });

  let manifest;
  try {
    manifest = readJson(root, "manifest.json");
    add("manifest.json は valid JSON", true);
  } catch (error) {
    add("manifest.json は valid JSON", false, String(error));
    return checks;
  }

  add("manifest_version は 3", manifest.manifest_version === 3, String(manifest.manifest_version));

  const msgKey = /^__MSG_(.+)__$/;
  for (const field of ["name", "description"]) {
    const match = msgKey.exec(String(manifest[field] ?? ""));
    add(`${field} はロケール参照`, Boolean(match), manifest[field]);
  }

  const defaultLocale = manifest.default_locale;
  add(
    "default_locale が設定されている",
    typeof defaultLocale === "string" && defaultLocale.length > 0,
    defaultLocale,
  );

  const localeDir = path.join(root, "_locales");
  const locales = existsSync(localeDir)
    ? readdirSync(localeDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : [];
  add("デフォルトロケールが存在する", locales.includes(defaultLocale), locales.join(", "));
  add("ロケールは ja と en の2つ", locales.length === 2 && locales.includes("ja") && locales.includes("en"), locales.join(", "));

  for (const locale of locales) {
    let messages;
    try {
      messages = readJson(root, path.join("_locales", locale, "messages.json"));
    } catch (error) {
      add(`_locales/${locale}/messages.json が読める`, false, String(error));
      continue;
    }
    add(`_locales/${locale}/messages.json が読める`, true);

    const name = messages.extName?.message ?? "";
    const description = messages.extDescription?.message ?? "";
    add(
      `${locale}: 名前が ${LIMITS.name} 字以内`,
      name.length > 0 && name.length <= LIMITS.name,
      `${name.length} 字: ${name}`,
    );
    add(
      `${locale}: 短い説明が ${LIMITS.description} 字以内`,
      description.length > 0 && description.length <= LIMITS.description,
      `${description.length} 字: ${description}`,
    );
    add(
      `${locale}: 名前に __MSG__ や制御文字が残っていない`,
      !msgKey.test(name) && !/[\u0000-\u001f]/.test(description),
    );
    add(`${locale}: 説明に非公式である旨がある`, /非公式|unofficial|not affiliated/i.test(description + name));
  }

  const packageJson = readJson(root, "package.json");
  const versionPattern = /^\d+\.\d+\.\d+$/;
  add(
    "version が x.y.z で package.json と一致",
    versionPattern.test(String(manifest.version)) && manifest.version === packageJson.version,
    `manifest ${manifest.version} / package.json ${packageJson.version}`,
  );
  add(
    "minimum_chrome_version が設定されている",
    /^\d+$/.test(String(manifest.minimum_chrome_version ?? "")),
    manifest.minimum_chrome_version,
  );

  const permissions = Array.isArray(manifest.permissions) ? manifest.permissions : [];
  add(
    "API 権限は storage のみ",
    permissions.length === ALLOWED_API_PERMISSIONS.size &&
      permissions.every((p) => ALLOWED_API_PERMISSIONS.has(p)),
    permissions.join(", "),
  );
  add(
    "host 権限は permissions に入れていない",
    !permissions.some((p) => p.includes("://") || p === "<all_urls>"),
  );

  const contentScripts = Array.isArray(manifest.content_scripts) ? manifest.content_scripts : [];
  add("content_scripts は1件", contentScripts.length === 1, String(contentScripts.length));
  const allHosts = [
    ...contentScripts.flatMap((entry) => entry.matches ?? []),
    ...(manifest.web_accessible_resources ?? []).flatMap((entry) => entry.matches ?? []),
  ];
  add(
    "ホストは note.com の2つだけ",
    allHosts.length > 0 && allHosts.every((host) => ALLOWED_HOST_MATCHES.has(host)),
    [...new Set(allHosts)].join(", "),
  );
  add(
    "content_scripts の run_at が document_start",
    contentScripts.every((entry) => entry.run_at === "document_start"),
    contentScripts.map((entry) => entry.run_at).join(", "),
  );

  /** @type {string[]} */
  const referenced = [];
  for (const sizes of Object.values(manifest.icons ?? {})) referenced.push(sizes);
  for (const sizes of Object.values(manifest.action?.default_icon ?? {})) referenced.push(sizes);
  for (const entry of contentScripts) {
    referenced.push(...(entry.js ?? []), ...(entry.css ?? []));
  }
  for (const entry of manifest.web_accessible_resources ?? []) {
    referenced.push(...(entry.resources ?? []));
  }
  const missing = [...new Set(referenced)].filter((file) => !existsSync(path.join(root, file)));
  add("manifest が参照するファイルが全部ある", missing.length === 0, missing.join(", "));

  const warResources = new Set(
    (manifest.web_accessible_resources ?? []).flatMap((entry) => entry.resources ?? []),
  );
  for (const file of contentScripts.flatMap((entry) => entry.js ?? [])) {
    add(
      `content_scripts の ${file} は web_accessible_resources に入れない`,
      !warResources.has(file),
      file,
    );
  }

  const scripts = listFiles(root, "src").filter((file) => file.endsWith(".js"));
  add("src に JS がある", scripts.length > 0, scripts.join(", "));
  for (const file of [...scripts, ...listFiles(root, "test").filter((f) => f.endsWith(".js"))]) {
    const result = syntaxCheck(root, file);
    add(`${file} は ES モジュールとして構文OK`, result.ok, result.error.split("\n").slice(0, 3).join(" "));
  }
  for (const file of scripts) {
    const source = readFileSync(path.join(root, file), "utf8");
    const hits = REMOTE_CODE_PATTERNS.filter(([pattern]) => pattern.test(source)).map(([, label]) => label);
    add(`${file} にリモートコードの手がかりなし`, hits.length === 0, hits.join(", "));
  }

  for (const required of [
    "README.md",
    "LICENSE",
    "PRIVACY.md",
    "CHANGELOG.md",
    "RELEASE_CHECKLIST.md",
    "store/listing-ja.md",
    "store/listing-en.md",
    "store/submission-form.md",
    "scripts/package-store-bundle.mjs",
    ".github/workflows/ci.yml",
  ]) {
    add(`${required} がある`, existsSync(path.join(root, required)));
  }

  const storeAssets = [
    ["store/assets/icon-128.png", { width: 128, height: 128 }, LIMITS.iconBytes],
    ["store/assets/promo-small-440x280.png", { width: 440, height: 280 }, LIMITS.screenshotBytes],
    ["store/assets/screenshot-1-switch-off.png", { width: 1280, height: 800 }, LIMITS.screenshotBytes],
    ["store/assets/screenshot-2-hashtag-newest.png", { width: 1280, height: 800 }, LIMITS.screenshotBytes],
  ];
  for (const [file, expected, byteLimit] of storeAssets) {
    const absolute = path.join(root, file);
    if (!existsSync(absolute)) {
      add(`${file} がある`, false);
      continue;
    }
    const size = pngSize(absolute);
    add(
      `${file} は PNG ${expected.width}x${expected.height}`,
      size?.width === expected.width && size?.height === expected.height,
      size ? `${size.width}x${size.height}` : "PNGではありません",
    );
    add(
      `${file} は ${Math.round(byteLimit / 1024 / 1024)}MB 以内`,
      statSync(absolute).size <= byteLimit,
      `${(statSync(absolute).size / 1024).toFixed(1)}KB`,
    );
  }
  for (const [file, size] of Object.entries(manifest.icons ?? {})) {
    const png = pngSize(path.join(root, size));
    add(
      `アイコン ${size} は ${file}px 正方形`,
      png?.width === Number(file) && png?.height === Number(file),
      png ? `${png.width}x${png.height}` : "PNGではありません",
    );
  }

  const secrets = readdirSync(root).filter(
    (name) => name === ".env" || name.startsWith(".env.") || name.endsWith(".pem") || name.endsWith(".crx"),
  );
  add("リポジトリ直下に認証情報やビルド成果物がない", secrets.length === 0, secrets.join(", "));

  const readme = existsSync(path.join(root, "README.md"))
    ? readFileSync(path.join(root, "README.md"), "utf8")
    : "";
  const jaName = existsSync(path.join(root, "_locales/ja/messages.json"))
    ? readJson(root, path.join("_locales/ja", "messages.json")).extName?.message
    : "";
  add(
    "README の1行目にストアの日本語名がある",
    readme.split("\n")[0]?.includes(jaName) ?? false,
    `README 1行目: ${readme.split("\n")[0] ?? ""} / ストア名: ${jaName}`,
  );

  return checks;
}

function main() {
  const checks = runReleaseChecks();
  const failed = checks.filter((check) => !check.ok);
  for (const check of checks) {
    const mark = check.ok ? "ok  " : "FAIL";
    console.log(`${mark}  ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  console.log(`\n${checks.length - failed.length}/${checks.length} 件合格`);
  if (failed.length > 0) {
    console.error(`${failed.length} 件不合格: ${failed.map((c) => c.name).join(" / ")}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
