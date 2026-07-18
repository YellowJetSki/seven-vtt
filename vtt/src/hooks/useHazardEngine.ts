/* ── useHazardEngine ────────────────────────────────────────────
 * Custom hook that manages HazardZone lifecycle: creation from
 * AoETemplates, round advancement, tick processing, expiration,
 * extension, and ground effect spawning.
 * All state is ephemeral (client-side only) — hazards eventually
 * serialize back to AoETemplate[] for localStorage persistence.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback, useMemo } from "react";
import type { HazardZone, GroundEffect, MagicSchool, AltitudeLayer } from "@/types/hazard-zones";
import type { AoETemplate } from "@/types/aoe-templates";
import { templateToHazard, damageTypeToGroundEffect } from "@/types/hazard-zones";
import { processRoundAdvance } from "@/lib/hazard-tick-engine";

export interface HazardEngineState {
  hazardZones: HazardZone[];
  groundEffects: GroundEffect[];
  currentRound: number;
}

export function useHazardEngine() {
  const [hazardZones, setHazardZones] = useState<HazardZone[]>([]);
  const [groundEffects, setGroundEffects] = useState<GroundEffect[]>([]);
  const [currentRound, setCurrentRound] = useState(1);

  /** Convert an AoETemplate to a HazardZone when placed */
  const registerHazardFromTemplate = useCallback((
    tpl: AoETemplate,
    options?: {
      durationRounds?: number | null;
      requiresConcentration?: boolean;
      tickDamage?: string;
      magicSchool?: MagicSchool;
      altitude?: AltitudeLayer;
      leavesGroundEffect?: boolean;
    },
  ) => {
    const hazard = templateToHazard(tpl, currentRound, {
      durationRounds: options?.durationRounds ?? 3,
      requiresConcentration: options?.requiresConcentration ?? true,
      tickDamage: options?.tickDamage ?? tpl.damageDice,
      magicSchool: options?.magicSchool ?? "evocation",
      altitude: options?.altitude ?? "ground",
      leavesGroundEffect: options?.leavesGroundEffect ?? true,
      groundEffectType: options?.leavesGroundEffect ?? true
        ? damageTypeToGroundEffect(tpl.damageType)
        : undefined,
    });
    setHazardZones((prev) => [...prev, hazard]);
    return hazard;
  }, [currentRound]);

  /** Advance one round, triggering ticks and expirations */
  const advanceRound = useCallback(() => {
    const nextRound = currentRound + 1;
    const result = processRoundAdvance(hazardZones, groundEffects, nextRound);
    setHazardZones(result.hazards);
    setGroundEffects(result.groundEffects);
    setCurrentRound(nextRound);
    return result;
  }, [currentRound, hazardZones, groundEffects]);

  /** Process damage ticks (without advancing round) */
  const processTicks = useCallback(() => {
    const result = processRoundAdvance(hazardZones, groundEffects, currentRound);
    setHazardZones(result.hazards);
    setGroundEffects(result.groundEffects);
    return result;
  }, [currentRound, hazardZones, groundEffects]);

  /** Expire a specific hazard by ID */
  const expireHazard = useCallback((id: string) => {
    setHazardZones((prev) => {
      const hazard = prev.find((h) => h.id === id);
      if (!hazard) return prev;
      // Spawn ground effect
      const ge = hazard.leavesGroundEffect
        ? {
            id: `ge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            sourceTemplateId: id,
            type: damageTypeToGroundEffect(hazard.damageType) ?? "scorch",
            label: `${hazard.label} residue`,
            gridX: hazard.gridX,
            gridY: hazard.gridY,
            radius: hazard.size,
            color: hazard.color ?? "#aa66ff",
            opacity: 0.3,
            difficultTerrain: false,
            visibleToPlayers: hazard.visibleToPlayers,
            remainingRounds: hazard.groundEffectDuration ?? 3,
            createdAt: Date.now(),
            fadeProgress: 0,
          } as GroundEffect
        : null;
      if (ge) setGroundEffects((prevGe) => [...prevGe, ge]);
      return prev.filter((h) => h.id !== id);
    });
  }, []);

  /** Extend a hazard's duration by N rounds */
  const extendHazard = useCallback((id: string, rounds: number) => {
    setHazardZones((prev) =>
      prev.map((h) =>
        h.id === id && h.remainingRounds !== null
          ? { ...h, remainingRounds: h.remainingRounds + rounds }
          : h,
      ),
    );
  }, []);

  /** Toggle a hazard's visibility */
  const toggleHazardVisibility = useCallback((id: string) => {
    setHazardZones((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, visibleToPlayers: !h.visibleToPlayers } : h,
      ),
    );
  }, []);

  /** Clear all hazards and ground effects */
  const clearAll = useCallback(() => {
    setHazardZones([]);
    setGroundEffects([]);
    setCurrentRound(1);
  }, []);

  /** Serialize hazard zones back to plain AoETemplates for storage */
  const serializeToTemplates = useCallback((): AoETemplate[] => {
    return hazardZones.map((h: HazardZone) => {
      const { leavesGroundEffect: _l, groundEffectType: _g, groundEffectDuration: _gd, showRuneRing: _sr, runeRingSpeed: _rs, ...rest } = h;
      return rest as unknown as AoETemplate;
    });
  }, [hazardZones]);

  /** Deserialize AoETemplates back to HazardZones (reconstructs state from localStorage) */
  const deserializeFromTemplates = useCallback((templates: AoETemplate[], round: number) => {
    const zones: HazardZone[] = templates.map((tpl) =>
      templateToHazard(tpl, round, {
        durationRounds: null, // Non-persistent by default on reload
        requiresConcentration: false,
        tickDamage: tpl.damageDice,
        magicSchool: "evocation",
        altitude: "ground",
        leavesGroundEffect: false,
      }),
    );
    setHazardZones(zones);
    setCurrentRound(round);
  }, []);

  const state: HazardEngineState = useMemo(
    () => ({ hazardZones, groundEffects, currentRound }),
    [hazardZones, groundEffects, currentRound],
  );

  return {
    ...state,
    registerHazardFromTemplate,
    advanceRound,
    processTicks,
    expireHazard,
    extendHazard,
    toggleHazardVisibility,
    clearAll,
    serializeToTemplates,
    deserializeFromTemplates,
  };
}
