/**
 * STᚱ VTT — LoginAmbientRune
 *
 * Giant ambient ᚱ rune with pulsing glow, positioned center-right on desktop.
 * Hidden on mobile. Acts as a subtle atmospheric depth layer behind the form.
 */

export default function LoginAmbientRune() {
  return (
    <div className="absolute right-[15%] top-1/2 -translate-y-1/2 pointer-events-none hidden lg:block">
      <div className="relative">
        {/* Ambient glow pocket */}
        <div
          className="absolute -inset-20 bg-gold-500/5 rounded-full blur-[100px] animate-pulse-glow"
          style={{ animationDuration: "5s" }}
        />
        {/* The rune */}
        <span
          className="text-[180px] font-serif text-gold-500/6 select-none"
          style={{ animation: "rune-breathe 8s ease-in-out infinite" }}
          aria-hidden="true"
        >
          ᚱ
        </span>
      </div>
    </div>
  );
}
