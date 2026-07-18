/**
 * STᚱ VTT — Player Card (Compact)
 *
 * Mobile-first compact player character card for the player list.
 * Large touch target with key stats visible at a glance.
 *
 * Tapping opens the full PlayerSheet modal.
 */

import { useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { Heart, Shield, Zap } from "lucide-react";
import type { PlayerCharacter } from "@/types";

interface PlayerCardCompactProps {
  character: PlayerCharacter;
  onOpen: (character: PlayerCharacter) => void;
}

export default function PlayerCardCompact({ character: c, onOpen }: PlayerCardCompactProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  const hpRatio = useMemo(
    () => (c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 1),
    [c.hitPoints.current, c.hitPoints.max]
  );

  const hpColor = useMemo(
    () => (hpRatio > 0.5 ? "bg-green-500" : hpRatio > 0.25 ? "bg-amber-500" : "bg-red-500"),
    [hpRatio]
  );

  const hpLabel = useMemo(() => {
    if (hpRatio > 0.75) return "Healthy";
    if (hpRatio > 0.5) return "Hurt";
    if (hpRatio > 0.25) return "Bloodied";
    if (hpRatio > 0) return "Critical";
    return "Down";
  }, [hpRatio]);

  const handleHpQuick = useCallback(
    (delta: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const newHp = Math.max(0, Math.min(c.hitPoints.max, c.hitPoints.current + delta));
      updateCharacter(c.id, {
        hitPoints: { ...c.hitPoints, current: newHp },
      });
    },
    [c, updateCharacter]
  );

  // Ability modifier summary for display
  const abilitySummary = [
    { label: "STR", value: c.strength },
    { label: "DEX", value: c.dexterity },
    { label: "CON", value: c.constitution },
    { label: "INT", value: c.intelligence },
    { label: "WIS", value: c.wisdom },
    { label: "CHA", value: c.charisma },
  ];

  // Active conditions display
  const activeConditions = c.conditions?.filter(Boolean) || [];

  return (
    <div
      onClick={() => onOpen(c)}
      className="premium-surface rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-transform touch-manipulation"
    >
      {/* Top row: Avatar + Name + Level */}
      <div className="flex items-center gap-3 mb-2.5">
        <div className="w-12 h-12 rounded-xl bg-accent-600/20 flex items-center justify-center text-xl shrink-0 border border-accent-500/10">
          {c.imageUrl ? (
            <img src={c.imageUrl} alt="" className="w-full h-full rounded-xl object-cover" />
          ) : (
            "⚔"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-surface-200 truncate">{c.name}</h3>
            {c.inspiration && (
              <span className="text-[10px] text-amber-400" title="Inspiration">✦</span>
            )}
          </div>
          <p className="text-[10px] text-surface-500 truncate">
            {c.race} · {c.class} {c.level}
            {c.subClass && ` · ${c.subClass}`}
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold text-surface-500 bg-surface-800/50 px-2 py-0.5 rounded-full">
          Lv{c.level}
        </span>
      </div>

      {/* Stats row: HP bar + AC + Init */}
      <div className="flex items-center gap-3 mb-2.5">
        {/* HP — Large touchable */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-red-400" />
              <span className="text-[9px] uppercase tracking-wider text-surface-500 font-semibold">{hpLabel}</span>
            </div>
            <span className="text-[10px] font-mono font-bold tabular-nums">
              {c.hitPoints.current}
              <span className="text-surface-500">/{c.hitPoints.max}</span>
            </span>
          </div>
          <div className="h-2.5 bg-surface-700/60 rounded-full overflow-hidden">
            <div
              className={`h-full ${hpColor} rounded-full transition-all duration-300`}
              style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick HP buttons + AC + Init */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <button
            onClick={(e) => handleHpQuick(-5, e)}
            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold active:scale-90 transition-transform min-w-[32px]"
          >
            -5
          </button>
          <button
            onClick={(e) => handleHpQuick(5, e)}
            className="px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-[10px] font-bold active:scale-90 transition-transform min-w-[32px]"
          >
            +5
          </button>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1 bg-surface-800/40 px-2 py-1 rounded-lg">
            <Shield className="w-3 h-3 text-accent-400" />
            <span className="text-xs font-bold tabular-nums">{c.armorClass}</span>
          </div>
          <div className="flex items-center gap-1 bg-surface-800/40 px-2 py-1 rounded-lg">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-bold tabular-nums">{c.initiative >= 0 ? "+" : ""}{c.initiative}</span>
          </div>
        </div>
      </div>

      {/* Conditions */}
      {activeConditions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-surface-700/20">
          {activeConditions.slice(0, 4).map((cond) => (
            <span
              key={cond}
              className="px-1.5 py-0.5 rounded text-[9px] bg-accent-600/15 text-accent-400 border border-accent-500/10"
            >
              {cond.charAt(0).toUpperCase() + cond.slice(1)}
            </span>
          ))}
          {activeConditions.length > 4 && (
            <span className="text-[9px] text-surface-500">+{activeConditions.length - 4}</span>
          )}
        </div>
      )}
    </div>
  );
}
