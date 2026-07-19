/**
 * STᚱ VTT — Theatric Connection Indicator
 *
 * Subtle, always-visible connection status dot in the bottom-left corner.
 * Gold-tinted pulse when connected, amber when syncing.
 * Hides the generic raw <span> previously inline in TheatricPage.
 */

interface TheatricConnectionIndicatorProps {
  isConnected: boolean;
}

export default function TheatricConnectionIndicator({
  isConnected,
}: TheatricConnectionIndicatorProps) {
  return (
    <div className="fixed bottom-5 left-5 z-30 flex items-center gap-2">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full transition-all duration-500 ${
          isConnected
            ? "bg-gold-500 shadow-[0_0_8px_rgba(234,179,8,0.4)] animate-pulse-soft"
            : "bg-amber-500/60 shadow-[0_0_6px_rgba(245,158,11,0.2)]"
        }`}
      />
      <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-gold-500/30">
        {isConnected ? "Live" : "Sync"}
      </span>
    </div>
  );
}
