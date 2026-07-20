#!/usr/bin/env node
//
// migrate-images.mjs
// Moves image files from /images to /public/images/{items,portraits,tokens,maps}
// and cleans up .gitkeep files.
//
// Usage: node scripts/migrate-images.mjs
//

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "images");
const dstDir = path.join(root, "public", "images");

const folders = {
  _portrait: "portraits",
  _bm: "tokens",
  _enc: "maps",
};

function getFolder(filename) {
  for (const [suffix, folder] of Object.entries(folders)) {
    if (filename.endsWith(suffix + ".png")) return folder;
  }
  return "items";
}

try {
  // Create destination directories
  for (const f of Object.values(folders)) {
    fs.mkdirSync(path.join(dstDir, f), { recursive: true });
  }
  fs.mkdirSync(path.join(dstDir, "items"), { recursive: true });

  // Read source files
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".png"));
  let moved = 0;

  for (const file of files) {
    const folder = getFolder(file);
    const src = path.join(srcDir, file);
    const dst = path.join(dstDir, folder, file);
    fs.copyFileSync(src, dst);
    moved++;
    console.log(`  ✓ ${file} → ${folder}/`);
  }

  console.log(`\n✅ ${moved} assets migrated to public/images/`);
} catch (err) {
  console.error("Migration error:", err.message);
  process.exit(1);
}
