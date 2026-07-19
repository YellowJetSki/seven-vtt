interface TheatricWaitingStateProps {
  error: string;
  isConnected: boolean;
  isLoading: boolean;
}

export default function TheatricWaitingState({ error, isConnected, isLoading }: TheatricWaitingStateProps) {
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#0a0b12] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 float-arcane text-accent-400">ᚱ</div>
          <div className="mt-4">
            <div className="w-6 h-6 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mx-auto" />
            <p className="text-surface-400 text-xs mt-2">Awakening the theatric display...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0b12] flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <div className="text-6xl mb-6 text-accent-400 animate-pulse-glow">ᚱ</div>
        <h1 className="text-2xl font-bold text-white mb-2">STᚱ VTT</h1>
        <p className="text-surface-400 text-sm mb-4 leading-relaxed">{error}</p>
        <div className="flex items-center justify-center gap-2 text-xs text-surface-500">
          <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
          {isConnected ? "🟢 Live" : "🟡 Connecting..."}
        </div>
      </div>
    </div>
  );
}
