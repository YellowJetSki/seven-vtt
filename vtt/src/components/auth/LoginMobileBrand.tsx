/**
 * STᚱ VTT — LoginMobileBrand
 *
 * Mobile-only brand header for the login page.
 * Shows app icon, name, and decorative divider.
 * Hidden on desktop (lg+).
 */

export default function LoginMobileBrand() {
  return (
    <div className="lg:hidden text-center mb-10">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
        <img
          src="/AppIcon.png"
          alt="STᚱ VTT"
          className="w-10 h-10 drop-shadow-[0_0_12px_rgba(234,179,8,0.2)]"
        />
      </div>
      <h1 className="text-[22px] font-bold text-white tracking-tight">
        ST<span className="text-gold-400">ᚱ</span>{" "}
        <span className="font-sans text-[16px] font-bold align-middle">VTT</span>
      </h1>
      <p className="text-[10px] text-surface-600 mt-1.5 uppercase tracking-[0.2em] font-medium">
        Premium Virtual Tabletop
      </p>
      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="w-6 h-px bg-gradient-to-r from-transparent to-gold-500/30" />
        <span className="text-[7px] text-gold-500/30 font-mono tracking-[0.25em]">✦</span>
        <span className="w-6 h-px bg-gradient-to-l from-transparent to-gold-500/30" />
      </div>
    </div>
  );
}
