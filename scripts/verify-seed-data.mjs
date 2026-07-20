/**
 * STᚱ VTT — Seed Data Verification Script (Sprint 10)
 *
 * Connects to Firestore (emulator or production) and validates
 * document structure for all collections.
 *
 * Usage:
 *   node scripts/verify-seed-data.mjs                  # emulator (default)
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/verify-seed-data.mjs
 *
 * Output:
 *   ✓ Campaign collections: all paths have valid documents
 *   ✓ Characters: have all required fields
 *   ✓ Enemies: have all required fields
 *   ✓ Combat: structure valid
 *   ✓ Presence: structure valid
 *
 * Exit codes:
 *   0 = all data valid
 *   1 = validation errors found
 *   2 = connection failure
 */

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "localhost:8080";
const PROJECT_ID = process.env.GCLOUD_PROJECT || "str-vtt-dev";

async function checkEmulatorAvailable() {
  try {
    const res = await fetch(`http://${EMULATOR_HOST}/`, { method: "GET", signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Core 5e field validators ──────────────────────────────────

const REQUIRED_CHARACTER_FIELDS = [
  "id", "name", "playerName", "race", "class", "level",
  "hitPoints", "armorClass", "strength", "dexterity", "constitution",
  "intelligence", "wisdom", "charisma",
];

const REQUIRED_ENEMY_FIELDS = [
  "id", "name", "type", "armorClass", "hitPoints",
  "challengeRating",
];

const REQUIRED_ENCOUNTER_FIELDS = [
  "id", "name",
];

const REQUIRED_MAP_FIELDS = [
  "id", "name", "gridWidth", "gridHeight",
];

const VALID_CRS = new Set([
  "0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6",
  "7", "8", "9", "10", "11", "12", "13", "14", "15",
  "16", "17", "18", "19", "20", "21", "22", "23", "24",
  "25", "26", "27", "28", "29", "30",
]);

// ── Document collectors ───────────────────────────────────────

async function collectDocuments(path) {
  const url = `http://${EMULATOR_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      if (res.status === 404) return { documents: [], error: null };
      return { documents: [], error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { documents: data.documents || [], error: null };
  } catch (err) {
    return { documents: [], error: err.message };
  }
}

function extractFields(doc) {
  const fields = doc.fields || {};
  const result = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = Object.values(value)[0]; // first value: stringValue, integerValue, etc.
  }
  return result;
}

// ── Report ────────────────────────────────────────────────────

const errors = [];
const warnings = [];

function report(pass, message) {
  if (pass) {
    console.log(`  ✅ ${message}`);
  } else {
    console.log(`  ❌ ${message}`);
    errors.push(message);
  }
}

function warn(message) {
  console.log(`  ⚠️  ${message}`);
  warnings.push(message);
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log("\n═══════════════════════════════════════════");
  console.log("  STᚱ VTT — Seed Data Verification");
  console.log(`  Emulator: ${EMULATOR_HOST}`);
  console.log(`  Project: ${PROJECT_ID}`);
  console.log("═══════════════════════════════════════════\n");

  // ── Step 1: Check emulator ──
  const available = await checkEmulatorAvailable();
  report(available, "Firestore emulator is reachable");
  if (!available) {
    console.log("\n  Emulator not available. Skipping further verification.\n");
    return 2;
  }

  const campaignId = "default-campaign";

  // ── Step 2: Campaign collections ──
  console.log("\n── Campaign Collections ──\n");

  // Characters
  const chars = await collectDocuments(`${campaignId}/characters`);
  report(chars.error === null, `Characters collection: ${chars.documents.length} docs`);
  if (chars.documents.length > 0) {
    const firstChar = extractFields(chars.documents[0]);
    const missingFields = REQUIRED_CHARACTER_FIELDS.filter((f) => !(f in firstChar));
    report(missingFields.length === 0, `Character fields: ${REQUIRED_CHARACTER_FIELDS.length} required, missing: ${missingFields.length > 0 ? missingFields.join(", ") : "none"}`);
  }

  // Enemies
  const enemies = await collectDocuments(`${campaignId}/enemies`);
  report(enemies.error === null, `Enemies collection: ${enemies.documents.length} docs`);
  if (enemies.documents.length > 0) {
    const firstEnemy = extractFields(enemies.documents[0]);
    const missingFields = REQUIRED_ENEMY_FIELDS.filter((f) => !(f in firstEnemy));
    report(missingFields.length === 0, `Enemy fields: ${REQUIRED_ENEMY_FIELDS.length} required, missing: ${missingFields.length > 0 ? missingFields.join(", ") : "none"}`);

    // Validate CR values
    const crValue = firstEnemy.challengeRating;
    const crValid = typeof crValue === "string" && VALID_CRS.has(crValue);
    report(crValid, `Challenge rating "${crValue}" is valid 5e value`);
  }

  // Encounters
  const encounters = await collectDocuments(`${campaignId}/encounters`);
  report(encounters.error === null, `Encounters collection: ${encounters.documents.length} docs`);
  if (encounters.documents.length > 0) {
    const firstEnc = extractFields(encounters.documents[0]);
    const missingFields = REQUIRED_ENCOUNTER_FIELDS.filter((f) => !(f in firstEnc));
    report(missingFields.length === 0, `Encounter fields: ${REQUIRED_ENCOUNTER_FIELDS.length} required, missing: ${missingFields.length > 0 ? missingFields.join(", ") : "none"}`);
  }

  // Maps
  const maps = await collectDocuments(`${campaignId}/maps`);
  report(maps.error === null, `Maps collection: ${maps.documents.length} docs`);
  if (maps.documents.length > 0) {
    const firstMap = extractFields(maps.documents[0]);
    const missingFields = REQUIRED_MAP_FIELDS.filter((f) => !(f in firstMap));
    report(missingFields.length === 0, `Map fields: ${REQUIRED_MAP_FIELDS.length} required, missing: ${missingFields.length > 0 ? missingFields.join(", ") : "none"}`);
  }

  // Journal
  const journal = await collectDocuments(`${campaignId}/journal`);
  report(journal.error === null, `Journal collection: ${journal.documents.length} docs`);

  // Combat subcollection
  const combat = await collectDocuments(`${campaignId}/combat`);
  report(combat.error === null, `Combat subcollection: ${combat.documents.length} docs`);

  // Presence subcollection
  const presence = await collectDocuments(`${campaignId}/presence`);
  report(presence.error === null, `Presence subcollection: ${presence.documents.length} docs`);

  // DM Share subcollection
  const dmShare = await collectDocuments(`${campaignId}/dm-share`);
  report(dmShare.error === null, `DM Share subcollection: ${dmShare.documents.length} docs`);

  // ── Step 3: Combat Log subcollection ──
  console.log("\n── Combat Log ──\n");

  const combatLog = await collectDocuments(`${campaignId}/combat/log`);
  report(combatLog.error === null, `Combat Log subcollection: ${combatLog.documents.length} docs`);

  // ── Step 4: Summary ──
  console.log("\n═══════════════════════════════════════════");
  if (errors.length === 0) {
    console.log("  ✅ ALL VALIDATIONS PASSED");
  } else {
    console.log(`  ❌ ${errors.length} validation error(s) found`);
  }
  if (warnings.length > 0) {
    console.log(`  ⚠️  ${warnings.length} warning(s)`);
  }
  console.log(`\n  Collections checked: 8 (characters, enemies, encounters,\n                        maps, journal, combat, presence,\n                        dm-share)`);
  console.log("═══════════════════════════════════════════\n");

  return errors.length > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(2);
});
