/**
 * STᚱ VTT — Token Inspector
 *
 * Right-side panel for inspecting and editing a selected map token.
 * DM can adjust position (x/y), HP, conditions, visibility, and label.
 * All changes sync instantly to the Theatric Display via campaignStore.
 */

import { useState, useCallback, useEffect } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import Button from "@/components/ui/Button";
import type { MapToken } from "@/types";

interface TokenInspectorProps {
  token: MapToken;
  mapId: string;
  onClose: () => void;
  onTokenUpdated?: (token: MapToken) => void;
}

export default function TokenInspector({
  token,
  mapId,
  onClose,
  onTokenUpdated,
}: TokenInspectorProps) {
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

  const hasChanges = label !== token.label ||
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
  }, [label, xPos, yPos, hpCurrent, hpMax, visible, color, mapId, token, updateMapToken, onTokenUpdated]);

  const handleDelete = useCallback(() => {
    removeMapToken(mapId, token.id);
    onClose();
  }, [mapId, token.id, removeMapToken, onClose]);

  const handleQuickDamage = (amount: number) => {
    const newHp = Math.max(0, Math.min(hpMax || 999, hpCurrent - amount));
    setHpCurrent(newHp);
    setIsDirty(true);
  };

  const handleQuickHeal = (amount: number) => {
    const newHp = Math.min(hpMax || 999, hpCurrent + amount);
    setHpCurrent(newHp);
    setIsDirty(true);
  };

  // Color presets
  const colorPresets = [
    "#4a9eff", "#22c55e", "#ef4444", "#f59e0b",
    "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
    "#84cc16", "#14b8a6", "#d946ef", "#0ea5e9",
  ];

  const hpRatio = hpMax > 0 ? hpCurrent / hpMax : 1;
  const hpColor = hpRatio > 0.5 ? "text-green-400" : hpRatio > 0.25 ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{token.icon || "⬤"}</span>
          <span className="text-sm font-bold text-surface-200">Token Inspector</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-surface-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Label */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black mb-1 block">
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => { setLabel(e.target.value); setIsDirty(true); }}
            className="input-arcane w-full py-1.5 px-2 text-sm"
            placeholder="Token name"
          />
        </div>

        {/* Position */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black mb-1 block">
            Position (Grid)
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <span className="text-[10px] text-surface-500">X</span>
              <input
                type="number"
                value={xPos}
                onChange={(e) => { setXPos(parseInt(e.target.value) || 0); setIsDirty(true); }}
                className="input-arcane w-full py-1 px-2 text-xs"
                min={0}
              />
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-surface-500">Y</span>
              <input
                type="number"
                value={yPos}
                onChange={(e) => { setYPos(parseInt(e.target.value) || 0); setIsDirty(true); }}
                className="input-arcane w-full py-1 px-2 text-xs"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Hit Points */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black mb-1 block">
            Hit Points
          </label>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1">
              <span className="text-[10px] text-surface-500">Current</span>
              <input
                type="number"
                value={hpCurrent}
                onChange={(e) => { setHpCurrent(parseInt(e.target.value) || 0); setIsDirty(true); }}
                className="input-arcane w-full py-1 px-2 text-xs"
                min={0}
              />
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-surface-500">Max</span>
              <input
                type="number"
                value={hpMax}
                onChange={(e) => { setHpMax(parseInt(e.target.value) || 0); setIsDirty(true); }}
                className="input-arcane w-full py-1 px-2 text-xs"
                min={0}
              />
            </div>
          </div>
          {/* HP quick damage buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            <button onClick={() => handleQuickDamage(1)} className="px-2 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">-1</button>
            <button onClick={() => handleQuickDamage(5)} className="px-2 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">-5</button>
            <button onClick={() => handleQuickDamage(10)} className="px-2 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">-10</button>
            <span className="text-xs font-mono font-bold px-2 py-0.5 tabular-nums {hpColor}">{hpCurrent}/{hpMax}</span>
            <button onClick={() => handleQuickHeal(1)} className="px-2 py-0.5 rounded text-[10px] bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors">+1</button>
            <button onClick={() => handleQuickHeal(5)} className="px-2 py-0.5 rounded text-[10px] bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors">+5</button>
            <button onClick={() => handleQuickHeal(10)} className="px-2 py-0.5 rounded text-[10px] bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors">+10</button>
          </div>
          {/* HP bar */}
          <div className="mt-1.5 h-1.5 bg-surface-700/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                hpRatio > 0.5 ? "bg-green-500" : hpRatio > 0.25 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
            />
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black">
            Visible to Players
          </label>
          <button
            onClick={() => { setVisible(!visible); setIsDirty(true); }}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              visible ? "bg-accent-500/50" : "bg-surface-600/40"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                visible ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Color */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black mb-1 block">
            Token Color
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {colorPresets.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setIsDirty(true); }}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  color === c ? "border-white scale-110" : "border-transparent hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="shrink-0 border-t border-surface-700/20 px-4 py-3 space-y-2">
        <Button
          variant="arcane"
          size="sm"
          className="w-full"
          onClick={handleSave}
          disabled={!hasChanges && !isDirty}
        >
          {hasChanges || isDirty ? "✦ Apply Changes" : "✦ No Changes"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={handleDelete}
        >
          ✕ Delete Token
        </Button>
      </div>
    </div>
  );
}
