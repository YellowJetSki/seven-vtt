import { Trash2 } from "lucide-react";
import type { AoETemplate } from "@/types";

interface AoETemplateListProps {
  templates: AoETemplate[];
  mapId: string;
  onRemove: (mapId: string, templateId: string) => void;
}

export default function AoETemplateList({ templates, mapId, onRemove }: AoETemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-surface-500 text-[10px]">No spell templates placed</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {templates.map((tpl) => (
        <div key={tpl.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-surface-800/30 border border-surface-700/20">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tpl.color }} />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-surface-300 truncate block">{tpl.label}</span>
            <span className="text-[9px] text-surface-500">
              {tpl.shape} · {tpl.size}ft · {tpl.direction.toUpperCase()}
              {tpl.damageType && ` · ${tpl.damageType}`}
            </span>
          </div>
          <button onClick={() => onRemove(mapId, tpl.id)}
            className="p-1 rounded hover:bg-red-500/15 text-surface-400 hover:text-red-400 transition-all active:scale-90">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
