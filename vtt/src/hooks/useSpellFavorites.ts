/**
 * STᚱ VTT — useSpellFavorites
 *
 * Manages a per-character set of favorite spell names,
 * persisted to localStorage under `spell-faves-{charId}`.
 *
 * Extracted from PlayerSheetSpellsTab.tsx monolith (Sprint 7 refactor).
 */

import { useState, useCallback } from "react";

const DEFAULT_FAVES = ["Magic Missile", "Shield", "Cure Wounds", "Bless"];

export function useSpellFavorites(characterId: string) {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`spell-faves-${characterId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set(DEFAULT_FAVES);
    } catch {
      return new Set(DEFAULT_FAVES);
    }
  });

  const toggleFavorite = useCallback(
    (name: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        localStorage.setItem(`spell-faves-${characterId}`, JSON.stringify([...next]));
        return next;
      });
    },
    [characterId]
  );

  return { favorites, toggleFavorite };
}
