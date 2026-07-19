import { X } from "lucide-react";
import type { PlayerCharacter } from "@/types";

interface PlayerSheetHeaderProps {
  character: PlayerCharacter;
  onClose: () => void;
}

export default function PlayerSheetHeader({ character, onClose }: PlayerSheetHeaderProps) {
  const c = character;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/20">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-accent-600/20 flex items-center justify-center text-lg shrink-0">
          {c.imageUrl ? (
            <img src={c.imageUrl} alt="" className="w-full h-full rounded-xl object-cover" />
          ) : (
            "⚔"
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-surface-200 truncate">{c.name}</h2>
          <p className="text-[10px] text-surface-500 truncate">
            {c.race} · {c.class} {c.level}
            {c.subClass && ` · ${c.subClass}`}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-xl hover:bg-surface-700/50 text-surface-400 active:scale-90 transition-all"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
