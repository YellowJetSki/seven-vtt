import { useEffect, useRef, type ReactNode } from "react";
import { useUiStore } from "@/stores/uiStore";

interface ModalProps {
  modalId: string;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ modalId, title, children, size = "md" }: ModalProps) {
  const activeModal = useUiStore((s) => s.activeModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isOpen = activeModal === modalId;

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeModal]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) closeModal();
      }}
    >
      <div
        className={`w-full ${sizeClasses[size]} animate-in zoom-in-95 fade-in rounded-xl border border-surface-700 bg-surface-850 shadow-2xl`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-700 px-5 py-4">
          <h2 className="text-lg font-semibold text-surface-100">{title}</h2>
          <button
            onClick={closeModal}
            className="flex h-7 w-7 items-center justify-center rounded-md text-surface-400 hover:bg-surface-700 hover:text-surface-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
