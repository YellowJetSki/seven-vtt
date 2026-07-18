import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function TheatricPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      const mapId = searchParams.get("map");
      if (!mapId) {
        setError("No battle map data found");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading theatric view..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 relative overflow-hidden">
      {/* Ambient Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[30rem] h-[30rem] bg-accent-500/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/3 w-[25rem] h-[25rem] bg-mage-500/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>

      {error ? (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-6xl mb-6 animate-pulse-glow">
            <span className="text-accent-400">ᚱ</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">STᚱ VTT</h1>
          <p className="text-surface-400 text-sm mb-8">{error}</p>
          <button
            onClick={() => navigate("/campaign/maps")}
            className="premium-btn"
          >
            Back to Maps
          </button>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
          <p className="text-surface-400">Theatric view loading...</p>
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 right-4 z-20 p-2 rounded-lg glass hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors"
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
