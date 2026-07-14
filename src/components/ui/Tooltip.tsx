import type { ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({
  content,
  children,
  position = "top",
}: TooltipProps) {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  };

  return (
    <div className="group relative inline-flex">
      {children}
      <div
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-surface-700 px-2.5 py-1 text-xs text-surface-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 ${positionClasses[position]}`}
      >
        {content}
      </div>
    </div>
  );
}
