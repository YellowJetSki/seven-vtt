/**
 * generate-image-manifest.js
 *
 * Scans public/images/ for all image files and generates
 * a manifest JSON file (public/image-manifest.json) that the
 * ImagePicker component reads at runtime.
 *
 * This runs automatically via "predev" and "prebuild" npm scripts.
 *
 * ── How to add images ──────────────────────────────────────
 * 1. Drop any .svg, .png, .jpg, .gif, or .webp file into
 *    public/images/battlemaps/   (or portraits/, tokens/)
 * 2. Restart the dev server (or rebuild)
 * 3. The image appears instantly in the Library tab
 * ───────────────────────────────────────────────────────────
 */

import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const IMAGES_DIR = resolve(__dirname, "../public/images");
const OUTPUT_PATH = resolve(__dirname, "../public/image-manifest.json");

const SUPPORTED_EXTENSIONS = /\.(svg|png|jpg|jpeg|gif|webp)$/i;

/** Scan a single directory and return sorted list of relative URL paths */
function scanDirectory(dirPath, category) {
  if (!existsSync(dirPath)) return [];

  const entries = readdirSync(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && SUPPORTED_EXTENSIONS.test(entry.name))
    .map((entry) => `/images/${category}/${entry.name}`)
    .sort((a, b) => a.localeCompare(b));
}

/** Build the full manifest object from the images directory */
function buildManifest() {
  const manifest = {};

  if (!existsSync(IMAGES_DIR)) {
    console.warn("⚠️  public/images/ directory not found. Skipping manifest generation.");
    return manifest;
  }

  const categories = readdirSync(IMAGES_DIR, { withFileTypes: true });

  for (const entry of categories) {
    if (entry.isDirectory()) {
      const categoryName = entry.name;
      const fullPath = join(IMAGES_DIR, categoryName);
      const images = scanDirectory(fullPath, categoryName);
      if (images.length > 0) {
        manifest[categoryName] = images;
      }
    }
  }

  return manifest;
}

// ── Execute ─────────────────────────────────────────────────
const manifest = buildManifest();
const totalImages = Object.values(manifest).flat().length;

writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2), "utf-8");
console.log(`✅ image-manifest.json generated — ${totalImages} image(s) found across ${Object.keys(manifest).length} category(ies)`);

if (totalImages === 0) {
  console.warn("⚠️  No images found. Drop image files into public/images/battlemaps/, portraits/, or tokens/.");
}
