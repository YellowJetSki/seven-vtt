import { Edit3, Trash2 } from "lucide-react";
import type { HomebrewItem } from "@/types/homebrew";

interface HomebrewItemCardProps {
  item: HomebrewItem;
  onEdit: (item: HomebrewItem) => void;
  onDelete: (id: string) => void;
}

export default function HomebrewItemCard({ item, onEdit, onDelete }: HomebrewItemCardProps) {
  return (
    <div className="premium-surface rounded-xl p-3 hover-lift group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-surface-200 truncate">{item.name}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${item.rarity === "legendary" ? "text-amber-400" : item.rarity === "rare" ? "text-mage-400" : item.rarity === "uncommon" ? "text-green-400" : "text-surface-400"}`}>
              {item.rarity}
            </span>
          </div>
          <p className="text-xs text-surface-500 mt-1 line-clamp-2">{item.description}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider bg-surface-700/40 text-surface-400 px-1.5 py-0.5 rounded">{item.category}</span>
            {item.requiresAttunement && <span className="text-[10px] text-accent-400 font-medium">⚡ Attunement</span>}
            <span className="text-[10px] text-surface-500">{item.weight} lb</span>
            <span className="text-[10px] text-divine-400">{item.value} gp</span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-accent-300 transition-all active:scale-90">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-surface-400 hover:text-red-400 transition-all active:scale-90">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
