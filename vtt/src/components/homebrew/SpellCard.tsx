import type { HomebrewSpell } from "@/types/homebrew";

/* ── Props ── */
interface SpellCardProps {
  spell: HomebrewSpell;
  onEdit: (spell: HomebrewSpell) => void;
  onDelete: (id: string) => void;
}

/* ── School colors ── */
const SCHOOL_COLORS: Record<string, string> = {
  abjuration: "text-mage-400 bg-mage-500/10",
  conjuration: "text-accent-400 bg-accent-500/10",
  divination: "text-divine-400 bg-divine-500/10",
  enchantment: "text-rogue-400 bg-rogue-500/10",
  evocation: "text-warrior-400 bg-warrior-500/10",
  illusion: "text-accent-400 bg-accent-500/10",
  necromancy: "text-surface-400 bg-surface-700",
  transmutation: "text-divine-400 bg-divine-500/10",
};

/* ── Level labels ── */
function levelLabel(level: number): string {
  if (level === 0) return "Cantrip";
  if (level === 1) return "1st-level";
  if (level === 2) return "2nd-level";
  if (level === 3) return "3rd-level";
  return `${level}th-level`;
}

/* ── Component ── */
export function SpellCard({ spell, onEdit, onDelete }: SpellCardProps) {
  const schoolColor = SCHOOL_COLORS[spell.school] ?? "text-surface-400 bg-surface-700";

  return (
    <div className="group relative rounded-xl border border-surface-700 bg-surface-850 p-4 transition-all hover:border-surface-600 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base">
              {spell.school === "abjuration" ? "🛡" :
               spell.school === "conjuration" ? "✨" :
               spell.school === "divination" ? "👁" :
               spell.school === "enchantment" ? "💫" :
               spell.school === "evocation" ? "💥" :
               spell.school === "illusion" ? "🌀" :
               spell.school === "necromancy" ? "💀" :
               spell.school === "transmutation" ? "🔨" : "📖"}
            </span>
            <h3 className="text-sm font-semibold text-surface-100">{spell.name}</h3>
          </div>
          <p className="mt-0.5 text-[11px] text-surface-400">
            {levelLabel(spell.level)} {spell.school}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(spell)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-surface-400 hover:bg-surface-700 hover:text-surface-200"
            aria-label="Edit spell"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(spell.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-warrior-400 hover:bg-warrior-500/10"
            aria-label="Delete spell"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Meta Info Strip */}
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-surface-500">
        <span className="rounded-md bg-surface-800 px-1.5 py-0.5">
          {spell.castingTime === "action" ? "1 Action" :
           spell.castingTime === "bonus action" ? "1 Bonus Action" :
           spell.castingTime === "reaction" ? "1 Reaction" :
           spell.castingTime === "minute" ? "1 Minute" :
           spell.castingTime === "hour" ? "1 Hour" :
           spell.castingTime}
        </span>
        <span className="rounded-md bg-surface-800 px-1.5 py-0.5">{spell.range}</span>
        <span className="rounded-md bg-surface-800 px-1.5 py-0.5">{spell.duration}</span>
      </div>

      {/* School Badge */}
      <div className="mt-2">
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${schoolColor}`}>
          {spell.school.charAt(0).toUpperCase() + spell.school.slice(1)}
        </span>
      </div>

      {/* Components */}
      <div className="mt-1.5 flex gap-1">
        {spell.components.includes("V") && (
          <span className="rounded-sm bg-surface-800 px-1.5 py-0.5 text-[9px] font-mono text-surface-400">V</span>
        )}
        {spell.components.includes("S") && (
          <span className="rounded-sm bg-surface-800 px-1.5 py-0.5 text-[9px] font-mono text-surface-400">S</span>
        )}
        {spell.components.includes("M") && (
          <span className="rounded-sm bg-surface-800 px-1.5 py-0.5 text-[9px] font-mono text-surface-400" title={spell.materialComponent}>
            M{spell.materialComponent ? "*" : ""}
          </span>
        )}
        {spell.ritual && (
          <span className="rounded-sm bg-accent-500/10 px-1.5 py-0.5 text-[9px] text-accent-400">R</span>
        )}
        {spell.concentration && (
          <span className="rounded-sm bg-divine-500/10 px-1.5 py-0.5 text-[9px] text-divine-400">C</span>
        )}
      </div>

      {/* Description */}
      <p className="mt-2 text-xs text-surface-400 line-clamp-2">
        {spell.description}
      </p>

      {/* At Higher Levels */}
      {spell.atHigherLevels && (
        <p className="mt-1 text-[10px] text-surface-500 italic line-clamp-1">
          {spell.atHigherLevels}
        </p>
      )}

      {/* Classes */}
      <div className="mt-2 flex flex-wrap gap-1">
        {spell.classes.map((cls) => (
          <span
            key={cls}
            className="rounded-full bg-surface-800 px-2 py-0.5 text-[9px] text-surface-500"
          >
            {cls.charAt(0).toUpperCase() + cls.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
}
