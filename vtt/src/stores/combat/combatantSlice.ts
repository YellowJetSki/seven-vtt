/* ── Combatant Management Slice ────────────────────────────────
 * Add, remove, damage, heal, status effects, concentration, death.
 * ─────────────────────────────────────────────────────────────── */

import type { StateCreator } from "zustand";
import type { CombatStoreState } from "./types";
import { uid, logUid } from "./types";
import type { Combatant, CombatLogEntry, StatusEffect, StatusEffectInstance } from "@/types/combat";
import { getEnemyById } from "@/data/enemy-database";
import { getSyncPlayerHp } from "../combatStore";

export const createCombatantSlice: StateCreator<
  CombatStoreState,
  [],
  [],
  Pick<CombatStoreState,
    "addCombatant" | "addEnemyGroup" | "removeCombatant" | "setCombatantInitiative" |
    "damageCombatant" | "healCombatant" | "setTempHp" |
    "toggleStatus" | "toggleConcentration" | "toggleDead"
  >
> = (set, get) => ({
  addCombatant: (data) => {
    const id = uid("combatant");
    const combatant: Combatant = { ...data, id };
    const encounter = get().activeEncounter;
    if (!encounter) return id;
    set({
      activeEncounter: {
        ...encounter,
        combatants: [...encounter.combatants, combatant],
      },
    });
    return id;
  },

  addEnemyGroup: (name, count) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;

    const template = getEnemyById(name) ?? getEnemyById(name.toLowerCase().replace(/\s+/g, "_"));
    const ac = template?.ac ?? 12;
    const hp = template?.hp ?? 15;

    const newCombatants: Combatant[] = Array.from({ length: count }, (_, i) => ({
      id: uid("enemy"),
      name: `${name} ${i + 1}`,
      type: "enemy" as const,
      initiative: 0,
      armorClass: ac,
      hitPoints: { current: hp, max: hp, temporary: 0 },
      statusEffects: [],
      isDead: false,
      isConcentrating: false,
      notes: "",
    }));

    set({
      activeEncounter: {
        ...encounter,
        combatants: [...encounter.combatants, ...newCombatants],
      },
    });
  },

  removeCombatant: (id) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    set({
      activeEncounter: {
        ...encounter,
        combatants: encounter.combatants.filter((c) => c.id !== id),
      },
    });
  },

  setCombatantInitiative: (id, value) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    set({
      activeEncounter: {
        ...encounter,
        combatants: encounter.combatants.map((c) =>
          c.id === id ? { ...c, initiative: value } : c,
        ),
      },
    });
  },

  damageCombatant: (id, amount, source) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    const target = encounter.combatants.find((c) => c.id === id);
    if (!target) return;

    let tempRemaining = target.hitPoints.temporary;
    let realDamage = amount;
    if (tempRemaining > 0) {
      const absorbed = Math.min(tempRemaining, amount);
      tempRemaining -= absorbed;
      realDamage = amount - absorbed;
    }

    const newHp = Math.max(0, target.hitPoints.current - realDamage);
    const isDead = newHp <= 0 && !target.isDead;

    const logEntry: CombatLogEntry = {
      id: logUid(),
      timestamp: Date.now(),
      type: isDead ? "death" : "damage",
      actorId: source ?? "DM",
      actorName: source ?? "DM",
      targetId: target.id,
      targetName: target.name,
      value: amount,
      description: `${target.name} takes ${amount} damage${isDead ? " — DEAD!" : ""} (${realDamage} to HP, ${amount - realDamage} to temp)`,
    };

    const updatedCombatants = encounter.combatants.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        hitPoints: { ...c.hitPoints, current: newHp, temporary: Math.max(0, tempRemaining) },
        isDead,
      };
    });

    set({
      activeEncounter: { ...encounter, combatants: updatedCombatants },
      combatLog: [logEntry, ...get().combatLog],
    });

    const syncHp = getSyncPlayerHp();
    if (syncHp) syncHp(updatedCombatants);
  },

  healCombatant: (id, amount, source) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    const target = encounter.combatants.find((c) => c.id === id);
    if (!target) return;

    const newHp = Math.min(target.hitPoints.max, target.hitPoints.current + amount);

    const logEntry: CombatLogEntry = {
      id: logUid(),
      timestamp: Date.now(),
      type: "heal",
      actorId: source ?? "DM",
      actorName: source ?? "DM",
      targetId: target.id,
      targetName: target.name,
      value: amount,
      description: `${target.name} healed for ${amount} HP (${target.hitPoints.current} → ${newHp})`,
    };

    const updatedCombatants = encounter.combatants.map((c) =>
      c.id === id
        ? { ...c, hitPoints: { ...c.hitPoints, current: newHp }, isDead: false }
        : c,
    );

    set({
      activeEncounter: { ...encounter, combatants: updatedCombatants },
      combatLog: [logEntry, ...get().combatLog],
    });

    const syncHp = getSyncPlayerHp();
    if (syncHp) syncHp(updatedCombatants);
  },

  setTempHp: (id, amount) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    const updatedCombatants = encounter.combatants.map((c) =>
      c.id === id
        ? { ...c, hitPoints: { ...c.hitPoints, temporary: amount } }
        : c,
    );
    set({ activeEncounter: { ...encounter, combatants: updatedCombatants } });
    const syncHp = getSyncPlayerHp();
    if (syncHp) syncHp(updatedCombatants);
  },

  toggleStatus: (id, effect) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    const updatedCombatants = encounter.combatants.map((c) => {
      if (c.id !== id) return c;
      const exists = c.statusEffects.some((s) => s.effect === effect);
      if (exists) {
        return { ...c, statusEffects: c.statusEffects.filter((s) => s.effect !== effect) };
      }
      const newEffect: StatusEffectInstance = { id: uid("status"), effect };
      return { ...c, statusEffects: [...c.statusEffects, newEffect] };
    });
    set({ activeEncounter: { ...encounter, combatants: updatedCombatants } });
  },

  toggleConcentration: (id) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    set({
      activeEncounter: {
        ...encounter,
        combatants: encounter.combatants.map((c) =>
          c.id === id ? { ...c, isConcentrating: !c.isConcentrating } : c,
        ),
      },
    });
  },

  toggleDead: (id) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    const updatedCombatants = encounter.combatants.map((c) =>
      c.id === id ? { ...c, isDead: !c.isDead } : c,
    );
    set({ activeEncounter: { ...encounter, combatants: updatedCombatants } });
    const syncHp = getSyncPlayerHp();
    if (syncHp) syncHp(updatedCombatants);
  },
});
