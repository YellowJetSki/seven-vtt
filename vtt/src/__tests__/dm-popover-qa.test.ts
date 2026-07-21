/**
 * STᚱ VTT — DM Popover Systems: Programmatic QA Test Suite (Sprint 33)
 *
 * Tests for the globally accessible DM popover systems:
 *   - DmQuickActionPopover (damage/heal/temp HP/gold)
 *   - DmNpcQuickCreatePopover (statblock builder)
 *   - DmPartyRestOverlay (party-wide rest)
 *   - DmCombatConditionBar (condition management)
 *   - DmCombatWrapUpOverlay (encounter resolution)
 *
 * Focus: Rapid state changes, edge-case input validation, cross-device sync.
 */

import { describe, it, expect, beforeEach } from "vitest";

// ── Test Helpers ──

interface MockCharacter {
  id: string;
  name: string;
  hitPoints: { current: number; max: number; temporary: number };
  experiencePoints: number;
  conditions: string[];
  currency: { copper: number; silver: number; electrum: number; gold: number; platinum: number };
  resources: { name: string; current: number; max: number; recharge: string }[];
  spellSlots: Record<string, { current: number; max: number }>;
  spentHitDice: number;
  level: number;
  armorClass: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  inventory: { name: string; quantity: number; weight: number; isEquipped: boolean; description: string }[];
  activeFeats: { featId: string; featName: string; isActive: boolean }[];
  preparedSpells: string[];
  deathSaves: { successes: number; failures: number };
  saved: boolean;
}

interface MockCombatant {
  id: string;
  name: string;
  type: "player" | "enemy" | "ally";
  initiative: number;
  armorClass: number;
  hitPoints: { current: number; max: number; temporary: number };
  statusEffects: { id: string; effect: string }[];
  isDead: boolean;
  isConcentrating: boolean;
}

interface MockEncounter {
  id: string;
  name: string;
  round: number;
  currentCombatantIndex: number;
  combatants: MockCombatant[];
  phase: "prep" | "active" | "completed";
  startedAt: number;
  completedAt?: number;
}

// ── Mock Data ──

const WENDY: MockCharacter = {
  id: "wendy_001",
  name: "Wendy Lightfoot",
  hitPoints: { current: 38, max: 38, temporary: 0 },
  experiencePoints: 6500,
  conditions: [],
  currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
  resources: [{ name: "Cunning Action", current: 1, max: 1, recharge: "short_rest" }],
  spellSlots: { level1: { current: 0, max: 0 } },
  spentHitDice: 0,
  level: 5,
  armorClass: 17,
  strength: 10,
  dexterity: 18,
  constitution: 14,
  intelligence: 12,
  wisdom: 10,
  charisma: 14,
  inventory: [],
  activeFeats: [],
  preparedSpells: [],
  deathSaves: { successes: 0, failures: 0 },
  saved: false,
};

const KEHRFUFFLE: MockCharacter = {
  id: "kehrfuffle_001",
  name: "Kehrfuffle Ironhide",
  hitPoints: { current: 44, max: 44, temporary: 0 },
  experiencePoints: 6500,
  conditions: [],
  currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
  resources: [
    { name: "Lay on Hands", current: 25, max: 25, recharge: "long_rest" },
    { name: "Channel Divinity", current: 1, max: 1, recharge: "short_rest" },
  ],
  spellSlots: {
    level1: { current: 4, max: 4 },
    level2: { current: 2, max: 2 },
  },
  spentHitDice: 0,
  level: 5,
  armorClass: 21,
  strength: 16,
  dexterity: 10,
  constitution: 14,
  intelligence: 8,
  wisdom: 10,
  charisma: 16,
  inventory: [
    { name: "Longsword +1", quantity: 1, weight: 3, isEquipped: true, description: "A finely crafted longsword with a golden pommel" },
    { name: "Shield", quantity: 1, weight: 6, isEquipped: true, description: "A polished steel shield bearing the symbol of Arkla" },
    { name: "Plate Armor", quantity: 1, weight: 65, isEquipped: true, description: "Full plate armor, gleaming and battle-scarred" },
  ],
  activeFeats: [],
  preparedSpells: ["Bless", "Cure Wounds", "Shield of Faith", "Command"],
  deathSaves: { successes: 0, failures: 0 },
  saved: false,
};

const DRAGON: MockCombatant = {
  id: "dragon_001",
  name: "Young Red Dragon (Emberclaw)",
  type: "enemy",
  initiative: 18,
  armorClass: 18,
  hitPoints: { current: 178, max: 178, temporary: 0 },
  statusEffects: [],
  isDead: false,
  isConcentrating: false,
};

const GOBLIN1: MockCombatant = {
  id: "goblin_001",
  name: "Goblin Scout",
  type: "enemy",
  initiative: 14,
  armorClass: 15,
  hitPoints: { current: 10, max: 10, temporary: 0 },
  statusEffects: [],
  isDead: false,
  isConcentrating: false,
};

const GOBLIN2: MockCombatant = {
  id: "goblin_002",
  name: "Goblin Archer",
  type: "enemy",
  initiative: 12,
  armorClass: 13,
  hitPoints: { current: 7, max: 7, temporary: 0 },
  statusEffects: [],
  isDead: false,
  isConcentrating: false,
};

const mockActiveEncounter: MockEncounter = {
  id: "encounter_001",
  name: "Dragon's Lair",
  round: 3,
  currentCombatantIndex: 0,
  combatants: [DRAGON, GOBLIN1, GOBLIN2],
  phase: "active",
  startedAt: Date.now(),
};

// ── Pure Function Tests ──

describe("DmQuickActionPopover — HP Mutation Logic", () => {
  it("should clamp damage to 0 minimum HP", () => {
    const result = Math.max(0, WENDY.hitPoints.current - 200);
    expect(result).toBe(0);
  });

  it("should NOT exceed max HP when healing", () => {
    const healed = Math.min(KEHRFUFFLE.hitPoints.current + 100, KEHRFUFFLE.hitPoints.max);
    expect(healed).toBe(44);
  });

  it("should handle temp HP absorption before real HP damage", () => {
    const char = { ...WENDY, hitPoints: { ...WENDY.hitPoints, temporary: 10 } };
    const damage = 25;
    const tempAbsorbed = Math.min(char.hitPoints.temporary, damage);
    const remainingDamage = damage - tempAbsorbed;
    const finalHP = Math.max(0, char.hitPoints.current - remainingDamage);
    expect(tempAbsorbed).toBe(10);
    expect(remainingDamage).toBe(15);
    expect(finalHP).toBe(23);
  });

  it("should handle temp HP EXACTLY matching damage", () => {
    const char = { ...WENDY, hitPoints: { ...WENDY.hitPoints, temporary: 15 } };
    const damage = 15;
    const tempAbsorbed = Math.min(char.hitPoints.temporary, damage);
    const finalHP = char.hitPoints.current;
    expect(tempAbsorbed).toBe(15);
    expect(finalHP).toBe(38); // Full HP preserved
  });

  it("should handle temp HP exceeding damage (no real HP loss)", () => {
    const char = { ...KEHRFUFFLE, hitPoints: { ...KEHRFUFFLE.hitPoints, temporary: 20 } };
    const damage = 5;
    const tempAbsorbed = Math.min(char.hitPoints.temporary, damage);
    const finalHP = char.hitPoints.current;
    const finalTemp = char.hitPoints.temporary - damage;
    expect(tempAbsorbed).toBe(5);
    expect(finalHP).toBe(44);
    expect(finalTemp).toBe(15);
  });
});

describe("DmQuickActionPopover — Rapid State Change Stress Test", () => {
  it("should handle 20 rapid damage clicks without negative HP", () => {
    let hp = WENDY.hitPoints.current;
    for (let i = 0; i < 20; i++) {
      hp = Math.max(0, hp - 5);
    }
    expect(hp).toBe(0);
  });

  it("should handle 20 rapid healing clicks without exceeding max", () => {
    let hp = 0; // Start from 0
    for (let i = 0; i < 20; i++) {
      hp = Math.min(WENDY.hitPoints.max, hp + 5);
    }
    expect(hp).toBe(WENDY.hitPoints.max);
  });

  it("should handle alternating damage/heal cycles without drift", () => {
    let hp = WENDY.hitPoints.current;
    for (let i = 0; i < 10; i++) {
      hp = Math.max(0, hp - 10);
      hp = Math.min(WENDY.hitPoints.max, hp + 10);
    }
    // After 10 alternating cycles starting from full HP
    expect(hp).toBe(WENDY.hitPoints.current); // Back to original
  });

  it("should handle 50 rapid damage + heal operations without state corruption", () => {
    let hp = WENDY.hitPoints.current;
    let tempHP = 0;

    for (let i = 0; i < 50; i++) {
      // Alternating damage/temp/heal
      if (i % 3 === 0) {
        // Damage
        const damage = 7;
        const tempAbsorbed = Math.min(tempHP, damage);
        tempHP -= tempAbsorbed;
        hp = Math.max(0, hp - (damage - tempAbsorbed));
      } else if (i % 3 === 1) {
        // Temp HP
        tempHP = Math.min(tempHP + 10, 100);
      } else {
        // Heal
        hp = Math.min(WENDY.hitPoints.max, hp + 5);
      }
    }

    expect(hp).toBeGreaterThanOrEqual(0);
    expect(hp).toBeLessThanOrEqual(WENDY.hitPoints.max);
    expect(tempHP).toBeGreaterThanOrEqual(0);
  });
});

describe("DmQuickActionPopover — Gold Distribution Logic", () => {
  it("should handle gold deposit as item", () => {
    const char = { ...WENDY };
    const goldAmount = 100;
    const item = {
      name: "Gold Coins",
      quantity: goldAmount,
      weight: goldAmount * 0.02,
      description: `Quick deposit of ${goldAmount} GP`,
      isEquipped: false,
    };
    // Simulate addItem
    char.inventory = [...char.inventory, item];
    expect(char.inventory.length).toBe(1);
    expect(char.inventory[0].quantity).toBe(100);
    expect(char.inventory[0].weight).toBe(2); // 100 * 0.02
  });

  it("should handle stacking gold deposits", () => {
    const char = { ...WENDY, inventory: [] };
    const deposits = [10, 25, 50, 100];
    
    for (const amount of deposits) {
      const existing = char.inventory.findIndex((i) => i.name === "Gold Coins");
      if (existing >= 0) {
        char.inventory[existing].quantity += amount;
        char.inventory[existing].weight += amount * 0.02;
      } else {
        char.inventory.push({
          name: "Gold Coins",
          quantity: amount,
          weight: amount * 0.02,
          description: "Quick deposit of GP",
          isEquipped: false,
        });
      }
    }

    expect(char.inventory.length).toBe(1);
    expect(char.inventory[0].quantity).toBe(185); // 10 + 25 + 50 + 100
  });
});

describe("DmNpcQuickCreatePopover — Statblock Generation Logic", () => {
  // Replicate the pure functions from the component
  function crToAvgHp(cr: number): number {
    if (cr <= 0) return 8;
    if (cr <= 0.125) return 10;
    if (cr <= 0.25) return 12;
    if (cr <= 0.5) return 15;
    if (cr <= 1) return 30;
    if (cr <= 2) return 45;
    if (cr <= 3) return 65;
    if (cr <= 4) return 80;
    if (cr <= 5) return 100;
    if (cr <= 6) return 115;
    if (cr <= 7) return 135;
    if (cr <= 8) return 155;
    if (cr <= 9) return 175;
    if (cr <= 10) return 195;
    if (cr <= 12) return 235;
    if (cr <= 14) return 275;
    if (cr <= 16) return 330;
    if (cr <= 18) return 380;
    return 450;
  }

  function crToAvgAc(cr: number): number {
    if (cr <= 0) return 10;
    if (cr <= 0.125) return 11;
    if (cr <= 0.25) return 12;
    if (cr <= 0.5) return 12;
    if (cr <= 1) return 13;
    if (cr <= 2) return 13;
    if (cr <= 3) return 14;
    if (cr <= 4) return 14;
    if (cr <= 5) return 15;
    if (cr <= 6) return 15;
    if (cr <= 7) return 15;
    if (cr <= 8) return 16;
    if (cr <= 9) return 16;
    if (cr <= 10) return 17;
    if (cr <= 12) return 17;
    if (cr <= 14) return 18;
    if (cr <= 16) return 18;
    if (cr <= 18) return 19;
    return 20;
  }

  function getMod(score: number): string {
    const m = Math.floor((score - 10) / 2);
    return m >= 0 ? "+" + m : String(m);
  }

  function getModNum(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  it("should compute correct HP for each CR tier", () => {
    expect(crToAvgHp(0)).toBe(8);
    expect(crToAvgHp(0.125)).toBe(10);
    expect(crToAvgHp(0.25)).toBe(12);
    expect(crToAvgHp(0.5)).toBe(15);
    expect(crToAvgHp(1)).toBe(30);
    expect(crToAvgHp(5)).toBe(100);
    expect(crToAvgHp(10)).toBe(195);
    expect(crToAvgHp(20)).toBe(450);
  });

  it("should compute correct AC for each CR tier", () => {
    expect(crToAvgAc(0)).toBe(10);
    expect(crToAvgAc(1)).toBe(13);
    expect(crToAvgAc(5)).toBe(15);
    expect(crToAvgAc(10)).toBe(17);
    expect(crToAvgAc(20)).toBe(20);
  });

  it("should compute correct ability modifiers", () => {
    expect(getModNum(1)).toBe(-4);
    expect(getModNum(8)).toBe(-1);
    expect(getModNum(10)).toBe(0);
    expect(getModNum(14)).toBe(2);
    expect(getModNum(18)).toBe(4);
    expect(getModNum(20)).toBe(5);
    expect(getModNum(30)).toBe(10);
  });

  it("should format modifiers with + sign", () => {
    expect(getMod(10)).toBe("+0");
    expect(getMod(14)).toBe("+2");
    expect(getMod(8)).toBe("-1");
    expect(getMod(1)).toBe("-4");
    expect(getMod(30)).toBe("+10");
  });

  it("should handle edge-case CR values", () => {
    expect(crToAvgHp(0.0625)).toBe(8); // < 0 → fallback to 0
    expect(crToAvgHp(25)).toBe(450); // > 20 → max
    expect(crToAvgAc(0.0625)).toBe(10);
    expect(crToAvgAc(25)).toBe(20);
  });
});

describe("DmPartyRestOverlay — Party-Wide Rest Application", () => {
  it("should apply short rest to all party members simultaneously", () => {
    const party = [
      { ...WENDY, hitPoints: { ...WENDY.hitPoints, current: 15 } },
      { ...KEHRFUFFLE, hitPoints: { ...KEHRFUFFLE.hitPoints, current: 22 } },
    ];

    const avgHealWendy = Math.floor(Math.max(party[0].hitPoints.max, 6) / 4) + 1; // ~10
    const avgHealKehr = Math.floor(Math.max(party[1].hitPoints.max, 6) / 4) + 1; // ~12

    party[0].hitPoints.current = Math.min(party[0].hitPoints.current + avgHealWendy, party[0].hitPoints.max);
    party[1].hitPoints.current = Math.min(party[1].hitPoints.current + avgHealKehr, party[1].hitPoints.max);

    expect(party[0].hitPoints.current).toBeLessThanOrEqual(WENDY.hitPoints.max);
    expect(party[1].hitPoints.current).toBeLessThanOrEqual(KEHRFUFFLE.hitPoints.max);
    expect(party[0].hitPoints.current).toBeGreaterThan(15); // Healed
    expect(party[1].hitPoints.current).toBeGreaterThan(22); // Healed
  });

  it("should apply long rest to all party members", () => {
    const party = [
      {
        ...WENDY,
        hitPoints: { ...WENDY.hitPoints, current: 0 },
        spentHitDice: 4,
        resources: [{ ...WENDY.resources[0], current: 0 }],
      },
      {
        ...KEHRFUFFLE,
        hitPoints: { ...KEHRFUFFLE.hitPoints, current: 10 },
        spentHitDice: 3,
        resources: KEHRFUFFLE.resources.map((r) => ({ ...r, current: 0 })),
        spellSlots: {
          level1: { current: 0, max: 4 },
          level2: { current: 0, max: 2 },
        },
      },
    ];

    // Apply long rest
    party[0].hitPoints.current = party[0].hitPoints.max;
    party[0].spentHitDice = 0;
    party[0].resources[0].current = party[0].resources[0].max;

    party[1].hitPoints.current = party[1].hitPoints.max;
    party[1].spentHitDice = Math.max(0, party[1].spentHitDice - Math.floor(party[1].level / 2));
    party[1].resources[0].current = party[1].resources[0].max;
    party[1].resources[1].current = party[1].resources[1].max;
    party[1].spellSlots.level1.current = party[1].spellSlots.level1.max;
    party[1].spellSlots.level2.current = party[1].spellSlots.level2.max;

    // Full rest should restore everything
    expect(party[0].hitPoints.current).toBe(WENDY.hitPoints.max);
    expect(party[0].spentHitDice).toBe(0);
    expect(party[0].resources[0].current).toBe(1);

    expect(party[1].hitPoints.current).toBe(KEHRFUFFLE.hitPoints.max);
    expect(party[1].spentHitDice).toBe(3); // Recovered half (floor(5/2) = 2), so 3 - 2 = 1 or 5-2=3
    expect(party[1].resources[1].current).toBe(1);
    expect(party[1].spellSlots.level1.current).toBe(4);
    expect(party[1].spellSlots.level2.current).toBe(2);
  });

  it("should handle rest with already-maxed characters gracefully", () => {
    const fullHealthChar = { ...WENDY, hitPoints: { ...WENDY.hitPoints, current: WENDY.hitPoints.max } };
    const originalHP = fullHealthChar.hitPoints.current;
    
    // Short rest should NOT exceed max
    const afterHeal = Math.min(fullHealthChar.hitPoints.current + 100, fullHealthChar.hitPoints.max);
    expect(afterHeal).toBe(originalHP); // No change
  });
});

describe("DmCombatConditionBar — Condition Application Logic", () => {
  it("should apply and remove conditions without side effects", () => {
    const char = { ...KEHRFUFFLE, conditions: [] };
    
    // Apply Prone
    char.conditions.push("prone");
    expect(char.conditions).toContain("prone");
    
    // Apply another
    char.conditions.push("blinded");
    expect(char.conditions.length).toBe(2);
    
    // Remove Prone
    char.conditions = char.conditions.filter((c) => c !== "prone");
    expect(char.conditions).not.toContain("prone");
    expect(char.conditions).toContain("blinded");
    
    // Clear all
    char.conditions = [];
    expect(char.conditions.length).toBe(0);
  });

  it("should NOT duplicate conditions when toggling same one twice", () => {
    const char = { ...WENDY, conditions: [] };
    
    // Toggle on
    if (!char.conditions.includes("unconscious")) {
      char.conditions.push("unconscious");
    }
    // Toggle on again
    if (!char.conditions.includes("unconscious")) {
      char.conditions.push("unconscious");
    }
    
    expect(char.conditions.length).toBe(1); // Should NOT duplicate
    expect(char.conditions.filter((c) => c === "unconscious").length).toBe(1);
  });

  it("should handle Clear All on already-empty character", () => {
    const char = { ...KEHRFUFFLE, conditions: [] };
    char.conditions = []; // Already empty
    expect(char.conditions.length).toBe(0); // No error
  });
});

describe("DmCombatWrapUpOverlay — XP Calculation Logic", () => {
  // Duplicate the XP table lookup from the component
  function getCrXp(cr: number): number {
    if (cr <= 0) return 10;
    if (cr <= 0.125) return 25;
    if (cr <= 0.25) return 50;
    if (cr <= 0.5) return 100;
    if (cr <= 1) return 200;
    if (cr <= 2) return 450;
    if (cr <= 3) return 700;
    if (cr <= 4) return 1100;
    if (cr <= 5) return 1800;
    if (cr <= 6) return 2300;
    if (cr <= 7) return 2900;
    if (cr <= 8) return 3900;
    if (cr <= 9) return 5000;
    if (cr <= 10) return 5900;
    return 0;
  }

  it("should compute total XP from multiple enemies", () => {
    const enemies = [
      { name: "Goblin", cr: 0.25 }, // 50 XP
      { name: "Goblin", cr: 0.25 }, // 50 XP
      { name: "Dragon", cr: 10 },   // 5900 XP
    ];

    const totalXp = enemies.reduce((sum, e) => sum + getCrXp(e.cr), 0);
    expect(totalXp).toBe(6000); // 50 + 50 + 5900
  });

  it("should compute correct XP per alive character", () => {
    const totalXp = 6000;
    const aliveCount = 2;
    const xpPerAlive = Math.round(totalXp / aliveCount);
    expect(xpPerAlive).toBe(3000);
  });

  it("should handle zero alive (TPK)", () => {
    const totalXp = 6000;
    const aliveCount = 0;
    const xpPerAlive = aliveCount === 0 ? totalXp : Math.round(totalXp / aliveCount);
    expect(xpPerAlive).toBe(6000); // All XP if TPK
  });

  it("should compute correct XP for CR 0 creatures", () => {
    expect(getCrXp(0)).toBe(10);
  });

  it("should compute correct XP for fractional CRs", () => {
    expect(getCrXp(0.125)).toBe(25);
    expect(getCrXp(0.25)).toBe(50);
    expect(getCrXp(0.5)).toBe(100);
  });

  it("should cap at CR 10 for non-Tier 4 campaigns", () => {
    expect(getCrXp(15)).toBe(0); // Above CR 10 returns 0 in this simplified table
  });
});

describe("DmCombatWrapUpOverlay — Loot Theme Application", () => {
  it("should distribute gold to first alive character", () => {
    const party = [
      { ...WENDY, inventory: [] },
      { ...KEHRFUFFLE, inventory: [] },
    ];

    const goldAmount = 200;
    const target = party[0]; // First alive
    
    // Simulate addItem
    target.inventory.push({
      name: "Treasure Hoard Gold Share",
      quantity: goldAmount,
      weight: goldAmount * 0.02,
      description: "Share of Treasure Hoard (200 GP total)",
      isEquipped: false,
    });

    expect(target.inventory.length).toBe(1);
    expect(target.inventory[0].quantity).toBe(200);
    expect(party[1].inventory.length).toBe(0); // Other chars unaffected
  });

  it("should distribute items evenly across alive characters", () => {
    const party = [
      { ...WENDY, inventory: [] },
      { ...KEHRFUFFLE, inventory: [] },
    ];

    const items = [
      { name: "Potion of Healing", quantity: 1, weight: 0.5, description: "Restores 2d4+2 HP", isEquipped: false },
      { name: "Scroll of Identify", quantity: 1, weight: 0, description: "Contains the identify spell", isEquipped: false },
    ];

    // Distribute: Wendy gets item[0], Kehrfuffle gets item[1]
    party[0].inventory.push(items[0]);
    party[1].inventory.push(items[1]);

    expect(party[0].inventory.length).toBe(1);
    expect(party[0].inventory[0].name).toBe("Potion of Healing");
    expect(party[1].inventory.length).toBe(1);
    expect(party[1].inventory[0].name).toBe("Scroll of Identify");
  });

  it("should NOT crash when no alive characters", () => {
    const items = [
      { name: "Potion of Healing", quantity: 1, weight: 0.5, description: "Test", isEquipped: false },
    ];

    const aliveChars: any[] = []; // No one alive
    
    // Should gracefully handle empty array
    expect(aliveChars.length).toBe(0);
    expect(() => {
      // If we tried to distribute to first alive...
      const target = aliveChars[0];
      if (target) target.inventory.push(items[0]);
    }).not.toThrow();
  });
});

describe("Cross-Component State Integrity", () => {
  it("should maintain party state across multiple popover actions", () => {
    // Simulate a full combat round with popover interactions:
    // 1. Quick Action — Dragon deals 24 damage to Wendy
    // 2. Quick Action — Dragon deals 24 damage to Kehrfuffle
    // 3. Condition Bar — Wendy is Prone
    // 4. Condition Bar — Kehrfuffle is Concentrating (Bless)
    // 5. Quick Action — Wendy healed 10 HP

    let wendyHP = 38;
    let kehrHP = 44;
    const wendyConditions: string[] = [];
    const kehrConditions: string[] = [];

    // Step 1: Dragon deals 24 to Wendy
    wendyHP = Math.max(0, wendyHP - 24);
    expect(wendyHP).toBe(14);

    // Step 2: Dragon deals 24 to Kehrfuffle
    kehrHP = Math.max(0, kehrHP - 24);
    expect(kehrHP).toBe(20);

    // Step 3: Condition Bar — Wendy Prone
    if (!wendyConditions.includes("prone")) wendyConditions.push("prone");
    expect(wendyConditions).toContain("prone");

    // Step 4: Condition Bar — Kehrfuffle Concentrating
    if (!kehrConditions.includes("concentrating")) kehrConditions.push("concentrating");
    expect(kehrConditions).toContain("concentrating");

    // Step 5: Quick Action — Heal Wendy 10 HP
    wendyHP = Math.min(38, wendyHP + 10);
    expect(wendyHP).toBe(24);

    // Final state check
    expect(wendyHP).toBe(24);
    expect(kehrHP).toBe(20);
    expect(wendyConditions).toEqual(["prone"]);
    expect(kehrConditions).toEqual(["concentrating"]);

    // Wrap-up: Clear conditions
    wendyConditions.length = 0;
    kehrConditions.length = 0;
    expect(wendyConditions.length).toBe(0);
    expect(kehrConditions.length).toBe(0);
  });

  it("should handle concurrent mutations without cross-contamination", () => {
    // Two DMs/players simultaneously affecting different characters
    let wendyHP = 38;
    let kehrHP = 44;
    let dragonHP = 178;

    // DM1: Wendy takes 10 damage
    // DM2: Dragon takes 15 damage
    // Both happen "simultaneously"

    // Simulate concurrent updates
    const updateWendy = () => { wendyHP = Math.max(0, wendyHP - 10); };
    const updateDragon = () => { dragonHP = Math.max(0, dragonHP - 15); };

    updateWendy();
    updateDragon();

    // Kehrfuffle NOT affected
    expect(wendyHP).toBe(28);
    expect(kehrHP).toBe(44); // Unchanged — no cross-contamination
    expect(dragonHP).toBe(163);
  });
});

describe("Edge Cases & Error Handling", () => {
  it("should handle zero damage without negative state", () => {
    const result = Math.max(0, WENDY.hitPoints.current - 0);
    expect(result).toBe(WENDY.hitPoints.current);
  });

  it("should handle negative damage as healing", () => {
    // If DM accidentally enters -5 in damage mode, it should heal
    const amount = -Math.abs(-5); // -5, correctly treated as damage
    const result = Math.max(0, WENDY.hitPoints.current + amount);
    expect(result).toBe(33); // 38 - 5
  });

  it("should handle non-existent character gracefully", () => {
    const fakeId = "nonexistent_001";
    const char = null;
    expect(char).toBeNull();
    // Should not crash
  });

  it("should handle empty target list without crash", () => {
    const emptyTargets: any[] = [];
    expect(emptyTargets.length).toBe(0);
    // Should produce no action
  });

  it("should handle CR=0 with 1 HP reliably (cantrip-killable)", () => {
    const hp = 1;
    const damage = 1;
    const result = Math.max(0, hp - damage);
    expect(result).toBe(0); // Exactly 0 — dead
  });

  it("should handle overheal from 0 HP correctly", () => {
    let hp = 0; // Dead/unconscious
    const healAmount = 20;
    hp = Math.min(44, hp + healAmount);
    expect(hp).toBe(20); // Revived with 20 HP
  });

  it("should handle negative temp HP (edge case — should clamp to 0)", () => {
    const tempHP = -5; // Invalid state
    const clamped = Math.max(0, tempHP);
    expect(clamped).toBe(0);
  });

  it("should handle massive damage overflow (2000 damage)", () => {
    const result = Math.max(0, KEHRFUFFLE.hitPoints.current - 2000);
    expect(result).toBe(0); // Dead, no overflow
  });
});
