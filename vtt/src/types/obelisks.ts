/* ── Arkla Obelisk Network Types ───────────────────────────────
 * Data structures for the campaign-spanning Obelisk Network
 * meta-layer. Each obelisk is a monolithic magical structure
 * that serves as a campaign landmark and progression marker.
 * ─────────────────────────────────────────────────────────────── */

/** Unique identifier for each of the 7 obelisks */
export type ObeliskId =
  | "obelisk_veritas"   // Truth — revealed secrets
  | "obelisk_mortis"    // Death — necrotic blight
  | "obelisk_vitae"     // Life — healing waters
  | "obelisk_fabrica"   // Craft — creation/transmutation
  | "obelisk_nox"       // Night — shadow veil
  | "obelisk_ignis"     // Fire — eternal flame
  | "obelisk_aetheris"; // Aether — raw magic

/** Human-readable names for each obelisk */
export const OBELISK_NAMES: Record<ObeliskId, string> = {
  obelisk_veritas:  "Obelisk of Veritas",
  obelisk_mortis:   "Obelisk of Mortis",
  obelisk_vitae:    "Obelisk of Vitae",
  obelisk_fabrica:  "Obelisk of Fabrica",
  obelisk_nox:      "Obelisk of Nox",
  obelisk_ignis:    "Obelisk of Ignis",
  obelisk_aetheris: "Obelisk of Aetheris",
};

/** Progress state of an obelisk */
export type ObeliskState =
  | "undiscovered"    // Not yet found — hidden on map
  | "discovered"      // Found but inactive — shown on map
  | "attuned"         // Party attuned — partially active
  | "corrupted"       // Arkla's blight has taken hold
  | "cleansed"        // Purified — campaign milestone
  | "shattered";      // Destroyed — irreversible

/** Visual state progression for map markers */
export const OBELISK_STATE_ORDER: ObeliskState[] = [
  "undiscovered",
  "discovered",
  "attuned",
  "corrupted",
  "cleansed",
  "shattered",
];

/** Elemental school affinity of each obelisk */
export type ObeliskAffinity =
  | "abjuration"
  | "conjuration"
  | "divination"
  | "enchantment"
  | "evocation"
  | "illusion"
  | "necromancy"
  | "transmutation";

/** Mapping of each obelisk to its primary magical affinity */
export const OBELISK_AFFINITIES: Record<ObeliskId, ObeliskAffinity> = {
  obelisk_veritas:  "divination",
  obelisk_mortis:   "necromancy",
  obelisk_vitae:    "abjuration",
  obelisk_fabrica:  "transmutation",
  obelisk_nox:      "illusion",
  obelisk_ignis:    "evocation",
  obelisk_aetheris: "conjuration",
};

/** School color reference — shared with hazard system */
import type { MagicSchool } from "./hazard-zones";

export const AFFINITY_COLORS: Record<ObeliskAffinity, string> = {
  abjuration:    "#4488ff",
  conjuration:   "#ff8800",
  divination:    "#aa88ff",
  enchantment:   "#ff88ff",
  evocation:     "#ff4444",
  illusion:      "#88ddff",
  necromancy:    "#66cc44",
  transmutation: "#ffdd00",
};

/** A lore fragment unlocked when discovering or attuning to an obelisk */
export interface LoreFragment {
  /** Unique ID */
  id: string;
  /** Title of the fragment */
  title: string;
  /** Body text (Markdown supported) */
  content: string;
  /** Which obelisk this fragment belongs to */
  obeliskId: ObeliskId;
  /** Minimum state required to unlock this fragment */
  requiredState: ObeliskState;
  /** Whether this fragment has been revealed to the party */
  revealed: boolean;
  /** Order in which fragments are revealed (1-based) */
  order: number;
  /** Optional image URL */
  imageUrl?: string;
  /** Optional map location hint */
  locationHint?: string;
}

/** Connection between two obelisks in the network graph */
export interface ObeliskConnection {
  /** Source obelisk */
  sourceId: ObeliskId;
  /** Target obelisk */
  targetId: ObeliskId;
  /** Description of the connection */
  description: string;
  /** Whether this connection is visible (both obelisks must be discovered) */
  visible: boolean;
  /** Connection strength 0–1 (determines line opacity/width) */
  strength: number;
  /** Type of connection */
  type: "ley_line" | "narrative" | "corruption_path" | "resonance";
}

/** Full obelisk data structure */
export interface Obelisk {
  /** Unique identifier */
  id: ObeliskId;
  /** Display name */
  name: string;
  /** Alternative titles (e.g. "The Eye of Truth") */
  aliases: string[];
  /** Current state */
  state: ObeliskState;
  /** Magical affinity */
  affinity: ObeliskAffinity;
  /** Map coordinates for the Theatric View overlay (percentage 0–100) */
  mapPositionX: number;
  mapPositionY: number;
  /** Which battle map (if any) this obelisk is on */
  linkedMapId?: string;
  /** Corruption meter 0–100 (0 = pure, 100 = fully corrupted) */
  corruption: number;
  /** Corruption growth rate per session (0–10) */
  corruptionRate: number;
  /** Lore fragments associated with this obelisk */
  loreFragments: LoreFragment[];
  /** When this obelisk was discovered (timestamp) */
  discoveredAt: number | null;
  /** When this obelisk reached its current state (timestamp) */
  stateChangedAt: number | null;
  /** Notes visible only to DM */
  dmNotes: string;
  /** Whether the party has any attunement charges remaining */
  attunementCharges: number;
  /** Maximum attunement charges */
  maxAttunementCharges: number;
  /** Visual scale modifier (0.5–2.0) for map marker sizing */
  scale: number;
  /** Whether this obelisk pulses/flashes on the map */
  isActive: boolean;
}

/** The complete obelisk network state */
export interface ObeliskNetwork {
  /** All 7 obelisks */
  obelisks: Record<ObeliskId, Obelisk>;
  /** Connections between obelisks */
  connections: ObeliskConnection[];
  /** Global corruption level (average of all obelisks) */
  globalCorruption: number;
  /** Total number of attuned obelisks */
  attunedCount: number;
  /** Total number of cleansed obelisks */
  cleansedCount: number;
  /** Whether the network overlay is currently visible */
  overlayVisible: boolean;
  /** Current zoom level for the network graph (0.5–3.0) */
  zoomLevel: number;
  /** Currently selected obelisk ID (for detail panel) */
  selectedObeliskId: ObeliskId | null;
  /** Last updated timestamp */
  updatedAt: number;
}

/* ── Default Network Topology ────────────────────────────────── */

/** Default obelisk network for the Arkla campaign */
export function createDefaultNetwork(): ObeliskNetwork {
  const now = Date.now();

  const obelisks: Record<ObeliskId, Obelisk> = {
    obelisk_veritas: {
      id: "obelisk_veritas",
      name: "Obelisk of Veritas",
      aliases: ["The Eye of Truth", "Monolith of Revelation"],
      state: "undiscovered",
      affinity: "divination",
      mapPositionX: 25,
      mapPositionY: 30,
      corruption: 0,
      corruptionRate: 1,
      loreFragments: [
        {
          id: "vf_1",
          title: "Whispers of Veritas",
          content: "The obelisk thrums with the voices of those who came before. A Kolari sage once wrote: 'Truth is not found, it is revealed.'",
          obeliskId: "obelisk_veritas",
          requiredState: "discovered",
          revealed: false,
          order: 1,
        },
        {
          id: "vf_2",
          title: "The Seeing Stone",
          content: "At its peak, a crystal that can show distant places. The party may scry on any location they have visited.",
          obeliskId: "obelisk_veritas",
          requiredState: "attuned",
          revealed: false,
          order: 2,
        },
      ],
      discoveredAt: null,
      stateChangedAt: null,
      dmNotes: "",
      attunementCharges: 0,
      maxAttunementCharges: 3,
      scale: 1.0,
      isActive: false,
    },
    obelisk_mortis: {
      id: "obelisk_mortis",
      name: "Obelisk of Mortis",
      aliases: ["The Bone Needle", "Death's Pillar"],
      state: "undiscovered",
      affinity: "necromancy",
      mapPositionX: 70,
      mapPositionY: 20,
      corruption: 0,
      corruptionRate: 3,
      loreFragments: [
        {
          id: "mf_1",
          title: "The Unquiet Dead",
          content: "Shadows cling to this obelisk even in sunlight. The ground beneath is littered with bones that reform each dawn.",
          obeliskId: "obelisk_mortis",
          requiredState: "discovered",
          revealed: false,
          order: 1,
        },
      ],
      discoveredAt: null,
      stateChangedAt: null,
      dmNotes: "",
      attunementCharges: 0,
      maxAttunementCharges: 2,
      scale: 1.1,
      isActive: false,
    },
    obelisk_vitae: {
      id: "obelisk_vitae",
      name: "Obelisk of Vitae",
      aliases: ["The Lifewell", "Spring of Renewal"],
      state: "undiscovered",
      affinity: "abjuration",
      mapPositionX: 15,
      mapPositionY: 70,
      corruption: 0,
      corruptionRate: 1,
      loreFragments: [
        {
          id: "lif_1",
          title: "Waters of Restoration",
          content: "A spring flows from the base of this obelisk. Drinking from it heals wounds and cures poisons — but only once per moon.",
          obeliskId: "obelisk_vitae",
          requiredState: "discovered",
          revealed: false,
          order: 1,
        },
      ],
      discoveredAt: null,
      stateChangedAt: null,
      dmNotes: "",
      attunementCharges: 0,
      maxAttunementCharges: 4,
      scale: 0.9,
      isActive: false,
    },
    obelisk_fabrica: {
      id: "obelisk_fabrica",
      name: "Obelisk of Fabrica",
      aliases: ["The Maker's Spire", "Forge of Creation"],
      state: "undiscovered",
      affinity: "transmutation",
      mapPositionX: 45,
      mapPositionY: 45,
      corruption: 0,
      corruptionRate: 2,
      loreFragments: [
        {
          id: "fab_1",
          title: "The Transmuter's Core",
          content: "Runes of transformation spiral up the obelisk's surface. A skilled crafter could use its resonance to forge magical items.",
          obeliskId: "obelisk_fabrica",
          requiredState: "discovered",
          revealed: false,
          order: 1,
        },
      ],
      discoveredAt: null,
      stateChangedAt: null,
      dmNotes: "",
      attunementCharges: 0,
      maxAttunementCharges: 3,
      scale: 1.0,
      isActive: false,
    },
    obelisk_nox: {
      id: "obelisk_nox",
      name: "Obelisk of Nox",
      aliases: ["The Shadow Spire", "Veil of Night"],
      state: "undiscovered",
      affinity: "illusion",
      mapPositionX: 85,
      mapPositionY: 75,
      corruption: 0,
      corruptionRate: 2,
      loreFragments: [
        {
          id: "nox_1",
          title: "The Shroud",
          content: "This obelisk is perpetually shrouded in shadow, even at high noon. Those who approach feel an unnatural sense of being watched.",
          obeliskId: "obelisk_nox",
          requiredState: "discovered",
          revealed: false,
          order: 1,
        },
      ],
      discoveredAt: null,
      stateChangedAt: null,
      dmNotes: "",
      attunementCharges: 0,
      maxAttunementCharges: 2,
      scale: 1.2,
      isActive: false,
    },
    obelisk_ignis: {
      id: "obelisk_ignis",
      name: "Obelisk of Ignis",
      aliases: ["The Flame Pillar", "Ember Spire"],
      state: "undiscovered",
      affinity: "evocation",
      mapPositionX: 55,
      mapPositionY: 15,
      corruption: 0,
      corruptionRate: 2,
      loreFragments: [
        {
          id: "ign_1",
          title: "The Eternal Flame",
          content: "A flame burns at the obelisk's apex, visible for miles across the isle. It does not consume fuel, nor can water extinguish it.",
          obeliskId: "obelisk_ignis",
          requiredState: "discovered",
          revealed: false,
          order: 1,
        },
      ],
      discoveredAt: null,
      stateChangedAt: null,
      dmNotes: "",
      attunementCharges: 0,
      maxAttunementCharges: 3,
      scale: 1.0,
      isActive: false,
    },
    obelisk_aetheris: {
      id: "obelisk_aetheris",
      name: "Obelisk of Aetheris",
      aliases: ["The Sky Needle", "Aether Core"],
      state: "undiscovered",
      affinity: "conjuration",
      mapPositionX: 35,
      mapPositionY: 85,
      corruption: 0,
      corruptionRate: 1,
      loreFragments: [
        {
          id: "aeth_1",
          title: "The Rift",
          content: "Reality bends around this obelisk. Creatures and objects from distant planes occasionally materialize near its base.",
          obeliskId: "obelisk_aetheris",
          requiredState: "discovered",
          revealed: false,
          order: 1,
        },
      ],
      discoveredAt: null,
      stateChangedAt: null,
      dmNotes: "",
      attunementCharges: 0,
      maxAttunementCharges: 3,
      scale: 1.0,
      isActive: false,
    },
  };

  const connections: ObeliskConnection[] = [
    {
      sourceId: "obelisk_veritas",
      targetId: "obelisk_fabrica",
      description: "Ley line of divination and creation — truth is the first tool of the maker.",
      visible: true,
      strength: 0.6,
      type: "ley_line",
    },
    {
      sourceId: "obelisk_fabrica",
      targetId: "obelisk_ignis",
      description: "The forge and the flame — inseparable in Kolari craft-lore.",
      visible: true,
      strength: 0.8,
      type: "ley_line",
    },
    {
      sourceId: "obelisk_ignis",
      targetId: "obelisk_mortis",
      description: "Fire consumes, death awaits — the cycle of destruction.",
      visible: true,
      strength: 0.5,
      type: "resonance",
    },
    {
      sourceId: "obelisk_mortis",
      targetId: "obelisk_nox",
      description: "Death and shadow walk together in the spaces between stars.",
      visible: true,
      strength: 0.7,
      type: "corruption_path",
    },
    {
      sourceId: "obelisk_nox",
      targetId: "obelisk_aetheris",
      description: "The veil between worlds grows thin where shadow meets sky.",
      visible: true,
      strength: 0.4,
      type: "ley_line",
    },
    {
      sourceId: "obelisk_aetheris",
      targetId: "obelisk_vitae",
      description: "Life emerges from the aether — the primordial cycle.",
      visible: true,
      strength: 0.6,
      type: "ley_line",
    },
    {
      sourceId: "obelisk_vitae",
      targetId: "obelisk_veritas",
      description: "The truth of life is that it must be renewed.",
      visible: true,
      strength: 0.5,
      type: "resonance",
    },
    {
      sourceId: "obelisk_fabrica",
      targetId: "obelisk_aetheris",
      description: "Raw creation reaching into the raw aether.",
      visible: true,
      strength: 0.3,
      type: "ley_line",
    },
    {
      sourceId: "obelisk_mortis",
      targetId: "obelisk_vitae",
      description: "Life and death, two sides of the same coin.",
      visible: true,
      strength: 0.9,
      type: "resonance",
    },
    {
      sourceId: "obelisk_ignis",
      targetId: "obelisk_nox",
      description: "Fire and shadow — light cannot exist without darkness.",
      visible: true,
      strength: 0.4,
      type: "narrative",
    },
  ];

  return {
    obelisks,
    connections,
    globalCorruption: 0,
    attunedCount: 0,
    cleansedCount: 0,
    overlayVisible: true,
    zoomLevel: 1.0,
    selectedObeliskId: null,
    updatedAt: now,
  };
}

/* ── Helper Functions ─────────────────────────────────────────── */

/** Get the next state in the progression sequence */
export function nextObeliskState(current: ObeliskState): ObeliskState | null {
  const idx = OBELISK_STATE_ORDER.indexOf(current);
  if (idx < 0 || idx >= OBELISK_STATE_ORDER.length - 1) return null;
  return OBELISK_STATE_ORDER[idx + 1];
}

/** Get all lore fragments for an obelisk that should be visible at a given state */
export function getVisibleFragments(
  fragments: LoreFragment[],
  currentState: ObeliskState,
): LoreFragment[] {
  const stateIdx = OBELISK_STATE_ORDER.indexOf(currentState);
  return fragments.filter(
    (f) => OBELISK_STATE_ORDER.indexOf(f.requiredState) <= stateIdx,
  ).sort((a, b) => a.order - b.order);
}

/** Calculate global corruption from all obelisks */
export function calculateGlobalCorruption(obelisks: Record<ObeliskId, Obelisk>): number {
  const values = Object.values(obelisks);
  if (values.length === 0) return 0;
  return Math.round(
    values.reduce((sum, o) => sum + o.corruption, 0) / values.length,
  );
}

/** Get color for a corruption level (green → yellow → red) */
export function corruptionColor(level: number): string {
  if (level <= 25) return "#44cc44";
  if (level <= 50) return "#cccc44";
  if (level <= 75) return "#cc8844";
  return "#cc4444";
}

/** Get color for an obelisk affinity */
export function affinityColor(affinity: ObeliskAffinity): string {
  return AFFINITY_COLORS[affinity] ?? "#888888";
}
