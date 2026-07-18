/* ══════════════════════════════════════════════════════════════
   Conditions Display — Pedal-Sheet Style
   Condition badges with hover tooltips showing mechanics.
   Inspired by pedal-sheet's condition warnings system.
   ══════════════════════════════════════════════════════════════ */

interface Props {
  conditions: string[];
}

const COND_META: Record<string, { icon: string; desc: string }> = {
  blinded: { icon: "👁️‍🗨️", desc: "Auto-fail Perception checks. Attack rolls at disadvantage." },
  charmed: { icon: "💕", desc: "Can't attack the charmer. Charmer has advantage on social checks." },
  deafened: { icon: "🔇", desc: "Auto-fail hearing-based Perception checks." },
  exhaustion: { icon: "😫", desc: "Cumulative debuffs: disadvantage on ability checks at level 1, speed halved at 2, etc." },
  frightened: { icon: "😨", desc: "Disadvantage on ability checks and attack rolls while source is visible." },
  grappled: { icon: "🤝", desc: "Speed becomes 0. Grappler can drag you." },
  incapacitated: { icon: "🌀", desc: "Cannot take actions or reactions." },
  invisible: { icon: "👻", desc: "Attack rolls against you have disadvantage. Your attacks have advantage." },
  paralyzed: { icon: "🧊", desc: "Incapacitated. Auto-fail STR/DEX saves. Melee hits auto-crit." },
  petrified: { icon: "🗿", desc: "Turned to stone. Incapacitated. RES to all damage." },
  poisoned: { icon: "☠️", desc: "Disadvantage on attack rolls and ability checks." },
  prone: { icon: "🙃", desc: "Disadvantage on attacks. Melee attacks against you have advantage. Ranged have disadvantage." },
  restrained: { icon: "⛓️", desc: "Speed 0. Attacks at disadvantage. DEX saves at disadvantage." },
  stunned: { icon: "💫", desc: "Incapacitated. Auto-fail STR/DEX saves. Attacks against you have advantage." },
  unconscious: { icon: "💤", desc: "Incapacitated. Prone. Auto-fail STR/DEX saves. Melee hits auto-crit." },
  concentrating: { icon: "🧘", desc: "Concentrating on a spell. Taking damage may break concentration (CON save DC 10 or half damage)." },
};

export function ConditionsPedal({ conditions }: Props) {
  if (!conditions || conditions.length === 0) {
    return (
      <div className="pedal-card bg-surface-900 p-3">
        <span className="pedal-label flex items-center gap-1.5 mb-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Conditions
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rogue-500" />
          <span className="text-[10px] font-bold text-rogue-400">Clear</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pedal-card bg-surface-900 p-3">
      <span className="pedal-label flex items-center gap-1.5 mb-2">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        Conditions
        <span className="text-surface-500 font-normal">({conditions.length})</span>
      </span>
      <div className="flex flex-wrap gap-1.5">
        {conditions.map((c) => {
          const meta = COND_META[c.toLowerCase()] || { icon: "❓", desc: "Homebrew condition. Check your DM." };
          return (
            <div key={c} className="group relative">
              <span className="inline-flex items-center gap-1 rounded-lg bg-surface-950 border-2 border-surface-800 px-2 py-1 text-[9px] font-bold text-surface-200 shadow-[2px_2px_0px_rgba(15,16,22,0.6)] hover:bg-surface-800 transition-colors">
                {meta.icon} {c}
              </span>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20 w-48">
                <div className="bg-surface-950 border-2 border-surface-800 rounded-xl p-2 shadow-[4px_4px_0px_rgba(15,16,22,0.8)]">
                  <p className="text-[9px] text-surface-300 leading-relaxed">{meta.desc}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-t-surface-950 border-l-transparent border-r-transparent" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
