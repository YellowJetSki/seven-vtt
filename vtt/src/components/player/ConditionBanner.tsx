import type { ConditionId } from "@/types";
import { CONDITIONS } from "@/types";

interface ConditionBannerProps {
  conditions: string[];
  onToggle?: (conditionId: ConditionId) => void;
  editable?: boolean;
  compact?: boolean;
}

export default function ConditionBanner({ conditions, onToggle, editable = false, compact = false }: ConditionBannerProps) {
  if (conditions.length === 0 && !compact) {
    return (
      <div className="px-3 py-2 rounded-lg bg-surface-800/30 border border-surface-700/20 text-xs text-surface-500 text-center italic">
        No active conditions
      </div>
    );
  }

  const activeConditions = conditions
    .map((id) => CONDITIONS[id as ConditionId])
    .filter(Boolean);

  if (compact && activeConditions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {activeConditions.map((c) => (
        <div
          key={c.id}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
            editable ? "cursor-pointer hover:scale-105" : ""
          }`}
          style={{
            backgroundColor: `${c.color}20`,
            borderColor: `${c.color}40`,
            color: c.color,
          }}
          title={c.description}
          onClick={() => editable && onToggle?.(c.id)}
          role={editable ? "button" : undefined}
          aria-label={`${c.name} condition`}
        >
          <span>{c.icon}</span>
          <span>{c.name}</span>
        </div>
      ))}
    </div>
  );
}

export function ConditionEffectSummary({ conditions }: { conditions: string[] }) {
  const effects = (() => {
    const ids = conditions.filter((c) => !!CONDITIONS[c as ConditionId]) as ConditionId[];
    const result = {
      speedMod: 0,
      hasDisadvantageOnAttacks: false,
      hasAdvantageOnAttacks: false,
      hasDisadvantageOnSaves: false,
      hasDisadvantageOnChecks: false,
      isIncapacitated: false,
    };

    for (const id of ids) {
      const c = CONDITIONS[id];
      if (!c) continue;
      if (c.setsSpeed !== null) result.speedMod = Math.min(result.speedMod, 0);
      if (c.halvesSpeed) result.speedMod -= 1;
      if (c.appliesDisadvantageTo.includes("attack_rolls")) result.hasDisadvantageOnAttacks = true;
      if (c.appliesAdvantageTo.includes("attack_rolls")) result.hasAdvantageOnAttacks = true;
      if (c.appliesDisadvantageTo.includes("saving_throws")) result.hasDisadvantageOnSaves = true;
      if (c.appliesDisadvantageTo.includes("ability_checks")) result.hasDisadvantageOnChecks = true;
      if (c.preventsActions && c.preventsBonusActions && c.preventsReactions) result.isIncapacitated = true;
    }
    return result;
  })();

  const hasAny = effects.hasDisadvantageOnAttacks || effects.hasAdvantageOnAttacks || effects.hasDisadvantageOnSaves || effects.hasDisadvantageOnChecks || effects.isIncapacitated || effects.speedMod !== 0;

  if (!hasAny) return null;

  return (
    <div className="space-y-1 p-2 rounded-lg bg-surface-800/40 border border-surface-700/20">
      <h4 className="text-[10px] uppercase tracking-widest text-surface-500 font-black">Mechanical Effects</h4>
      <div className="flex flex-wrap gap-1">
        {effects.isIncapacitated && <span className="px-1.5 py-0.5 rounded bg-surface-700/50 text-[9px] text-surface-300">Incapacitated</span>}
        {effects.hasDisadvantageOnAttacks && <span className="px-1.5 py-0.5 rounded bg-warrior-500/20 text-[9px] text-warrior-400">⬇ Attacks</span>}
        {effects.hasAdvantageOnAttacks && <span className="px-1.5 py-0.5 rounded bg-rogue-500/20 text-[9px] text-rogue-400">⬆ Attacks</span>}
        {effects.hasDisadvantageOnSaves && <span className="px-1.5 py-0.5 rounded bg-warrior-500/20 text-[9px] text-warrior-400">⬇ Saves</span>}
        {effects.hasDisadvantageOnChecks && <span className="px-1.5 py-0.5 rounded bg-warrior-500/20 text-[9px] text-warrior-400">⬇ Checks</span>}
        {effects.speedMod < 0 && <span className="px-1.5 py-0.5 rounded bg-surface-700/50 text-[9px] text-surface-300">Speed −{Math.abs(effects.speedMod) * 50}%</span>}
      </div>
    </div>
  );
}
