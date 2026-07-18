import type { ConditionId } from "@/types";
import { CONDITIONS, getConditionEffects } from "@/types";

export interface ActiveCondition {
  id: ConditionId;
  stacks: number;
  source?: string;
  duration?: number; // Remaining rounds
  saveDC?: number;
}

export interface ConditionState {
  active: ActiveCondition[];
  immunities: ConditionId[];
  resistances: ConditionId[];
}

export function applyCondition(
  state: ConditionState,
  conditionId: ConditionId,
  source?: string,
  saveDC?: number
): ConditionState {
  const info = CONDITIONS[conditionId];
  if (!info) return state;
  if (state.immunities.includes(conditionId)) return state;

  const existing = state.active.find((c) => c.id === conditionId);
  if (existing) {
    if (!info.stackable) return state;
    if (existing.stacks >= info.maxStacks) return state;
    return {
      ...state,
      active: state.active.map((c) =>
        c.id === conditionId ? { ...c, stacks: c.stacks + 1 } : c
      ),
    };
  }

  return {
    ...state,
    active: [...state.active, { id: conditionId, stacks: 1, source, duration: info.durationType === "save_ends" ? 60 : undefined, saveDC }],
  };
}

export function removeCondition(state: ConditionState, conditionId: ConditionId): ConditionState {
  return {
    ...state,
    active: state.active.filter((c) => c.id !== conditionId),
  };
}

export function clearAllConditions(state: ConditionState): ConditionState {
  return { ...state, active: [] };
}

export function tickConditions(state: ConditionState): ConditionState {
  return {
    ...state,
    active: state.active
      .map((c) => {
        const info = CONDITIONS[c.id];
        if (!info || info.durationType === "permanent" || info.durationType === "concentration") return c;
        if (c.duration === undefined) return c;
        const remaining = c.duration - 1;
        return remaining <= 0 ? null : { ...c, duration: remaining };
      })
      .filter(Boolean) as ActiveCondition[],
  };
}

export function computeConditionEffects(conditionState: ConditionState): ReturnType<typeof getConditionEffects> {
  const ids = conditionState.active.map((c) => c.id);
  return getConditionEffects(ids);
}

export function getConditionSaveDC(conditionState: ConditionState, conditionId: ConditionId): number | undefined {
  return conditionState.active.find((c) => c.id === conditionId)?.saveDC;
}
