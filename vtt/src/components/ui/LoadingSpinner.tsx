/**
 * STᚱ VTT — Loading Spinner (Premium Gold)
 *
 * Gold-accented loading spinner with arcane glow ring.
 */

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeStyles = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export default function LoadingSpinner({
  size = "md",
  label,
}: LoadingSpinnerProps) {
  const glowSize = size === "lg" ? "w-20 h-20" : size === "md" ? "w-14 h-14" : "w-8 h-8";

  return (
    <div className="flex flex-col items-center justify-center gap-3 relative">
      {/* Gold glow ring behind spinner */}
      <div
        className={`absolute ${glowSize} bg-gold-500/5 rounded-full blur-xl animate-pulse-glow`}
      />

      <svg
        className={`animate-spin ${sizeStyles[size]} text-gold-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.2)]`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {label && (
        <p className="text-sm text-surface-500 font-medium tracking-wide">{label}</p>
      )}
    </div>
  );
}
