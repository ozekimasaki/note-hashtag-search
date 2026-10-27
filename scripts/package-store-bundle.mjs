// Builds the Chrome Web Store upload package: store/dist/note-hashtag-search-<version>.zip
// No dependencies; the zip is written with zlib deflate so the build is reproducible.

import { createHash } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REPO_ROOT, runReleaseChecks } from "./validate.mjs";

const INCLUDE_DIRS = ["_locales", "icons", "src"];
const INCLUDE_FILES = ["manifest.json", "LICENSE", "PRIVACY.md"];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let bit = 0; bit < 8; bit += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(epochMs) {
  const d = new Date(epochMs);
  const year = Math.max(1980, d.getUTCFullYear());
  const date = ((year - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate();
  const time = (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1);
  return { time, date };
}

/**
 * @param {{name: string, data: Buffer}[]} entries
 * @param {number} epochMs
 * @returns {Buffer}
 */
function buildZip(entries, epochMs) {
  const { time, date } = dosDateTime(epochMs);
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const data = entry.data;
    const deflated = deflateRawSync(data, { level: 9 });
    const useDeflate = deflated.length < data.length;
    const payload = useDeflate ? deflated : data;
    const crc = crc32(data);

    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(useDeflate ? 8 : 0, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    locals.push(local, payload);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(useDeflate ? 8 : 0, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(payload.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0o644 << 16, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);

    offset += local.length + payload.length;
  }

  const centralStart = offset;
  const centralSize = centrals.reduce((sum, buffer) => sum + buffer.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, ...centrals, end]);
}

/** Reads the central directory back and inflates every entry. */
function readZip(buffer) {
  const endOffset = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (endOffset < 0) throw new Error("zip: EOCD が見つからない");
  const count = buffer.readUInt16LE(endOffset + 10);
  let pointer = buffer.readUInt32LE(endOffset + 16);
  /** @type {{name: string, data: Buffer}[]} */
  const entries = [];

  for (let i = 0; i < count; i += 1) {
    if (buffer.readUInt32LE(pointer) !== 0x02014b50) throw new Error("zip: central header が不正");
    const method = buffer.readUInt16LE(pointer + 10);
    const crc = buffer.readUInt32LE(pointer + 16);
    const compressedSize = buffer.readUInt32LE(pointer + 20);
    const uncompressedSize = buffer.readUInt32LE(pointer + 24);
    const nameLength = buffer.readUInt16LE(pointer + 28);
    const extraLength = buffer.readUInt16LE(pointer + 30);
    const commentLength = buffer.readUInt16LE(pointer + 32);
    const localOffset = buffer.readUInt32LE(pointer + 42);
    const name = buffer.subarray(pointer + 46, pointer + 46 + nameLength).toString("utf8");

    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error(`zip: ${name} の local header が不正`);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const payload = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = method === 8 ? inflateRawSync(payload) : Buffer.from(payload);
    if (data.length !== uncompressedSize) throw new Error(`zip: ${name} のサイズ不一致`);
    if (crc32(data) !== crc) throw new Error(`zip: ${name} の CRC 不一致`);
    entries.push({ name, data });
    pointer += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function collectBundleFiles(root) {
  const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"));
  const referenced = new Set([
    ...Object.values(manifest.icons ?? {}),
    ...Object.values(manifest.action?.default_icon ?? {}),
    ...manifest.content_scripts.flatMap((entry) => [...(entry.js ?? []), ...(entry.css ?? [])]),
    ...manifest.web_accessible_resources.flatMap((entry) => entry.resources ?? []),
    ...manifest.background?.service_worker ? [manifest.background.service_worker] : [],
  ]);

  const files = [...INCLUDE_FILES];
  for (const dir of INCLUDE_DIRS) {
    const stack = [dir];
    while (stack.length > 0) {
      const current = stack.pop();
      for (const entry of readdirSync(path.join(root, current), { withFileTypes: true })) {
        const relative = path.posix.join(current, entry.name);
        if (entry.isDirectory()) stack.push(relative);
        else files.push(relative);
      }
    }
  }

  for (const file of referenced) files.push(file);
  const unique = [...new Set(files)].sort();
  const unexpected = unique.filter(
    (file) =>
      file.includes("..") ||
      path.isAbsolute(file) ||
      /\.(zip|crx|pem|map|log|DS_Store)$/.test(file) ||
      file.startsWith("store/") ||
      file.startsWith("scripts/") ||
      file.startsWith("test/") ||
      file.startsWith(".github"),
  );
  if (unexpected.length > 0) throw new Error(`バンドルに含められないファイル: ${unexpected.join(", ")}`);
  return unique;
}

export function buildBundle({ root = REPO_ROOT, outDir = path.join(REPO_ROOT, "store", "dist") } = {}) {
  const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"));
  const files = collectBundleFiles(root);
  const epochMs =
    Number(process.env.SOURCE_DATE_EPOCH) * 1000 ||
    Math.max(...files.map((file) => statMs(path.join(root, file))));
  // ZIP stores DOS timestamps with two-second granularity.
  const entries = files.map((name) => ({ name, data: readFileSync(path.join(root, name)) }));

  const zip = buildZip(entries, Math.floor(epochMs / 2000) * 2000);

  const roundTrip = readZip(zip);
  if (roundTrip.length !== entries.length) throw new Error("zip: エントリー数が一致しない");
  for (const [index, entry] of roundTrip.entries()) {
    if (entry.name !== entries[index].name) throw new Error(`zip: ${entry.name} の並びが一致しない`);
    if (!entry.data.equals(entries[index].data)) throw new Error(`zip: ${entry.name} の中身が一致しない`);
  }

  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `note-hashtag-search-${manifest.version}.zip`);
  writeFileSync(outPath, zip);
  return {
    outPath,
    zip,
    entries: entries.map(({ name, data }) => ({ name, bytes: data.length })),
    sha256: createHash("sha256").update(zip).digest("hex"),
  };
}

function statMs(absolute) {
  return statSync(absolute).mtimeMs;
}

function main() {
  const checks = runReleaseChecks();
  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    console.error("リリースチェックの不合格:");
    for (const check of failed) console.error(`  FAIL  ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
    process.exit(1);
  }

  const result = buildBundle();
  console.log(`${path.relative(REPO_ROOT, result.outPath)}  ${(result.zip.length / 1024).toFixed(1)}KB  sha256=${result.sha256}`);
  for (const entry of result.entries) {
    console.log(`  ${entry.name.padEnd(34)} ${String(entry.bytes).padStart(9)}B`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
