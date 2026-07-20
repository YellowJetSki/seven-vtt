#!/usr/bin/env node
/**
 * Asset migration script — copies images from root /images/ into
 * vtt/src/images/{portraits,tokens,maps,items}/ based on filename suffixes.
 */

const fs = require("fs");
const path = require("path");

const SRC = path.resolve("images");
const DST = path.resolve("vtt/src/images");

const CATEGORIES = {
  _portrait: "portraits",
  _bm: "tokens",
  _enc: "maps",
};

function getCategory(filename) {
  for (const [suffix, folder] of Object.entries(CATEGORIES)) {
    if (filename.endsWith(suffix + ".png")) return folder;
  }
  return "items"; // default
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".png"));
console.log(`Found ${files.length} PNG files in ${SRC}`);

let copied = 0;
for (const file of files) {
  const folder = getCategory(file);
  const dstDir = path.join(DST, folder);
  const dstFile = path.join(dstDir, file);

  // Ensure destination directory exists
  if (!fs.existsSync(dstDir)) {
    fs.mkdirSync(dstDir, { recursive: true });
  }

  fs.copyFileSync(path.join(SRC, file), dstFile);
  copied++;
  console.log(`  [${folder}] ${file}`);
}

// Remove .gitkeep files (they were placeholders)
for (const folder of ["portraits", "tokens", "maps", "items"]) {
  const gitkeep = path.join(DST, folder, ".gitkeep");
  if (fs.existsSync(gitkeep)) {
    fs.unlinkSync(gitkeep);
  }
}

console.log(`\n✓ ${copied} assets migrated.`);
