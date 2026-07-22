/**
 * STᚱ VTT — Saving Throw Roll Button
 *
 * Clickable saving throw button for the Player Sheet's Combat Tab.
 * Simulates a d20 roll, compares to the DC, and shows pass/fail visually.
 * No actual dice — convenience tool for tracking rolls.
 */
import { useState, useCallback } from "react";

interface SaveRollButtonProps {
  label: string;
  modifier: number;
  dc: number;
  icon?: string;
  compact?: boolean;
  /** Called when a roll resolves — shows the result */
  onResult?: (label: string, result: "pass" | "fail" | "crit") => void;
}

export default function SaveRollButton({ label, modifier, dc, icon, compact, onResult }: SaveRollButtonProps) {
  const [result, setResult] = useState<{ roll: number; total: number; outcome: "pass" | "fail" | "crit" } | null>(null);
  const [rolling, setRolling] = useState(false);

  const handleRoll = useCallback(() => {
    setRolling(true);
    // Simulate a brief "rolling" animation
    setTimeout(() => {
      const d20 = Math.floor(Math.random() * 20) + 1;
      const total = d20 + modifier;
      let outcome: "pass" | "fail" | "crit";
      if (d20 === 20) outcome = "crit";
      else if (d20 === 1) outcome = "fail"; // natural 1 always fails
      else outcome = total >= dc ? "pass" : "fail";
      setResult({ roll: d20, total, outcome });
      onResult?.(label, outcome);
      setRolling(false);
      // Auto-clear after 3s
      setTimeout(() => setResult(null), 3000);
    }, 400);
  }, [modifier, dc, label, onResult]);

  return (
    <button
      onClick={handleRoll}
      disabled={rolling}
      className={`relative flex items-center gap-1.5 rounded-lg border transition-all duration-150 active:scale-95 ${
        result
          ? result.outcome === "pass" || result.outcome === "crit"
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-red-500/10 border-red-500/20"
          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]"
      } ${compact ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-xs"}`}
      title={`${label}: d20 + ${modifier >= 0 ? "+" : ""}${modifier} vs DC ${dc}`}
    >
      {icon && <span className="text-[10px]">{icon}</span>}
      <span className={`font-semibold ${result ? (result.outcome === "pass" || result.outcome === "crit" ? "text-emerald-300" : "text-red-300") : "text-surface-300"}`}>
        {result
          ? result.outcome === "crit"
            ? `✨ ${result.roll} + ${modifier} = ${result.total}`
            : `${result.roll} + ${modifier} = ${result.total}`
          : `${label} ${modifier >= 0 ? "+" : ""}${modifier}`}
      </span>
      {!result && <span className="text-[8px] text-surface-500">vs DC {dc}</span>}
      {result && (
        <span className={`text-[8px] font-bold uppercase tracking-wider ${
          result.outcome === "pass" || result.outcome === "crit" ? "text-emerald-400" : "text-red-400"
        }`}>
          {result.outcome === "crit" ? "CRIT!" : result.outcome === "pass" ? "✓ Save" : "✕ Fail"}
        </span>
      )}
    </button>
  );
}
