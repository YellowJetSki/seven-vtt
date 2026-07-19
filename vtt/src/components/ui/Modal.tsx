/**
 * STᚱ VTT — Modal (Premium Gold)
 *
 * Gold-accented glassmorphism modal with corner ornaments,
 * close button with rotation animation, and escape key handling.
 */

import { type ReactNode, useEffect, useCallback } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showRune?: boolean;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showRune = true,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full ${sizeStyles[size]} animate-scale-in`}>
        <div className="glass-gold rounded-2xl overflow-hidden shadow-obsidian-xl border border-gold/15">
          {showRune && (
            <>
              <div className="corner-ornament corner-tl corner-gold" />
              <div className="corner-ornament corner-tr corner-gold" />
              <div className="corner-ornament corner-bl corner-gold" />
              <div className="corner-ornament corner-br corner-gold" />
            </>
          )}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10 bg-obsidian-mid/60">
            <h2 className="text-lg font-bold text-gold">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 transition-all duration-200 group"
              aria-label="Close modal"
            >
              <svg
                className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
