/**
 * STᚱ VTT — Asset Copy Plugin for Vite
 *
 * A Vite plugin that copies PNG assets from the root /images/ directory
 * into /public/images/{items,tokens,maps,portraits}/ based on filename suffix.
 *
 * Suffix → folder mapping:
 *   _portrait.png → portraits/   (character portraits)
 *   _bm.png       → tokens/       (battle-map token icons)
 *   _enc.png      → maps/         (encounter battle maps)
 *   _item.png     → items/        (inventory item icons)
 *   default       → items/        (fallback)
 *
 * This runs during the build so assets are available in production.
 */

import fs from "fs";
import path from "path";

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

function copyAssets(rootDir) {
  const srcDir = path.resolve(rootDir, "images");
  const dstBase = path.resolve(rootDir, "public", "images");

  if (!fs.existsSync(srcDir)) {
    console.warn(`[vite:copy-assets] Source directory not found: ${srcDir}`);
    return;
  }

  // Create destination directories
  for (const folder of Object.values(SUFFIX_MAP)) {
    fs.mkdirSync(path.join(dstBase, folder), { recursive: true });
  }
  fs.mkdirSync(path.join(dstBase, "items"), { recursive: true });

  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".png"));
  let copied = 0;

  for (const file of files) {
    const folder = getTargetFolder(file);
    const src = path.join(srcDir, file);
    const dst = path.join(dstBase, folder, file);

    // Only copy if destination doesn't exist or source is newer
    if (fs.existsSync(dst)) {
      const srcStat = fs.statSync(src);
      const dstStat = fs.statSync(dst);
      if (srcStat.mtimeMs <= dstStat.mtimeMs) continue;
    }

    fs.copyFileSync(src, dst);
    copied++;
  }

  if (copied > 0) {
    console.log(`[vite:copy-assets] ✅ Copied ${copied} PNG assets to public/images/`);
  }
}

export default function copyAssetsPlugin() {
  return {
    name: "vite:copy-assets",
    enforce: "pre",

    buildStart() {
      const rootDir = process.cwd();
      copyAssets(rootDir);
    },

    configureServer(server) {
      // Copy on server start
      const rootDir = process.cwd();
      copyAssets(rootDir);

      // Watch for new/changed PNG files
      server.watcher.add(path.resolve(rootDir, "images", "*.png"));
      server.watcher.on("change", (filePath) => {
        if (filePath.endsWith(".png")) {
          const rootDir = process.cwd();
          const srcDir = path.resolve(rootDir, "images");
          const dstBase = path.resolve(rootDir, "public", "images");
          const file = path.basename(filePath);
          const folder = getTargetFolder(file);
          const src = path.join(srcDir, file);
          const dst = path.join(dstBase, folder, file);
          fs.mkdirSync(path.dirname(dst), { recursive: true });
          fs.copyFileSync(src, dst);
          console.log(`[vite:copy-assets] 🔄 Updated: ${folder}/${file}`);
        }
      });
    },
  };
}
