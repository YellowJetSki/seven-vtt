import shutil, os, json

src = r"C:\Users\mikej\OneDrive\Documents\apps\pedal-sheet\public"
dst = "vtt/public/images"

portrait_names = ["kehrfuffle", "strider", "toern", "wendy"]

categories = {"battlemaps": [], "portraits": [], "tokens": [], "items": []}

os.makedirs(f"{dst}/battlemaps", exist_ok=True)
os.makedirs(f"{dst}/portraits", exist_ok=True)
os.makedirs(f"{dst}/tokens", exist_ok=True)
os.makedirs(f"{dst}/items", exist_ok=True)

count = 0
for fname in os.listdir(src):
    if not fname.endswith(".png") or fname in ("icon.png", "t_pin.png"):
        continue
    base = fname.replace(".png", "")
    if fname.endswith("_enc.png"):
        folder = "battlemaps"
    elif fname.endswith("_bm.png"):
        folder = "tokens"
    elif base.lower() in portrait_names:
        folder = "portraits"
    else:
        folder = "items"
    shutil.copy2(os.path.join(src, fname), os.path.join(dst, folder, fname))
    categories[folder].append(f"/images/{folder}/{fname}")
    count += 1
    print(f"OK: {fname} -> {folder}/")

# Update manifest
with open(f"{dst}/../image-manifest.json") as f:
    manifest = json.load(f)

for cat, files in categories.items():
    if files:
        manifest[cat] = list(set(files + manifest.get(cat, [])))

with open(f"{dst}/../image-manifest.json", "w") as f:
    json.dump(manifest, f, indent=2)

print(f"\nTotal: {count} files copied")
for cat, files in categories.items():
    if files:
        print(f"  {cat}: {len(files)}")
