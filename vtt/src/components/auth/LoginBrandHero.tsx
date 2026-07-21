/**
 * STᚱ VTT — LoginBrandHero
 *
 * Left-panel brand hero with app icon, typography, feature highlights,
 * and footer. Desktop-only (hidden on mobile).
 * Staggered entrance animations create Lusion-grade premium feel.
 */

const FEATURES = [
  { icon: "🗺", label: "Interactive Maps", desc: "Dynamic lighting & fog of war" },
  { icon: "📜", label: "Character Compendium", desc: "Full SRD + homebrew management" },
  { icon: "🖥", label: "Dual-Screen Display", desc: "Player-facing theatric view" },
] as const;

export default function LoginBrandHero() {
  return (
    <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 xl:p-16 relative">
      <div className="relative flex flex-col h-full">
        {/* Brand header */}
        <div
          className="animate-slide-in-up opacity-0"
          style={{ animation: "slide-in-up 0.7s ease-out 0.1s forwards" }}
        >
          <div className="flex items-center gap-4 mb-6">
            <img
              src="/AppIcon.png"
              alt="STᚱ VTT"
              className="w-11 h-11 sm:w-12 sm:h-12 drop-shadow-[0_0_24px_rgba(234,179,8,0.3)]"
            />
            <div>
              <h1 className="text-[28px] font-black tracking-tight text-white leading-none">
                ST<span className="text-gold-400">ᚱ</span>{" "}
                <span className="font-sans font-black text-[20px] align-middle">VTT</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.25em] text-surface-500 font-medium mt-1.5">
                Virtual Tabletop
              </p>
            </div>
          </div>

          {/* Hero typography — premium weight contrast */}
          <div className="mt-10">
            <p className="text-[32px] xl:text-[40px] font-light text-white/90 leading-[1.1] tracking-tight">
              Forge your
            </p>
            <p className="text-[32px] xl:text-[40px] font-bold leading-[1.1] tracking-tight">
              <span className="gold-amber-gradient bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(234,179,8,0.2)]">
                legend
              </span>
              <span className="text-white/40 font-light">.</span>
            </p>
          </div>

          <p className="text-sm text-surface-500 mt-6 leading-relaxed max-w-sm">
            A premium virtual tabletop for Dungeon Masters and adventurers. Build worlds, command encounters, and tell epic stories.
          </p>

          {/* Feature highlights */}
          <div className="mt-10 space-y-[14px]">
            {FEATURES.map((item, i) => (
              <div key={i} className="flex items-center gap-4 group cursor-default">
                <span className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-lg shrink-0 group-hover:border-gold-500/20 group-hover:bg-gold-500/5 transition-all duration-300">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white/80 group-hover:text-gold-400 transition-colors duration-300">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-surface-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="mt-auto pt-8 animate-slide-in-up opacity-0"
          style={{ animation: "slide-in-up 0.7s ease-out 0.8s forwards" }}
        >
          <div className="flex items-center gap-3 opacity-30">
            <span className="w-8 h-px bg-gradient-to-r from-transparent to-gold-500/40" />
            <span className="text-[8px] text-gold-500/40 uppercase tracking-[0.25em] font-mono">✦ ✦ ✦</span>
            <span className="w-8 h-px bg-gradient-to-l from-transparent to-gold-500/40" />
          </div>
          <p className="text-[9px] text-surface-700 uppercase tracking-[0.2em] mt-4 font-medium">
            Arkla Campaign &mdash; Premium VTT
          </p>
        </div>
      </div>
    </div>
  );
}
