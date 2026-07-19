/**
 * STᚱ VTT — Player Card Avatar
 *
 * Avatar section for the compact player card showing image or icon,
 * name, class/race info, level badge, and inspiration indicator.
 */

import type { PlayerCharacter } from "@/types";

interface PlayerCardAvatarProps {
  character: PlayerCharacter;
}

export default function PlayerCardAvatar({ character: c }: PlayerCardAvatarProps) {
  return (
    <div className="flex items-center gap-3 mb-2.5">
      <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center text-xl shrink-0 border border-gold/20 ring-1 ring-gold/10">
        {c.imageUrl ? (
          <img
            src={c.imageUrl}
            alt=""
            className="w-full h-full rounded-xl object-cover"
          />
        ) : (
          "⚔"
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gold-200 truncate drop-shadow-[0_0_4px_rgba(234,179,8,0.06)]">
            {c.name}
          </h3>
          {c.inspiration && (
            <span className="text-[10px] text-gold-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.2)]" title="Inspiration">
              ✦
            </span>
          )}
        </div>
        <p className="text-[10px] text-gold-500/50 truncate">
          {c.race} · {c.class} {c.level}
          {c.subClass && ` · ${c.subClass}`}
        </p>
      </div>
      <span className="text-[10px] uppercase tracking-wider font-bold text-gold-500/60 bg-gold-500/10 border border-gold/15 px-2 py-0.5 rounded-full">
        Lv{c.level}
      </span>
    </div>
  );
}
