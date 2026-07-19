import { Edit3, Trash2 } from "lucide-react";
import type { HomebrewFeat } from "@/types/homebrew";

interface HomebrewFeatCardProps {
  feat: HomebrewFeat;
  onEdit: (feat: HomebrewFeat) => void;
  onDelete: (id: string) => void;
}

export default function HomebrewFeatCard({ feat, onEdit, onDelete }: HomebrewFeatCardProps) {
  return (
    <div className="premium-surface rounded-xl p-3 hover-lift group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-surface-200 truncate">{feat.name}</span>
          </div>
          <p className="text-xs text-surface-500 mt-1 line-clamp-2">{feat.description}</p>
          {feat.prerequisites && feat.prerequisites.length > 0 && (
            <div className="flex gap-1 mt-1.5">
              {feat.prerequisites.map((p, i) => (
                <span key={i} className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">{p.description}</span>
              ))}
            </div>
          )}
          {feat.benefits && feat.benefits.length > 0 && (
            <p className="text-[10px] text-surface-400 mt-1">✓ {feat.benefits[0]}{feat.benefits.length > 1 ? ` +${feat.benefits.length - 1} more` : ""}</p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button onClick={() => onEdit(feat)} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-accent-300 transition-all active:scale-90">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(feat.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-surface-400 hover:text-red-400 transition-all active:scale-90">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
