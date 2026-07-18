import type { CombatantHP, CombatLogEntry } from "@/types";

export function generateId(): string {
  return `cbt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function clampHP(hp: CombatantHP, delta: number): CombatantHP {
  let { current, max, temporary } = hp;
  if (delta > 0) {
    if (temporary > 0) {
      const absorbed = Math.min(temporary, delta);
      temporary -= absorbed;
      delta -= absorbed;
    }
    current = Math.min(max, current + delta);
  } else {
    const damage = Math.abs(delta);
    if (temporary > 0) {
      const absorbed = Math.min(temporary, damage);
      temporary -= absorbed;
      current = damage > absorbed ? Math.max(0, current - (damage - absorbed)) : current;
    } else {
      current = Math.max(0, current - damage);
    }
  }
  return { current, max, temporary };
}

export function createLogEntry(
  type: CombatLogEntry["type"],
  actorId: string,
  actorName: string,
  options?: { targetId?: string; targetName?: string; value?: number; description?: string }
): CombatLogEntry {
  return {
    id: generateId(),
    timestamp: Date.now(),
    type,
    actorId,
    actorName,
    ...options,
  };
}

export const defaultConditions = {
  weather: "clear" as const,
  lighting: "bright" as const,
  terrain: "normal" as const,
};
