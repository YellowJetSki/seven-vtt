#!/usr/bin/env node
//
// copy-images.mjs
// Copies .png files from the root /images/ directory into
// /public/images/{items,tokens,maps,portraits}/ based on filename suffix.
//
// Suffix mapping:
//   _portrait.png → portraits/
//   _bm.png       → tokens/     (battle-map tokens)
//   _enc.png      → maps/       (encounter maps)
//   _item.png     → items/      (everything else with _item)
//   default       → items/      (fallback for unmatched)
//
// Usage: node scripts/copy-images.mjs
//

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "images");
const dstDir = path.join(root, "public", "images");

const SUFFIX_MAP = {
  "_portrait.png": "portraits",
  "_bm.png": "tokens",
  "_enc.png": "maps",
  "_item.png": "items",
};

function getTargetFolder(filename) {
  for (const [suffix, folder] of Object.entries(SUFFIX_MAP)) {
    if (filename.endsWith(suffix)) return folder;
  }
  return "items";
}

function main() {
  try {
    // Ensure all destination dirs exist
    for (const folder of Object.values(SUFFIX_MAP)) {
      fs.mkdirSync(path.join(dstDir, folder), { recursive: true });
    }
    fs.mkdirSync(path.join(dstDir, "items"), { recursive: true });

    const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".png"));
    let copied = 0;
    let errors = 0;

    for (const file of files) {
      const folder = getTargetFolder(file);
      const src = path.join(srcDir, file);
      const dst = path.join(dstDir, folder, file);

      if (!fs.existsSync(src)) {
        console.error(`  ✗ NOT FOUND: ${file}`);
        errors++;
        continue;
      }

      fs.copyFileSync(src, dst);
      const stat = fs.statSync(dst);
      copied++;
      console.log(`  ✓ ${file.padEnd(30)} → ${folder}/  (${(stat.size / 1024).toFixed(1)} KB)`);
    }

    console.log(`\n✅ ${copied} assets copied to public/images/`);
    if (errors > 0) console.warn(`⚠ ${errors} errors encountered`);
  } catch (err) {
    console.error("Copy error:", err.message);
    process.exit(1);
  }
}

main();
