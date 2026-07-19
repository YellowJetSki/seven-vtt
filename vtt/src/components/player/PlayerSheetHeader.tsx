import { X } from "lucide-react";
import type { PlayerCharacter } from "@/types";

interface PlayerSheetHeaderProps {
  character: PlayerCharacter;
  onClose: () => void;
}

export default function PlayerSheetHeader({ character, onClose }: PlayerSheetHeaderProps) {
  const c = character;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 shrink-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-gold-500/10 ring-1 ring-gold/20 flex items-center justify-center text-lg shrink-0">
          {c.imageUrl ? (
            <img src={c.imageUrl} alt="" className="w-full h-full rounded-xl object-cover" />
          ) : (
            "⚔"
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gold-200 truncate drop-shadow-[0_0_6px_rgba(234,179,8,0.08)]">{c.name}</h2>
          <p className="text-[10px] text-gold-500/50 truncate">
            {c.race} · {c.class} {c.level}
            {c.subClass && ` · ${c.subClass}`}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-xl hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 active:scale-90 transition-all"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
