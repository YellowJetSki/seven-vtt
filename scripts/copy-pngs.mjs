import fs from 'fs';
import path from 'path';

const SRC = 'C:/Users/mikej/OneDrive/Documents/apps/pedal-sheet/public';
const DST = path.resolve('vtt/public/images');

// Ensure destination subdirectories exist
['battlemaps', 'portraits', 'tokens', 'items'].forEach(d => {
  const p = path.join(DST, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const portraitNames = ['kehrfuffle', 'strider', 'toern', 'wendy'];

const categories = { battlemaps: [], portraits: [], tokens: [], items: [] };
let count = 0;

fs.readdirSync(SRC).forEach(file => {
  if (!file.endsWith('.png') || file === 'icon.png' || file === 't_pin.png') return;
  
  const base = file.replace('.png', '');
  let destFolder;
  
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
  
  fs.copyFileSync(srcPath, dstPath);
  categories[destFolder].push(`/images/${destFolder}/${file}`);
  count++;
  console.log(`OK: ${file} -> ${destFolder}/`);
});

// Update manifest
const manifestPath = path.resolve('vtt/public/image-manifest.json');
const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

for (const [cat, files] of Object.entries(categories)) {
  if (files.length) {
    existing[cat] = [...new Set([...files, ...(existing[cat] || [])])];
  }
}

fs.writeFileSync(manifestPath, JSON.stringify(existing, null, 2));

console.log(`\nTotal: ${count} files copied`);
console.log('Manifest updated.');

for (const [cat, files] of Object.entries(categories)) {
  if (files.length) console.log(`  ${cat}: ${files.length}`);
}
