/**
 * STᚱ VTT — useTokenInspector
 *
 * Extracted state management hook for the TokenInspector component.
 * Manages local state, dirty tracking, and save/delete operations.
 */

import { useState, useCallback, useEffect } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { MapToken } from "@/types";

export function useTokenInspector(
  token: MapToken,
  mapId: string,
  onClose: () => void,
  onTokenUpdated?: (token: MapToken) => void
) {
  const updateMapToken = useCampaignStore((s) => s.updateMapToken);
  const removeMapToken = useCampaignStore((s) => s.removeMapToken);

  const [label, setLabel] = useState(token.label);
  const [xPos, setXPos] = useState(token.x);
  const [yPos, setYPos] = useState(token.y);
  const [hpCurrent, setHpCurrent] = useState(token.hp?.current ?? 0);
  const [hpMax, setHpMax] = useState(token.hp?.max ?? 0);
  const [visible, setVisible] = useState(token.visible);
  const [color, setColor] = useState(token.color);
  const [isDirty, setIsDirty] = useState(false);

  // Refresh when token changes
  useEffect(() => {
    setLabel(token.label);
    setXPos(token.x);
    setYPos(token.y);
    setHpCurrent(token.hp?.current ?? 0);
    setHpMax(token.hp?.max ?? 0);
    setVisible(token.visible);
    setColor(token.color);
    setIsDirty(false);
  }, [token]);

  const hasChanges =
    label !== token.label ||
    xPos !== token.x ||
    yPos !== token.y ||
    hpCurrent !== (token.hp?.current ?? 0) ||
    hpMax !== (token.hp?.max ?? 0) ||
    visible !== token.visible ||
    color !== token.color;

  const handleSave = useCallback(() => {
    const updates: Partial<MapToken> = {
      label,
      x: xPos,
      y: yPos,
      visible,
      color,
    };

    if (hpMax > 0) {
      updates.hp = { current: Math.max(0, hpCurrent), max: hpMax };
    } else {
      updates.hp = undefined;
    }

    updateMapToken(mapId, token.id, updates);
    setIsDirty(false);

    onTokenUpdated?.({
      ...token,
      ...updates,
      hp: updates.hp ?? token.hp,
    } as MapToken);
  }, [
    label,
    xPos,
    yPos,
    hpCurrent,
    hpMax,
    visible,
    color,
    mapId,
    token,
    updateMapToken,
    onTokenUpdated,
  ]);

  const handleDelete = useCallback(() => {
    removeMapToken(mapId, token.id);
    onClose();
  }, [mapId, token.id, removeMapToken, onClose]);

  const handleQuickDamage = useCallback(
    (amount: number) => {
      setHpCurrent((prev) =>
        Math.max(0, Math.min(hpMax || 999, prev - amount))
      );
      setIsDirty(true);
    },
    [hpMax]
  );

  const handleQuickHeal = useCallback(
    (amount: number) => {
      setHpCurrent((prev) => Math.min(hpMax || 999, prev + amount));
      setIsDirty(true);
    },
    [hpMax]
  );

  const markDirty = useCallback(() => setIsDirty(true), []);

  return {
    label,
    xPos,
    yPos,
    hpCurrent,
    hpMax,
    visible,
    color,
    hasChanges,
    isDirty,
    setLabel,
    setXPos,
    setYPos,
    setHpCurrent,
    setHpMax,
    setVisible,
    setColor,
    markDirty,
    handleSave,
    handleDelete,
    handleQuickDamage,
    handleQuickHeal,
  };
}
