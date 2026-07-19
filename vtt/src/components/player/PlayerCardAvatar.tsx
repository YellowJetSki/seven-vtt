/**
 * STᚱ VTT — Player Card Avatar (Soul Glow)
 *
 * Premium avatar section with a subtle soul-like glow effect.
 * Image renders with overlay gradient for cinematic depth.
 * Character name with subtle gold shadow, race/class level line.
 * Inspiration indicator with floating star.
 */

import type { PlayerCharacter } from "@/types";

interface PlayerCardAvatarProps {
  character: PlayerCharacter;
}

export default function PlayerCardAvatar({ character: c }: PlayerCardAvatarProps) {
  return (
    <div className="flex items-center gap-3 mb-3">
      {/* Avatar — larger, with gold glow aura */}
      <div className="relative shrink-0">
        {/* Glow aura behind avatar */}
        <div className="absolute -inset-1.5 bg-gold-500/10 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-xl bg-gradient-to-br from-[#1e2032] to-[#14151f] flex items-center justify-center text-xl shrink-0 border border-white/[0.06] ring-1 ring-gold-500/10 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          {c.imageUrl ? (
            <>
              <img
                src={c.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              {/* Cinematic overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b12]/60 via-transparent to-transparent pointer-events-none" />
            </>
          ) : (
            <span className="drop-shadow-[0_0_6px_rgba(234,179,8,0.2)]">⚔</span>
          )}
        </div>
      </div>

      {/* Name + details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white/90 truncate drop-shadow-[0_0_4px_rgba(255,255,255,0.06)]">
            {c.name}
          </h3>
          {c.inspiration && (
            <span className="text-[11px] text-gold-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)] float-arcane shrink-0" title="Inspiration">
              ✦
            </span>
          )}
        </div>
        <p className="text-[10px] text-surface-500 truncate mt-0.5">
          {c.race} · {c.class}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[9px] uppercase tracking-wider font-bold text-gold-500/60 bg-gold-500/10 border border-gold/15 px-1.5 py-0.5 rounded-full">
            Lv{c.level}
          </span>
          {c.subClass && (
            <span className="text-[9px] text-surface-500 truncate">
              {c.subClass}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
