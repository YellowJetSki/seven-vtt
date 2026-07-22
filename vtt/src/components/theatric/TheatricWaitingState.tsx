/**
 * STᚱ VTT — Theatric Waiting State (Premium Cinematic Gold)
 *
 * Cinematic loading/error state for the Theatric Display.
 * Features pulsing AppIcon shield with gold ambient glow,
 * and gold-accented status indicators.
 */

interface TheatricWaitingStateProps {
  error: string;
  isConnected: boolean;
  isLoading: boolean;
}

export default function TheatricWaitingState({
  error,
  isConnected,
  isLoading,
}: TheatricWaitingStateProps) {
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#0a0b12] flex items-center justify-center">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold-500/[0.03] rounded-full blur-[100px] animate-pulse-glow" style={{ animationDuration: "4s" }} />

        <div className="relative z-10 text-center">
          <div className="mb-6 flex justify-center">
            <img
              src="/AppIcon.svg"
              alt="Arkla"
              className="w-24 h-24 animate-pulse-glow drop-shadow-[0_0_40px_rgba(234,179,8,0.4)]"
              style={{ animationDuration: "3s" }}
            />
          </div>
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-[2px] border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
            <p className="text-gold-400/60 text-sm font-light tracking-wide">
              Awakening the theatric display...
            </p>
            <p className="text-surface-600 text-[10px] uppercase tracking-[0.2em]">
              Arkla — Premium VTT
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0b12] flex items-center justify-center">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-500/[0.02] rounded-full blur-[120px] animate-pulse-glow" style={{ animationDuration: "6s" }} />

      <div className="relative z-10 text-center max-w-md p-8">
        <div className="mb-6 flex justify-center">
          <img
            src="/AppIcon.svg"
            alt="Arkla"
            className="w-28 h-28 animate-pulse-glow drop-shadow-[0_0_50px_rgba(234,179,8,0.25)]"
            style={{ animationDuration: "4s" }}
          />
        </div>
        <h1 className="text-2xl font-bold text-gold-300/90 mb-3 tracking-tight">
          Arkla
        </h1>

        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-gold-500/20" />
          <span className="text-[10px] text-gold-500/40 uppercase tracking-[0.15em]">Theatric Display</span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-gold-500/20" />
        </div>

        <p className="text-surface-400/70 text-sm leading-relaxed mb-6 font-light">
          {error}
        </p>

        <div className="flex items-center justify-center gap-2.5">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isConnected
                ? "bg-gold-400 shadow-[0_0_8px_rgba(234,179,8,0.4)]"
                : "bg-amber-500/50"
            }`}
          />
          <span className={`text-[10px] uppercase tracking-wider font-mono ${
            isConnected ? "text-gold-400/60" : "text-amber-400/50"
          }`}>
            {isConnected ? "Live" : "Connecting..."}
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 mt-8 opacity-40">
          <span className="w-6 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
          <span className="text-[9px] text-gold-500/40 tracking-[0.3em] font-bold">✦ ✦ ✦</span>
          <span className="w-6 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}
