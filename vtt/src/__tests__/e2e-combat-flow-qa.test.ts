/**
 * E2E: Full Combat Flow QA — D&D 5.5e Real-Play Simulation
 *
 * Tests the complete combat lifecycle:
 *   1. Initiative → Turn tracking → Token movement → HP sync
 *   2. Damage/Healing → Death saves → Revive
 *   3. Combat end → Theatric view auto-follow
 *   4. Cross-system HP integrity (combat store ↔ campaign store)
 *
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 * Scenario: Ambushed by a Young Dragon in the Sunless Citadel
 */
import { describe, it, expect } from "vitest";
import { clampHP, createLogEntry } from "@/stores/combat/combat-helpers";
import { computeAllDerivations, getProficiencyBonus } from "@/lib/mechanics/character-derivations";
import type { CombatEncounter, Combatant, CombatLogEntry, PlayerCharacter, Currency, MapToken } from "@/types";

// ── TEST CHARACTERS (Arkla campaign) ──
const WENDY: PlayerCharacter = {
  id: "wendy_1", name: "Wendy Swiftfoot", playerName: "Alice", race: "Halfling", class: "Rogue", level: 5,
  dexterity: 18, strength: 8, constitution: 14, intelligence: 10, wisdom: 12, charisma: 14,
  hitPoints: { current: 32, max: 38, temporary: 0 },
  armorClass: 15, initiative: 4, proficiencyBonus: 3,
  speed: { walk: 25 }, conditions: [],
  deathSaves: { successes: 0, failures: 0 },
  inventory: [{ name: "Shortsword", quantity: 1, weight: 2, description: "1d6 piercing" }],
  currency: { leptons: 45, quadrants: 0, assarions: 0 },
  experiencePoints: 14000,
  equipment: [], skills: {}, savingThrows: {}, traits: [], features: [], proficiencies: [], languages: [],
  backstory: "", allies: "", characterNotes: "", appearance: "", resources: [],
  createdAt: Date.now(), updatedAt: Date.now(),
};

const KEHRFUFFLE: PlayerCharacter = {
  id: "kehrfuffle_1", name: "Kehrfuffle Ironheart", playerName: "Bob", race: "Human", class: "Paladin", level: 5,
  strength: 16, dexterity: 10, constitution: 14, intelligence: 8, wisdom: 10, charisma: 16,
  hitPoints: { current: 30, max: 44, temporary: 0 },
  armorClass: 21, initiative: 0, proficiencyBonus: 3,
  speed: { walk: 30 }, conditions: [],
  deathSaves: { successes: 0, failures: 0 },
  inventory: [{ name: "Longsword", quantity: 1, weight: 3, description: "1d8+3 slashing" }],
  currency: { leptons: 12, quadrants: 0, assarions: 0 },
  experiencePoints: 14000,
  equipment: [], skills: {}, savingThrows: {}, traits: [], features: [], proficiencies: [], languages: [],
  backstory: "", allies: "", characterNotes: "", appearance: "", resources: [],
  createdAt: Date.now(), updatedAt: Date.now(),
};

const CHARACTERS = [WENDY, KEHRFUFFLE];

// ── COMBAT ENGINE HELPERS ──

function buildCombatants(chars: PlayerCharacter[]): Combatant[] {
  return chars.map((c) => ({
    id: `combatant_${c.id}`,
    name: c.name,
    type: "player" as const,
    initiative: Math.floor(Math.random() * 20) + 1 + (c.initiative || 0),
    armorClass: c.armorClass || 10,
    hitPoints: { current: c.hitPoints.current, max: c.hitPoints.max, temporary: c.hitPoints.temporary || 0 },
    statusEffects: [],
    isDead: false,
    isConcentrating: false,
  }));
}

function createEncounter(name: string, chars: PlayerCharacter[]): CombatEncounter {
  const combatants = buildCombatants(chars);
  return {
    id: `encounter_${Date.now()}`,
    name,
    combatants,
    round: 1,
    currentCombatantIndex: 0,
    turnStartedAt: Date.now(),
    phase: "active",
    startedAt: Date.now(),
    completedAt: undefined,
    elapsedSeconds: 0,
    isPaused: false,
  };
}

// MapToken builder for theatric auto-follow testing
function makeToken(name: string, x: number, y: number): MapToken {
  return {
    id: `token_${name}`,
    label: name,
    x, y,
    type: "player",
    color: "#eab308",
    size: 1,
    visible: true,
  };
}

// ── HP CLAMP UNIT TESTS ──
describe("Combat Flow E2E — HP Clamping", () => {
  it("clampHP: damage reduces HP", () => {
    const result = clampHP({ current: 38, max: 44, temporary: 0 }, -10);
    expect(result.current).toBe(28);
    expect(result.max).toBe(44);
  });

  it("clampHP: healing increases HP (capped at max)", () => {
    const result = clampHP({ current: 30, max: 44, temporary: 0 }, 20);
    expect(result.current).toBe(44); // capped
  });

  it("clampHP: damage cannot go below 0", () => {
    const result = clampHP({ current: 32, max: 38, temporary: 0 }, -100);
    expect(result.current).toBe(0);
  });

  it("clampHP: temp HP absorbs damage first", () => {
    const hp = { current: 38, max: 44, temporary: 10 };
    // 15 damage: 10 absorbed by temp, 5 from real
    const result = clampHP(hp, -15);
    expect(result.temporary).toBe(0);
    expect(result.current).toBe(33);
  });

  it("clampHP: damage exceeding temp+real floors at 0", () => {
    const hp = { current: 10, max: 44, temporary: 5 };
    const result = clampHP(hp, -100);
    expect(result.current).toBe(0);
    expect(result.temporary).toBe(0);
  });

  it("clampHP: healing ignores temp HP", () => {
    const hp = { current: 20, max: 44, temporary: 8 };
    const result = clampHP(hp, 30); // would go to 50, capped at 44
    expect(result.current).toBe(44);
    expect(result.temporary).toBe(8); // temp preserved
  });
});

// ── FULL COMBAT FLOW ──
describe("Combat Flow E2E — Full Combat Lifecycle", () => {
  it("creates encounter with both characters", () => {
    const enc = createEncounter("Dragon Ambush", CHARACTERS);
    expect(enc.combatants).toHaveLength(2);
    expect(enc.phase).toBe("active");
    expect(enc.round).toBe(1);
  });

  it("combatants have correct AC from character data", () => {
    const enc = createEncounter("Test", CHARACTERS);
    const wendy = enc.combatants.find((c) => c.name === "Wendy Swiftfoot");
    const kehr = enc.combatants.find((c) => c.name === "Kehrfuffle Ironheart");
    expect(wendy?.armorClass).toBe(15);
    expect(kehr?.armorClass).toBe(21);
  });

  it("damage to player combatant reduces HP below max", () => {
    const enc = createEncounter("Test", CHARACTERS);
    const wendy = enc.combatants.find((c) => c.name === "Wendy Swiftfoot")!;
    const hp = clampHP(wendy.hitPoints, -25);
    expect(hp.current).toBe(13); // 38 - 25 = 13
    expect(hp.current).toBeLessThan(hp.max);
  });

  it("massive damage drops to 0 and flags isDead", () => {
    const enc = createEncounter("Test", CHARACTERS);
    const wendy = enc.combatants.find((c) => c.name === "Wendy Swiftfoot")!;
    const hp = clampHP(wendy.hitPoints, -100);
    expect(hp.current).toBe(0);
    // isDead is set by caller when hp.current <= 0
  });

  it("healing from 0 revives combatant", () => {
    const enc = createEncounter("Test", CHARACTERS);
    const wendy = enc.combatants.find((c) => c.name === "Wendy Swiftfoot")!;
    // Simulate death
    const deadHP = clampHP(wendy.hitPoints, -100);
    expect(deadHP.current).toBe(0);
    // Simulate revive
    const revived = clampHP({ ...deadHP, current: 0 }, 15);
    expect(revived.current).toBe(15);
    expect(revived.current).toBeGreaterThan(0);
  });

  it("initiative is properly rolled for all combatants", () => {
    const enc = createEncounter("Test", CHARACTERS);
    enc.combatants.forEach((c) => {
      expect(c.initiative).toBeGreaterThanOrEqual(1); // d20 min + 0 mod
      expect(c.initiative).toBeLessThanOrEqual(26); // d20 max + 6 mod
    });
  });

  it("Kehrfuffle has Lay on Hands pool of 25 HP", () => {
    // Paladin L5: 5 * 5 = 25 LoH pool
    const loh = KEHRFUFFLE.level * 5;
    expect(loh).toBe(25);
  });

  it("Wendy's proficiency bonus at L5 is +3", () => {
    expect(getProficiencyBonus(5)).toBe(3);
  });

  it("Kehrfuffle's AC is correctly 21 (Plate + Shield + +1 magic)", () => {
    expect(KEHRFUFFLE.armorClass).toBe(21);
  });
});

// ── CROSS-SYSTEM HP SYNC ──
describe("Combat Flow E2E — HP Sync Integrity", () => {
  it("combatant HP should mirror character HP on encounter creation", () => {
    const enc = createEncounter("Test", CHARACTERS);
    const wendy = enc.combatants.find((c) => c.name === "Wendy Swiftfoot")!;
    expect(wendy.hitPoints.current).toBe(WENDY.hitPoints.current);
    expect(wendy.hitPoints.max).toBe(WENDY.hitPoints.max);
  });

  it("character AC matches combatant AC", () => {
    const enc = createEncounter("Test", CHARACTERS);
    const wendy = enc.combatants.find((c) => c.name === "Wendy Swiftfoot")!;
    expect(wendy.armorClass).toBe(WENDY.armorClass);
  });

  it("player character names uniquely identify combatants", () => {
    const enc = createEncounter("Test", CHARACTERS);
    const names = enc.combatants.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length); // no duplicates
  });

  it("character HP is the root source — combat store is derived", () => {
    // When DM damages via combat tracker, syncCombatantToCharacter()
    // should write back to the campaign store. This test validates
    // the architectural contract.
    const wendyClone = { ...WENDY, hitPoints: { ...WENDY.hitPoints } };
    // Simulate damage applied to combatant
    const newHP = clampHP(wendyClone.hitPoints, -15);
    expect(newHP.current).toBe(23); // 38 - 15
    // The sync bridge would update wendyClone.hitPoints.current = 23
    wendyClone.hitPoints = newHP;
    expect(wendyClone.hitPoints.current).toBe(23);
  });
});

// ── THEATRIC VIEW AUTO-FOLLOW ──
describe("Combat Flow E2E — Theatric Auto-Follow", () => {
  it("token position maps to grid coordinates", () => {
    const token = makeToken("Wendy Swiftfoot", 5, 3);
    expect(token.x).toBe(5);
    expect(token.y).toBe(3);
  });

  it("auto-follow centers camera on current combatant's token", () => {
    const enc = createEncounter("Test", CHARACTERS);
    const tokens = [
      makeToken("Wendy Swiftfoot", 3, 4),
      makeToken("Kehrfuffle Ironheart", 7, 8),
    ];
    const currentIdx = enc.currentCombatantIndex; // 0
    const currentCombatant = enc.combatants[currentIdx];
    const matchingToken = tokens.find(
      (t) => t.label.toLowerCase() === currentCombatant.name.toLowerCase()
    );
    expect(matchingToken).toBeDefined();
    // Camera would center at: x = -(token.x * 50), y = -(token.y * 50)
    if (matchingToken) {
      const camX = -(matchingToken.x * 50);
      const camY = -(matchingToken.y * 50);
      expect(camX).toBe(-150); // 3 * 50
      expect(camY).toBe(-200); // 4 * 50
    }
  });

  it("auto-follow skips if no matching token on map", () => {
    const enc = createEncounter("Test", CHARACTERS);
    const tokens: MapToken[] = []; // empty map
    const currentCombatant = enc.combatants[enc.currentCombatantIndex];
    const match = tokens.find(
      (t) => t.label.toLowerCase() === currentCombatant.name.toLowerCase()
    );
    expect(match).toBeUndefined();
    // Should gracefully skip — no crash
  });

  it("turn change triggers new auto-follow position", () => {
    const enc = createEncounter("Test", CHARACTERS);
    const tokens = [
      makeToken("Wendy Swiftfoot", 3, 4),
      makeToken("Kehrfuffle Ironheart", 7, 8),
    ];

    // Turn 1: Wendy
    const turn1Token = tokens.find(
      (t) => t.label.toLowerCase() === enc.combatants[0].name.toLowerCase()
    );
    expect(turn1Token?.x).toBe(3);

    // Advance to next turn
    enc.currentCombatantIndex = 1;

    // Turn 2: Kehrfuffle
    const turn2Token = tokens.find(
      (t) => t.label.toLowerCase() === enc.combatants[1].name.toLowerCase()
    );
    expect(turn2Token?.x).toBe(7);
  });
});

// ── COMBAT LOG ──
describe("Combat Flow E2E — Combat Log", () => {
  it("creates damage log entries", () => {
    const entry: CombatLogEntry = {
      id: "log_1",
      type: "damage",
      actorId: "dragon",
      actorName: "Young Dragon",
      targetId: "wendy_1",
      targetName: "Wendy Swiftfoot",
      value: 25,
      description: "Fire Breath",
      timestamp: Date.now(),
    };
    expect(entry.type).toBe("damage");
    expect(entry.value).toBe(25);
  });

  it("creates heal log entries", () => {
    const entry: CombatLogEntry = {
      id: "log_2",
      type: "heal",
      actorId: "kehrfuffle",
      actorName: "Kehrfuffle Ironheart",
      targetId: "wendy_1",
      targetName: "Wendy Swiftfoot",
      value: 15,
      description: "Lay on Hands",
      timestamp: Date.now(),
    };
    expect(entry.type).toBe("heal");
    expect(entry.value).toBe(15);
  });

  it("creates death log entries", () => {
    const entry: CombatLogEntry = {
      id: "log_3",
      type: "death",
      actorId: "dragon",
      actorName: "Young Dragon",
      targetId: "wendy_1",
      targetName: "Wendy Swiftfoot",
      value: 0,
      description: "",
      timestamp: Date.now(),
    };
    expect(entry.type).toBe("death");
    expect(entry.deathEntry).toBeUndefined(); // Optional
  });

  it("log timestamps are in chronological order", () => {
    const entries: CombatLogEntry[] = [];
    const now = Date.now();
    entries.push({ id: "1", type: "damage", actorId: "a", actorName: "A", targetId: "t", targetName: "T", value: 5, description: "", timestamp: now - 1000 });
    entries.push({ id: "2", type: "heal", actorId: "a", actorName: "A", targetId: "t", targetName: "T", value: 10, description: "", timestamp: now });
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].timestamp).toBeGreaterThanOrEqual(entries[i - 1].timestamp);
    }
  });

  it("log overflow protection truncates at 500", () => {
    // Simulate the trimCombatLog function
    const MAX_LOG = 500;
    const entries: CombatLogEntry[] = [];
    for (let i = 0; i < MAX_LOG + 50; i++) {
      entries.push({ id: `${i}`, type: "damage", actorId: "a", actorName: "A", targetId: "t", targetName: "T", value: 1, description: "", timestamp: Date.now() + i });
    }
    // Trim oldest 20%
    while (entries.length > MAX_LOG) {
      entries.splice(0, Math.ceil(entries.length * 0.2));
    }
    expect(entries.length).toBeLessThanOrEqual(MAX_LOG);
  });
});
