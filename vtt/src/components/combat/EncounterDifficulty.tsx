/* ── Encounter Difficulty Calculator ───────────────────────────
 * D&D 5e XP-based encounter difficulty per DMG chapter 3.
 * Takes party level/size and enemy XP values, computes
 * easy/medium/hard/deadly thresholds and actual difficulty.
 *
 * Orchestrates: EncounterDifficultyResult
 * Data: encounter-difficulty-data
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { Button } from "@/components/ui/Button";
import { EncounterDifficultyResult } from "./EncounterDifficultyResult";
import type { EnemyEntry } from "./encounter-difficulty-data";
import { XP_THRESHOLDS, CR_XP, getDifficultyMultiplier } from "./encounter-difficulty-data";

export function EncounterDifficulty() {
  const characters = useCampaignStore((s) => s.characters);
  const [enemies, setEnemies] = useState<EnemyEntry[]>([]);
  const [enemyName, setEnemyName] = useState("");
  const [enemyCr, setEnemyCr] = useState("1");
  const [enemyCount, setEnemyCount] = useState("1");
  const [isOpen, setIsOpen] = useState(false);

  const partyInfo = useMemo(() => {
    if (characters.length === 0) return null;
    const levels = characters.map((c) => c.level);
    const avgLevel = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
    return { count: characters.length, avgLevel, totalLevel: levels.reduce((a, b) => a + b, 0), levels };
  }, [characters]);

  const difficulty = useMemo(() => {
    if (!partyInfo || enemies.length === 0) return null;

    const totalXp = enemies.reduce((sum, e) => sum + (CR_XP[e.cr] ?? 0) * e.count, 0);
    const totalEnemyCount = enemies.reduce((s, e) => s + e.count, 0);
    const multiplier = getDifficultyMultiplier(totalEnemyCount);
    const adjustedXp = Math.round(totalXp * multiplier);

    const thresholds = { easy: 0, medium: 0, hard: 0, deadly: 0 };
    for (const lvl of partyInfo.levels) {
      const t = XP_THRESHOLDS[lvl];
      if (t) {
        thresholds.easy += t.easy;
        thresholds.medium += t.medium;
        thresholds.hard += t.hard;
        thresholds.deadly += t.deadly;
      }
    }

    let rating: "easy" | "medium" | "hard" | "deadly" = "easy";
    if (adjustedXp >= thresholds.deadly) rating = "deadly";
    else if (adjustedXp >= thresholds.hard) rating = "hard";
    else if (adjustedXp >= thresholds.medium) rating = "medium";

    return { totalXp, adjustedXp, multiplier, totalEnemyCount, thresholds, rating, xpPerPlayer: Math.round(adjustedXp / partyInfo.count) };
  }, [enemies, partyInfo]);

  const handleAddEnemy = () => {
    if (!enemyName.trim()) return;
    setEnemies([...enemies, { name: enemyName.trim(), cr: enemyCr, count: parseInt(enemyCount) || 1 }]);
    setEnemyName("");
    setEnemyCount("1");
  };

  if (!partyInfo) {
    return (
      <div className="rounded-2xl border border-surface-700/50 bg-surface-850/80 backdrop-blur-sm p-5 text-center">
        <span className="text-2xl text-surface-600">📊</span>
        <p className="mt-2 text-xs text-surface-500">Add player characters to calculate encounter difficulty.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-700/50 bg-surface-850/80 backdrop-blur-sm overflow-hidden shadow-lg shadow-accent-500/5">
      {/* ── Collapsible Header ── */}
      <button onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center justify-between px-4 py-3 transition-all hover:bg-surface-800/50">
        <div className="flex items-center gap-2">
          <span>📊</span>
          <span className="text-xs font-semibold text-surface-300 group-hover:text-surface-100 transition-colors">Difficulty Calculator</span>
          {difficulty && (
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
              difficulty.rating === "deadly" ? "text-rogue-400 bg-rogue-500/10" :
              difficulty.rating === "hard" ? "text-warrior-400 bg-warrior-500/10" :
              difficulty.rating === "medium" ? "text-mage-400 bg-mage-500/10" :
              "text-divine-400 bg-divine-500/10"
            }`}>
              {difficulty.rating}
            </span>
          )}
        </div>
        <span className={`text-surface-500 text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className="border-t border-surface-700/40 p-4 space-y-3">
          {/* ── Party Info Badge ── */}
          <div className="flex items-center gap-3 text-[11px] text-surface-400 rounded-xl bg-surface-800/60 border border-surface-700/30 px-3 py-2">
            <span className="flex items-center gap-1.5">
              <span className="text-surface-500">👥</span>
              <span>{partyInfo.count} PC{partyInfo.count !== 1 ? "s" : ""}</span>
            </span>
            <span className="text-surface-600">·</span>
            <span>Avg Level {partyInfo.avgLevel}</span>
            <span className="text-surface-600">·</span>
            <span>Total {partyInfo.totalLevel}</span>
          </div>

          {/* ── Enemy Input Row ── */}
          <div className="flex gap-2">
            <input value={enemyName} onChange={(e) => setEnemyName(e.target.value)} placeholder="Enemy name..."
              className="flex-1 rounded-xl border border-surface-700/50 bg-surface-800/80 px-3 py-2 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500/60 focus:outline-none focus:ring-1 focus:ring-accent-500/20 transition-all" />
            <select value={enemyCr} onChange={(e) => setEnemyCr(e.target.value)}
              className="w-18 rounded-xl border border-surface-700/50 bg-surface-800/80 px-2 py-2 text-xs text-surface-100 focus:border-accent-500/60 focus:outline-none transition-all">
              {Object.keys(CR_XP).map((cr) => (<option key={cr} value={cr}>CR {cr}</option>))}
            </select>
            <input type="number" value={enemyCount} onChange={(e) => setEnemyCount(e.target.value)} min="1"
              className="w-14 rounded-xl border border-surface-700/50 bg-surface-800/80 px-2 py-2 text-xs text-surface-100 text-center focus:border-accent-500/60 focus:outline-none transition-all" />
            <Button size="xs" onClick={handleAddEnemy} disabled={!enemyName.trim()}
              className="rounded-xl px-3">
              + Add
            </Button>
          </div>

          {/* ── Enemy List ── */}
          {enemies.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {enemies.map((e, i) => (
                <div key={i}
                  className="group flex items-center gap-2 rounded-xl bg-surface-800/60 border border-surface-700/30 px-3 py-2 hover:bg-surface-800 hover:border-surface-600/50 transition-all">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-warrior-500/10 text-[10px] text-warrior-400">
                    ⚔️
                  </span>
                  <span className="flex-1 text-xs text-surface-300">{e.name} ×{e.count}</span>
                  <span className="text-[10px] text-surface-500 font-mono">CR {e.cr} ({CR_XP[e.cr] ?? 0} XP)</span>
                  <button onClick={() => setEnemies((prev) => prev.filter((_, j) => j !== i))}
                    className="flex h-5 w-5 items-center justify-center rounded text-[9px] text-surface-600 hover:bg-warrior-500/15 hover:text-warrior-400 opacity-0 group-hover:opacity-100 transition-all">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {difficulty && <EncounterDifficultyResult difficulty={difficulty} />}
        </div>
      )}
    </div>
  );
}
