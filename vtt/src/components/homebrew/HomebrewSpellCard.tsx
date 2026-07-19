import { Edit3, Trash2 } from "lucide-react";
import type { HomebrewSpell } from "@/types/homebrew";

interface HomebrewSpellCardProps {
  spell: HomebrewSpell;
  onEdit: (spell: HomebrewSpell) => void;
  onDelete: (id: string) => void;
}

export default function HomebrewSpellCard({ spell, onEdit, onDelete }: HomebrewSpellCardProps) {
  return (
    <div className="premium-surface rounded-xl p-3 hover-lift group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-surface-200 truncate">{spell.name}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${spell.level === 0 ? "text-surface-400" : spell.level <= 3 ? "text-green-400" : spell.level <= 6 ? "text-mage-400" : "text-red-400"}`}>
              {spell.level === 0 ? "Cantrip" : `Lv ${spell.level}`}
            </span>
          </div>
          <p className="text-xs text-surface-500 mt-1 line-clamp-2">{spell.school} · {spell.castingTime}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider bg-surface-700/40 text-surface-400 px-1.5 py-0.5 rounded">{spell.school}</span>
            <span className="text-[10px] text-surface-500">{spell.range}</span>
            <span className="text-[10px] text-accent-400">{spell.components?.join(" ")}</span>
            {spell.concentration && <span className="text-[10px] text-amber-400">Concentration</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button onClick={() => onEdit(spell)} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-accent-300 transition-all active:scale-90">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(spell.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-surface-400 hover:text-red-400 transition-all active:scale-90">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
