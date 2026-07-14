interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

export function LoadingSpinner({
  size = "md",
  label,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <span
        className={`animate-spin rounded-full border-accent-500 border-t-transparent ${SIZE_CLASSES[size]}`}
      />
      {label && (
        <p className="text-sm text-surface-500">{label}</p>
      )}
    </div>
  );
}
