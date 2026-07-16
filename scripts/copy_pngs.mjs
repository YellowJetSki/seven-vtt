/**
 * Copies PNGs from the pedal-sheet project to the VTT project.
 * Naming convention:
 *   *_enc.png → battlemaps/
 *   *_bm.png  → tokens/
 *   PC names (kehrfuffle, strider, toern, wendy) → portraits/
 *   Rest → items/ (for homebrew/inventory)
 */
import fs from 'fs';
import path from 'path';

const SRC = 'C:/Users/mikej/OneDrive/Documents/apps/pedal-sheet/public';
const DST = path.resolve('vtt/public/images');

const categories = {
  battlemaps: [],
  portraits: [],
  tokens: [],
  items: [],
};

const portraitNames = ['kehrfuffle', 'strider', 'toern', 'wendy'];

fs.readdirSync(SRC).forEach(file => {
  if (!file.endsWith('.png')) return;

  let destFolder;
  const base = file.replace('.png', '');

  if (file.endsWith('_enc.png')) {
    destFolder = 'battlemaps';
  } else if (file.endsWith('_bm.png')) {
    destFolder = 'tokens';
  } else if (portraitNames.includes(base.toLowerCase())) {
    destFolder = 'portraits';
  } else {
    destFolder = 'items';
  }

  const srcPath = path.join(SRC, file);
  const dstPath = path.join(DST, destFolder, file);

  fs.cpSync(srcPath, dstPath, { force: true });
  categories[destFolder].push(`/images/${destFolder}/${file}`);
  console.log(`✅ Copied: ${file} → images/${destFolder}/`);
});

// Read existing manifest
const manifestPath = path.join(DST, '..', 'image-manifest.json');
const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Merge new files into manifest
for (const [cat, files] of Object.entries(categories)) {
  if (files.length > 0) {
    existing[cat] = [...new Set([...files, ...(existing[cat] || [])])];
  }
}

fs.writeFileSync(manifestPath, JSON.stringify(existing, null, 2));
console.log('\n📝 Updated image-manifest.json');

// Summary
console.log('\n=== COPY SUMMARY ===');
for (const [cat, files] of Object.entries(categories)) {
  if (files.length > 0) {
    console.log(`  ${cat}: ${files.length} files`);
  }
}
console.log('\nDone!');
