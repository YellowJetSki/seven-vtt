const fs = require('fs');
const path = require('path');

const SRC = 'C:/Users/mikej/OneDrive/Documents/apps/pedal-sheet/public';
const DST = path.resolve(__dirname, '../vtt/public/images');

const portraitNames = ['kehrfuffle', 'strider', 'toern', 'wendy'];
const categories = { battlemaps: [], portraits: [], tokens: [], items: [] };
let count = 0;

['battlemaps', 'portraits', 'tokens', 'items'].forEach(d => {
  const p = path.join(DST, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

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
  
  fs.cpSync(srcPath, dstPath, { force: true, recursive: false });
  categories[destFolder].push(`/images/${destFolder}/${file}`);
  count++;
  process.stdout.write(`OK: ${file} -> ${destFolder}/\n`);
});

const manifestPath = path.resolve(__dirname, '../vtt/public/image-manifest.json');
const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

for (const [cat, files] of Object.entries(categories)) {
  if (files.length) {
    existing[cat] = [...new Set([...files, ...(existing[cat] || [])])];
  }
}

fs.writeFileSync(manifestPath, JSON.stringify(existing, null, 2));

process.stdout.write(`\nTotal: ${count} files copied\nManifest updated.\n`);
for (const [cat, files] of Object.entries(categories)) {
  if (files.length) process.stdout.write(`  ${cat}: ${files.length}\n`);
}
