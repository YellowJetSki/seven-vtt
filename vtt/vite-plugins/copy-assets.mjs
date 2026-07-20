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
 * This runs during both dev (server start + watch) and production build.
 *
 * ARCHITECTURE:
 *   Root images/ directory  ──[copy on build]──►  public/images/{items,tokens,maps,portraits}/
 *   assetCatalog.ts PNG_ASSETS[]  ──[imageUrl]──►  /images/{category}/{filename}
 *   Components use asset.imageUrl  ──[<img>]──►   Vite serves from public/
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

/**
 * Resolve the project root — one level up from vtt/
 * Since this plugin runs with cwd = vtt/, we go up one to find the /images dir
 */
function getProjectRoot() {
  const cwd = process.cwd();
  // If we're inside vtt/, the project root is one level up
  if (cwd.endsWith("vtt")) {
    return path.resolve(cwd, "..");
  }
  return cwd;
}

export function copyAssets(rootDir) {
  const projectRoot = rootDir || getProjectRoot();
  const srcDir = path.resolve(projectRoot, "images");
  const dstBase = path.resolve(rootDir, "public", "images");

  if (!fs.existsSync(srcDir)) {
    console.warn(`[vite-copy-assets] Source directory not found: ${srcDir}`);
    return 0;
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
      try {
        const srcStat = fs.statSync(src);
        const dstStat = fs.statSync(dst);
        if (srcStat.mtimeMs <= dstStat.mtimeMs) continue;
      } catch {
        // If stat fails, just copy
      }
    }

    fs.copyFileSync(src, dst);
    copied++;
  }

  return copied;
}

export default function copyAssetsPlugin() {
  return {
    name: "vite-plugin-copy-assets",
    enforce: "pre",

    buildStart() {
      const rootDir = getProjectRoot();
      const copied = copyAssets(rootDir);
      if (copied > 0) {
        console.log(`[vite-plugin-copy-assets] ✅ Copied ${copied} PNG assets to public/images/`);
      }
    },

    configureServer(server) {
      const rootDir = getProjectRoot();

      // Copy on server start
      const initial = copyAssets(rootDir);
      if (initial > 0) {
        console.log(`[vite-plugin-copy-assets] ✅ Copied ${initial} PNG assets to public/images/`);
      }

      // Watch for new/changed PNG files
      try {
        server.watcher.add(path.resolve(rootDir, "images", "*.png"));
        server.watcher.on("change", (filePath) => {
          if (filePath.endsWith(".png")) {
            const rDir = getProjectRoot();
            const sDir = path.resolve(rDir, "images");
            const dBase = path.resolve(rDir, "public", "images");
            const file = path.basename(filePath);
            const folder = getTargetFolder(file);
            const src = path.join(sDir, file);
            const dst = path.join(dBase, folder, file);
            fs.mkdirSync(path.dirname(dst), { recursive: true });
            fs.copyFileSync(src, dst);
            console.log(`[vite-plugin-copy-assets] 🔄 Updated: ${folder}/${file}`);
          }
        });
      } catch (err) {
        // Watcher may not be available in all environments
        console.warn(`[vite-plugin-copy-assets] Watcher setup skipped: ${err.message}`);
      }
    },
  };
}
