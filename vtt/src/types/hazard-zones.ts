/* ── Persistent Hazard Zone Types ──────────────────────────────
 * Data structures for the Dynamic Battle Effects System (AOE v2).
 * Extends AoETemplate with persistence, duration, elemental
 * ground effects, altitude layers, and a tick/round tracker.
 * ─────────────────────────────────────────────────────────────── */

import type { AoE_Shape, AoE_Direction, AoETemplate } from "./aoe-templates";

/* ── Elemental Schools & Ground Effects ────────────────────── */

/** Schools of magic for rune ring styling */
export type MagicSchool =
  | "evocation" | "necromancy" | "conjuration" | "transmutation"
  | "abjuration" | "divination" | "enchantment" | "illusion"
  | "universal";

/** Colour palette per school */
export const SCHOOL_COLORS: Record<MagicSchool, { primary: string; secondary: string; rune: string }> = {
  evocation:     { primary: "#ff4444",  secondary: "#ff8833",  rune: "#ff6600" },
  necromancy:    { primary: "#66cc44",  secondary: "#448833",  rune: "#55bb33" },
  conjuration:   { primary: "#ff8800",  secondary: "#ffbb44",  rune: "#ff9900" },
  transmutation: { primary: "#ffdd00",  secondary: "#ffee88",  rune: "#ffe044" },
  abjuration:    { primary: "#4488ff",  secondary: "#88bbff",  rune: "#3366ff" },
  divination:    { primary: "#aa88ff",  secondary: "#ccbbff",  rune: "#9977ee" },
  enchantment:   { primary: "#ff88ff",  secondary: "#ffbbff",  rune: "#ee66ee" },
  illusion:      { primary: "#88ddff",  secondary: "#bbeeff",  rune: "#66ccff" },
  universal:     { primary: "#ffffff",  secondary: "#cccccc", rune: "#aaaacc" },
};

/* ── Altitude Layers ────────────────────────────────────────── */

/** Height band for AOE template placement */
export type AltitudeLayer = "ground" | "waist" | "aerial";

export const ALTITUDE_LABELS: Record<AltitudeLayer, string> = {
  ground: "Ground (0 ft)",
  waist:  "Waist (5 ft)",
  aerial: "Aerial (10+ ft)",
};

export const ALTITUDE_OFFSETS: Record<AltitudeLayer, number> = {
  ground: 0,
  waist:  5,
  aerial: 10,
};

/* ── Residual Elemental Ground Effects ──────────────────────── */

/** Types of ground effects left after a persistent hazard expires */
export type GroundEffectType =
  | "scorch"        // Fire — blackened ground, no mechanical effect
  | "ice_patch"     // Cold — difficult terrain
  | "gas_cloud"     // Poison — lingering damage zone
  | "static_field"  // Lightning — shocking ground
  | "radiant_pool"  // Radiant — glowing holy ground
  | "shadow_pool"   // Necrotic — shadowy miasma
  | "magnetic_field" // Force — reverberating energy
  | "arcane_residue"; // Raw magic — shimmering dust

export interface GroundEffect {
  /** Unique ID */
  id: string;
  /** Source template ID (if any) */
  sourceTemplateId?: string;
  /** Effect type */
  type: GroundEffectType;
  /** Label shown on hover */
  label: string;
  /** World-space position (grid coords) */
  gridX: number;
  gridY: number;
  /** Radius in feet */
  radius: number;
  /** Fill color */
  color: string;
  /** Opacity 0–1 */
  opacity: number;
  /** Whether it imposes difficult terrain */
  difficultTerrain: boolean;
  /** Optional damage on entry/turn start */
  damageOnEntry?: string;  // dice string like "1d6"
  /** Whether visible to players */
  visibleToPlayers: boolean;
  /** Remaining duration in rounds (null = permanent) */
  remainingRounds: number | null;
  /** Timestamp of creation */
  createdAt: number;
  /** Fade-out progress (0 = fresh, 1 = fully faded) */
  fadeProgress: number;
}

/* ── Tick & Duration Tracking ───────────────────────────────── */

/** Tracks a single damage tick (used for DoT effects) */
export interface HazardTick {
  /** Round number when tick occurred */
  round: number;
  /** Actor affected (token ID) */
  targetTokenId?: string;
  /** Damage dealt this tick */
  damage?: number;
  /** Whether a saving throw was made */
  savingThrow?: { ability: string; result: number };
  /** Descriptive note */
  note?: string;
}

/* ── Persistent Hazard Zone (extends AoETemplate) ──────────── */

export interface HazardZone extends AoETemplate {
  /** Discriminator */
  kind: "hazard";

  /* ── Duration ──────────────────────────────── */
  /** Duration in rounds (null = instantaneous, no persistence) */
  durationRounds: number | null;
  /** Remaining rounds (counts down each turn cycle) */
  remainingRounds: number | null;
  /** Round when this hazard was placed */
  placedOnRound: number;
  /** Whether concentration is required */
  requiresConcentration: boolean;

  /* ── Damage Tick ───────────────────────────── */
  /** Damage dice per tick (e.g., "3d6") */
  tickDamage?: string;
  /** Tick frequency in rounds (1 = every round, 2 = every other) */
  tickInterval: number;
  /** Ticks that have been applied */
  ticks: HazardTick[];
  /** Last round a tick was applied */
  lastTickRound: number | null;

  /* ── Saving Throw ──────────────────────────── */
  /** DC for the hazard's saving throw */
  savingThrowDC?: number;
  /** Ability used for saving throw */
  savingThrowAbility?: "str" | "dex" | "con" | "int" | "wis" | "cha";
  /** Damage on successful save (halved or none) */
  saveSuccessDamage?: "half" | "none";

  /* ── Altitude ──────────────────────────────── */
  altitude: AltitudeLayer;

  /* ── Magic School ──────────────────────────── */
  magicSchool: MagicSchool;

  /* ── Ground Effect ─────────────────────────── */
  /** Whether this hazard leaves a residual effect */
  leavesGroundEffect: boolean;
  /** Ground effect type (only if leavesGroundEffect is true) */
  groundEffectType?: GroundEffectType;
  /** Duration of ground effect in rounds (null = permanent scene) */
  groundEffectDuration: number | null;

  /* ── Rune Ring ─────────────────────────────── */
  /** Whether to show the arcane rune ring */
  showRuneRing: boolean;
  /** Rune ring rotation speed (seconds per full rotation) */
  runeRingSpeed: number;

  /* ── Concentration Tag ─────────────────────── */
  /** Token ID of the concentrator (for visual link) */
  concentrationTokenId?: string;
}

/* ── Hazard Zone State Snapshot (for the Timeline) ─────────── */

export interface HazardState {
  id: string;
  label: string;
  shape: AoE_Shape;
  size: number;
  gridX: number;
  gridY: number;
  color: string;
  remainingRounds: number | null;
  placedOnRound: number;
  tickDamage?: string;
  tickCount: number;
  lastTickRound: number | null;
  altitude: AltitudeLayer;
  magicSchool: MagicSchool;
  requiresConcentration: boolean;
  visibleToPlayers: boolean;
}

/* ── Helper functions ──────────────────────────────────────── */

/** Convert an AoETemplate to a HazardZone */
export function templateToHazard(
  tpl: AoETemplate,
  currentRound: number,
  options?: {
    durationRounds?: number | null;
    requiresConcentration?: boolean;
    tickDamage?: string;
    magicSchool?: MagicSchool;
    altitude?: AltitudeLayer;
    leavesGroundEffect?: boolean;
    groundEffectType?: GroundEffectType;
  },
): HazardZone {
  return {
    ...tpl,
    kind: "hazard",
    durationRounds: options?.durationRounds ?? null,
    remainingRounds: options?.durationRounds ?? null,
    placedOnRound: currentRound,
    requiresConcentration: options?.requiresConcentration ?? false,
    tickDamage: options?.tickDamage,
    tickInterval: 1,
    ticks: [],
    lastTickRound: null,
    savingThrowDC: tpl.savingThrowDC,
    savingThrowAbility: tpl.savingThrowAbility,
    altitude: options?.altitude ?? "ground",
    magicSchool: options?.magicSchool ?? "evocation",
    leavesGroundEffect: options?.leavesGroundEffect ?? false,
    groundEffectType: options?.groundEffectType,
    groundEffectDuration: options?.leavesGroundEffect ? 3 : null,
    showRuneRing: true,
    runeRingSpeed: 6,
  };
}

/** Get the next ground effect type for a damage type */
export function damageTypeToGroundEffect(damageType?: string): GroundEffectType | undefined {
  const map: Record<string, GroundEffectType> = {
    fire: "scorch",
    cold: "ice_patch",
    poison: "gas_cloud",
    lightning: "static_field",
    radiant: "radiant_pool",
    necrotic: "shadow_pool",
    thunder: "magnetic_field",
    force: "magnetic_field",
  };
  return damageType ? map[damageType] : undefined;
}

/** Rune character glyphs for each magic school */
export const RUNE_GLYPHS: Record<MagicSchool, string[]> = {
  evocation:     ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ"],
  necromancy:    ["ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ"],
  conjuration:   ["ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ"],
  transmutation: ["ᛋ", "ᛏ", "ᛒ", "ᛖ", "ᛗ"],
  abjuration:    ["ᛚ", "ᛝ", "ᛟ", "ᛞ", "ᛡ"],
  divination:    ["ᛠ", "ᚪ", "ᚫ", "ᚣ", "ᛠ"],
  enchantment:   ["ᛢ", "ᛣ", "ᛤ", "ᛥ", "ᛦ"],
  illusion:      ["ᛧ", "ᛨ", "ᛩ", "ᛪ", "᛫"],
  universal:     ["᛬", "᛭", "ᛮ", "ᛯ", "ᛰ"],
};
