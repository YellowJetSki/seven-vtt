/**
 * STᚱ VTT — Player Sheet Header
 *
 * Premium banner-style header with optional DM-set portrait.
 * Shows character name, race/class/level, and close button.
 * Banner image spans full width if imageUrl is set.
 * Falls back to placeholder with rune initial.
 */

import { X } from "lucide-react";
import type { PlayerCharacter } from "@/types";

interface PlayerSheetHeaderProps {
  character: PlayerCharacter;
  onClose: () => void;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function PlayerSheetHeader({ character, onClose }: PlayerSheetHeaderProps) {
  const c = character;
  const hasImage = Boolean(c.imageUrl);

  return (
    <div className="shrink-0 border-b border-gold/10">
      {/* Banner Portrait */}
      {hasImage ? (
        <div className="relative w-full h-36 sm:h-44 overflow-hidden">
          <img
            src={c.imageUrl}
            alt={c.name}
            className="w-full h-full object-cover"
          />
          {/* Gradient fade to bottom for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian/95 via-obsidian/30 to-transparent" />

          {/* Name overlay */}
          <div className="absolute bottom-3 left-4 right-14">
            <h2 className="text-lg font-bold text-gold-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {c.name}
            </h2>
            <p className="text-[10px] text-gold-400/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              {c.race} · {c.class} {c.level}
              {c.subClass && ` · ${c.subClass}`}
            </p>
          </div>

          {/* Close button on banner */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-xl bg-black/40 backdrop-blur-sm text-surface-300 hover:text-gold-400 hover:bg-gold-500/20 active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Placeholder header — no image */
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-500/15 to-amber-500/10 ring-1 ring-gold/20 flex items-center justify-center text-lg shrink-0">
              <span className="text-gold-300 font-black text-lg">{getInitial(c.name)}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gold-200 truncate drop-shadow-[0_0_6px_rgba(234,179,8,0.08)]">
                {c.name}
              </h2>
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
      )}
    </div>
  );
}
