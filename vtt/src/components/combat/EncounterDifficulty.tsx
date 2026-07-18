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
      <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
        <p className="text-xs text-surface-500">Add player characters to calculate encounter difficulty.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850">
      <button onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-surface-200 hover:bg-surface-800 transition-colors">
        <span className="flex items-center gap-2"><span>📊</span><span>Difficulty Calculator</span></span>
        <span className={`text-xs text-surface-500 transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className="border-t border-surface-700 p-4 space-y-3">
          <div className="flex items-center gap-3 text-xs text-surface-400 bg-surface-800 rounded-lg px-3 py-2">
            <span>{partyInfo.count} PC{partyInfo.count !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>Avg Level {partyInfo.avgLevel}</span>
          </div>

          <div className="flex gap-2">
            <input value={enemyName} onChange={(e) => setEnemyName(e.target.value)} placeholder="Enemy name..."
              className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
            <select value={enemyCr} onChange={(e) => setEnemyCr(e.target.value)}
              className="w-16 rounded-lg border border-surface-700 bg-surface-800 px-2 py-1.5 text-xs text-surface-100">
              {Object.keys(CR_XP).map((cr) => (<option key={cr} value={cr}>CR {cr}</option>))}
            </select>
            <input type="number" value={enemyCount} onChange={(e) => setEnemyCount(e.target.value)} min="1"
              className="w-14 rounded-lg border border-surface-700 bg-surface-800 px-2 py-1.5 text-xs text-surface-100 text-center" />
            <Button size="xs" onClick={handleAddEnemy} disabled={!enemyName.trim()}>+</Button>
          </div>

          {enemies.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {enemies.map((e, i) => (
                <div key={i} className="flex items-center gap-2 rounded bg-surface-800 px-2.5 py-1.5">
                  <span className="flex-1 text-xs text-surface-300">{e.name} ×{e.count}</span>
                  <span className="text-[10px] text-surface-500">CR {e.cr} ({CR_XP[e.cr] ?? 0} XP)</span>
                  <button onClick={() => setEnemies((prev) => prev.filter((_, j) => j !== i))}
                    className="text-[10px] text-warrior-400 hover:text-warrior-300">✕</button>
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
