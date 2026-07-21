/**
 * STᚱ VTT — Damage Number Effect Hook
 *
 * Subscribes to combat store HP mutations and publishes
 * floating damage/heal numbers to the damage number store.
 * The canvas render loop picks these up and draws animated
 * floating numbers at the token position.
 *
 * This hook runs inside CanvasMapView and reacts to combat
 * state changes by comparing previous vs current HP values.
 */

import { useEffect, useRef } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useDamageNumberStore, addDamageFloater } from "@/stores/damageNumberStore";
import type { MapToken } from "@/types";

export function useDamageNumberEffect(
  tokens: MapToken[],
  isActive: boolean
): void {
  // We track the previous HP state for each combatant
  const prevHpRef = useRef<Record<string, { current: number; max: number }>>({});
  // We track the active damage numbers to auto-expire them
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to combat store for HP changes
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const combatLog = useCombatStore((s) => s.combatLog);

  // Monitor combat log for new entries (most reliable trigger)
  const prevLogLengthRef = useRef(0);

  useEffect(() => {
    if (!isActive || !activeEncounter) return;

    const log = combatLog;
    if (log.length <= prevLogLengthRef.current) return;

    // Find new entries since last check
    const newEntries = log.slice(prevLogLengthRef.current);
    prevLogLengthRef.current = log.length;

    for (const entry of newEntries) {
      // Match this entry type to a floating number
      const logValue = entry.value ?? 0;

      // Find token by name or combatant ID
      let matchedToken: MapToken | undefined;

      // Try matching by combatant name
      const actorName = entry.actorName || "";
      matchedToken = tokens.find(
        (t) =>
          t.label?.toLowerCase() === actorName.toLowerCase() ||
          t.id === entry.actorId
      );

      if (!matchedToken) {
        // Try fuzzy match (e.g., "Dragon (Adult Red)" contains "Dragon")
        matchedToken = tokens.find(
          (t) => actorName.toLowerCase().includes(t.label?.toLowerCase() || "") ||
                  (t.label?.toLowerCase() || "").includes(actorName.toLowerCase())
        );
      }

      if (!matchedToken) continue;

      // Determine the type and publish
      switch (entry.type) {
        case "damage":
          addDamageFloater(
            matchedToken.id,
            logValue,
            logValue >= 20 ? "crit" : "damage",
            entry.damageType,
            2000
          );
          break;
        case "heal":
          addDamageFloater(matchedToken.id, logValue, "heal", undefined, 2000);
          break;
        case "death":
          addDamageFloater(matchedToken.id, 0, "kill", undefined, 2500);
          break;
        case "revive":
          addDamageFloater(matchedToken.id, 0, "heal", undefined, 2500);
          break;
      }
    }
  }, [combatLog, activeEncounter, isActive, tokens]);

  // Track previous HP for each combatant (for direct damage detection)
  useEffect(() => {
    if (!isActive || !activeEncounter) return;

    const combatants = activeEncounter.combatants || [];
    const currentHp: Record<string, { current: number; max: number }> = {};

    for (const c of combatants) {
      currentHp[c.id] = { ...c.hitPoints };
    }

    // Compare with previous to detect changes
    const prev = prevHpRef.current;
    for (const c of combatants) {
      const prevHp = prev[c.id];
      if (!prevHp) continue;

      const curr = c.hitPoints;
      const diff = curr.current - prevHp.current;

      if (diff !== 0) {
        // Find matching token
        const token = tokens.find(
          (t) => t.label === c.name || t.id === c.id
        );
        if (!token) continue;

        // Don't add if already handled by combat log listener (avoid duplicates)
        // Only catch edge cases the log doesn't cover
        const isLogTriggered = combatLog.some(
          (entry) =>
            entry.actorId === c.id &&
            (Date.now() - (entry.timestamp || 0)) < 500
        );
        if (isLogTriggered) continue;

        if (diff < 0) {
          addDamageFloater(token.id, Math.abs(diff), "damage", undefined, 2000);
        } else if (diff > 0) {
          addDamageFloater(token.id, diff, "heal", undefined, 2000);
        }
      }
    }

    prevHpRef.current = currentHp;
  }, [activeEncounter?.combatants, isActive, tokens, combatLog]);

  // Clean up expired numbers periodically
  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      useDamageNumberStore.getState().cleanExpired(Date.now());
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);
}
