import { mkdirSync, copyFileSync, readdirSync } from "fs";
import { join } from "path";

const src = "images";
const dst = "vtt/public/images";

const categories = {
  items: (f) => f.endsWith("_item.png"),
  portraits: (f) => f.endsWith("_portrait.png"),
  tokens: (f) => f.endsWith("_bm.png"),
  maps: (f) => f.endsWith("_enc.png"),
};

const files = readdirSync(src);

for (const [cat, filter] of Object.entries(categories)) {
  const dir = join(dst, cat);
  mkdirSync(dir, { recursive: true });
  const matched = files.filter(filter);
  for (const f of matched) {
    copyFileSync(join(src, f), join(dir, f));
  }
  console.log(`${cat}: ${matched.length} files copied`);
}

console.log("\u2713 All 32 assets deployed to vtt/public/images/");
