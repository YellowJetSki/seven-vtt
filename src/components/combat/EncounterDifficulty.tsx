/* ── Encounter Difficulty Calculator ───────────────────────────
 * D&D 5e XP-based encounter difficulty per DMG chapter 3.
 * Takes party level/size and enemy XP values, computes
 * easy/medium/hard/deadly thresholds and actual difficulty.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { Button } from "@/components/ui/Button";

/* ── XP Thresholds per Character Level (DMG p. 82) ─────────── */
const XP_THRESHOLDS: Record<number, { easy: number; medium: number; hard: number; deadly: number }> = {
  1:  { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2:  { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3:  { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4:  { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5:  { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6:  { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7:  { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8:  { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9:  { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

/* ── Monster XP Values by CR (DMG p. 274) ──────────────────── */
const CR_XP: Record<string, number> = {
  "0": 10, "1/8": 25, "1/4": 50, "1/2": 100,
  "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800,
  "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900,
  "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000,
  "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000,
  "21": 33000, "22": 41000, "23": 50000, "24": 62000, "25": 75000,
  "26": 90000, "27": 105000, "28": 120000, "29": 135000, "30": 155000,
};

/* ── Multiplier by Enemy Count (DMG p. 83) ──────────────────── */
function getMultiplier(count: number): number {
  if (count === 1) return 1;
  if (count === 2) return 1.5;
  if (count >= 3 && count <= 6) return 2;
  if (count >= 7 && count <= 10) return 2.5;
  if (count >= 11 && count <= 14) return 3;
  return 4;
}

interface EnemyEntry {
  name: string;
  cr: string;
  count: number;
}

export function EncounterDifficulty() {
  const characters = useCampaignStore((s) => s.campaign?.playerCharacters ?? []);
  const [enemies, setEnemies] = useState<EnemyEntry[]>([]);
  const [enemyName, setEnemyName] = useState("");
  const [enemyCr, setEnemyCr] = useState("1");
  const [enemyCount, setEnemyCount] = useState("1");
  const [isOpen, setIsOpen] = useState(false);

  const partyInfo = useMemo(() => {
    if (characters.length === 0) return null;
    const levels = characters.map((c) => c.level);
    const avgLevel = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
    const totalLevel = levels.reduce((a, b) => a + b, 0);
    return { count: characters.length, avgLevel, totalLevel, levels };
  }, [characters]);

  const difficulty = useMemo(() => {
    if (!partyInfo || enemies.length === 0) return null;

    // Total XP from all enemies
    const totalXp = enemies.reduce((sum, e) => {
      const xpPer = CR_XP[e.cr] ?? 0;
      return sum + xpPer * e.count;
    }, 0);

    // Apply multiplier for group size
    const totalEnemyCount = enemies.reduce((s, e) => s + e.count, 0);
    const multiplier = getMultiplier(totalEnemyCount);
    const adjustedXp = Math.round(totalXp * multiplier);

    // Party thresholds
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

    return {
      totalXp,
      adjustedXp,
      multiplier,
      totalEnemyCount,
      thresholds,
      rating,
      xpPerPlayer: Math.round(adjustedXp / partyInfo.count),
    };
  }, [enemies, partyInfo]);

  const handleAddEnemy = () => {
    if (!enemyName.trim() || !enemyCr || !enemyCount) return;
    const count = parseInt(enemyCount) || 1;
    setEnemies([...enemies, { name: enemyName.trim(), cr: enemyCr, count }]);
    setEnemyName("");
    setEnemyCount("1");
  };

  const handleRemoveEnemy = (index: number) => {
    setEnemies(enemies.filter((_, i) => i !== index));
  };

  const DIFFICULTY_STYLES: Record<string, { label: string; color: string; bg: string }> = {
    easy: { label: "Easy", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    medium: { label: "Medium", color: "text-mage-400", bg: "bg-mage-500/10" },
    hard: { label: "Hard", color: "text-warrior-400", bg: "bg-warrior-500/10" },
    deadly: { label: "Deadly", color: "text-rogue-400", bg: "bg-rogue-500/10" },
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-surface-200 hover:bg-surface-800 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>📊</span>
          <span>Difficulty Calculator</span>
        </span>
        <span className={`text-xs text-surface-500 transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className="border-t border-surface-700 p-4 space-y-3">
          {/* Party Info */}
          <div className="flex items-center gap-3 text-xs text-surface-400 bg-surface-800 rounded-lg px-3 py-2">
            <span>{partyInfo.count} PC{partyInfo.count !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>Avg Level {partyInfo.avgLevel}</span>
            <span>·</span>
            <span>Total Levels {partyInfo.totalLevel}</span>
          </div>

          {/* Add Enemy */}
          <div className="flex gap-2">
            <input value={enemyName} onChange={(e) => setEnemyName(e.target.value)} placeholder="Enemy name..."
              className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
            <select value={enemyCr} onChange={(e) => setEnemyCr(e.target.value)}
              className="w-16 rounded-lg border border-surface-700 bg-surface-800 px-2 py-1.5 text-xs text-surface-100 focus:border-accent-500 focus:outline-none">
              {Object.keys(CR_XP).map((cr) => (
                <option key={cr} value={cr}>CR {cr}</option>
              ))}
            </select>
            <input type="number" value={enemyCount} onChange={(e) => setEnemyCount(e.target.value)} min="1"
              className="w-14 rounded-lg border border-surface-700 bg-surface-800 px-2 py-1.5 text-xs text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
            <Button size="xs" onClick={handleAddEnemy} disabled={!enemyName.trim()}>+</Button>
          </div>

          {/* Enemy List */}
          {enemies.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {enemies.map((e, i) => (
                <div key={i} className="flex items-center gap-2 rounded bg-surface-800 px-2.5 py-1.5">
                  <span className="flex-1 text-xs text-surface-300">{e.name} ×{e.count}</span>
                  <span className="text-[10px] text-surface-500">CR {e.cr} ({CR_XP[e.cr] ?? 0} XP)</span>
                  <button onClick={() => handleRemoveEnemy(i)} className="text-[10px] text-warrior-400 hover:text-warrior-300">✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Result */}
          {difficulty && (
            <div className={`rounded-lg p-3 ${DIFFICULTY_STYLES[difficulty.rating].bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-surface-100">Difficulty: </span>
                <span className={`text-lg font-bold ${DIFFICULTY_STYLES[difficulty.rating].color}`}>
                  {DIFFICULTY_STYLES[difficulty.rating].label}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="text-surface-400">Total XP: <span className="text-surface-200">{difficulty.totalXp}</span></div>
                <div className="text-surface-400">Adjusted XP: <span className="text-surface-200">{difficulty.adjustedXp}</span></div>
                <div className="text-surface-400">Multiplier: <span className="text-surface-200">×{difficulty.multiplier}</span></div>
                <div className="text-surface-400">XP/Player: <span className="text-surface-200">{difficulty.xpPerPlayer}</span></div>
              </div>
              <div className="mt-2 flex gap-3 text-[10px]">
                <span className="text-emerald-400">E: {difficulty.thresholds.easy}</span>
                <span className="text-mage-400">M: {difficulty.thresholds.medium}</span>
                <span className="text-warrior-400">H: {difficulty.thresholds.hard}</span>
                <span className="text-rogue-400">D: {difficulty.thresholds.deadly}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
