/* ── Dice Tower ────────────────────────────────────────────────
 * A visually satisfying dice rolling animation that uses
 * pure CSS transforms for the dice tumble — no three.js or
 * external dependencies.
 *
 * ── Usage ─────────────────────────────────────────────────────
 *   <DiceTower />
 *   Renders as a button in the header that opens a modal.
 *
 * ── Note ──────────────────────────────────────────────────────
 * This is an aesthetic dice-tossing simulation. Actual random
 * generation is handled by the host platform's Math.random().
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback, useRef } from "react";

type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

interface DiceResult {
  type: DiceType;
  value: number;
  rollId: number;
}

const DICE_TYPES: { type: DiceType; label: string; sides: number; icon: string }[] = [
  { type: "d4", label: "d4", sides: 4, icon: "🔺" },
  { type: "d6", label: "d6", sides: 6, icon: "⬜" },
  { type: "d8", label: "d8", sides: 8, icon: "🔶" },
  { type: "d10", label: "d10", sides: 10, icon: "🔷" },
  { type: "d12", label: "d12", sides: 12, icon: "⬡" },
  { type: "d20", label: "d20", sides: 20, icon: "🎲" },
  { type: "d100", label: "d100", sides: 100, icon: "💯" },
];

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

let _rollIdCounter = 0;

export function DiceTower() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDice, setSelectedDice] = useState<DiceType[]>(["d20"]);
  const [results, setResults] = useState<DiceResult[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [showTotal, setShowTotal] = useState(false);
  const rollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleDie = useCallback((type: DiceType) => {
    setSelectedDice((prev) =>
      prev.includes(type) ? prev.filter((d) => d !== type) : [...prev, type],
    );
  }, []);

  const handleRoll = useCallback(() => {
    if (isRolling || selectedDice.length === 0) return;
    setIsRolling(true);
    setShowTotal(false);

    // Clear previous results after animation
    rollTimeoutRef.current = setTimeout(() => {
      const newResults: DiceResult[] = selectedDice.map((type) => {
        const sides = DICE_TYPES.find((d) => d.type === type)?.sides ?? 6;
        return { type, value: rollDie(sides), rollId: ++_rollIdCounter };
      });
      setResults(newResults);
      setIsRolling(false);
      setShowTotal(true);
    }, 600);
  }, [isRolling, selectedDice]);

  const total = results.reduce((sum, r) => sum + r.value, 0);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200"
        title="Dice Tower"
        aria-label="Open Dice Tower"
      >
        <span className="text-base">🎲</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-[201] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-surface-100">🎲 Dice Tower</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded text-surface-500 hover:text-surface-200"
              >
                ✕
              </button>
            </div>

            {/* Dice Selection */}
            <div className="mb-4 flex flex-wrap gap-2">
              {DICE_TYPES.map((d) => (
                <button
                  key={d.type}
                  onClick={() => toggleDie(d.type)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                    selectedDice.includes(d.type)
                      ? "border-accent-500/40 bg-accent-500/10 text-accent-300"
                      : "border-surface-700 bg-surface-800 text-surface-400 hover:bg-surface-700"
                  }`}
                >
                  <span>{d.icon}</span>
                  <span>{d.label}</span>
                </button>
              ))}
            </div>

            {/* Roll Button */}
            <button
              onClick={handleRoll}
              disabled={selectedDice.length === 0 || isRolling}
              className="w-full rounded-lg bg-accent-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-500 disabled:opacity-40"
            >
              {isRolling ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Rolling...
                </span>
              ) : (
                `Roll ${selectedDice.length} Die${selectedDice.length !== 1 ? "s" : ""}`
              )}
            </button>

            {/* Results Area with Animation */}
            <div className="mt-4 min-h-[80px]">
              {isRolling ? (
                <div className="flex items-center justify-center py-4">
                  <div className="flex gap-2">
                    {selectedDice.map((type, i) => (
                      <span
                        key={i}
                        className="inline-block h-8 w-8 animate-bounce rounded-md bg-surface-800 text-center text-sm leading-8 text-accent-400"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        ?
                      </span>
                    ))}
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-2 animate-slide-up">
                  {/* Individual Dice */}
                  <div className="flex flex-wrap gap-2">
                    {results.map((r) => {
                      const die = DICE_TYPES.find((d) => d.type === r.type);
                      return (
                        <div
                          key={`${r.rollId}_${r.type}`}
                          className="flex flex-col items-center rounded-lg bg-surface-800 px-3 py-2 min-w-[60px]"
                        >
                          <span className="text-lg">{die?.icon}</span>
                          <span className="text-lg font-bold text-accent-300">{r.value}</span>
                          <span className="text-[10px] text-surface-500">{r.type}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total */}
                  {showTotal && selectedDice.length > 1 && (
                    <div className="flex items-center justify-between rounded-lg bg-accent-500/10 px-3 py-2">
                      <span className="text-xs font-medium text-surface-400">Total</span>
                      <span className="text-lg font-bold text-accent-300">{total}</span>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleRoll}
                      className="flex-1 rounded-md bg-surface-800 py-1.5 text-xs font-medium text-surface-300 hover:bg-surface-700 transition-colors"
                    >
                      Reroll
                    </button>
                    <button
                      onClick={() => setResults([])}
                      className="rounded-md bg-surface-800 px-3 py-1.5 text-xs text-surface-500 hover:bg-surface-700 hover:text-surface-300 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <p className="py-4 text-center text-xs text-surface-500">
                  Select dice and press roll
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
