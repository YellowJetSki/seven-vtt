import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
}

export default function EmptyState({
  icon = "📭",
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-5xl mb-4 float-arcane select-none" aria-hidden="true">{icon}</div>
      <h3 className="text-xl font-black text-gradient-arcane mb-2">{title}</h3>
      {description && (
        <p className="text-surface-500 text-sm max-w-md text-center mb-2 leading-relaxed">
          {description}
        </p>
      )}
      <div className="rune-divider my-4">✦</div>
      {(action || children) && <div className="mt-2">{action ?? children}</div>}
    </div>
  );
}
