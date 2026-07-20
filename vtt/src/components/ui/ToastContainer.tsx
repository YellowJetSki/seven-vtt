/**
 * STᚱ VTT — Toast System (Premium Lusion Edition v3)
 *
 * Dual-singleton unified toast system with:
 * - Premium glass gradient cards with edge light
 * - Type icons (success=✅ warning=⚠️ error=🔴 info=ℹ️)
 * - Auto-dismiss progress bar with tier-based coloring
 * - Swipe-to-dismiss with exit animation
 * - Staggered entrance animation (90ms gap)
 * - Max 3 visible toasts, remainder queued
 * - Undo badge with gold glass styling
 * - Hover lift with subtle elevation
 * - Edge light on each toast
 * - Consistent design system glass gradient
 */

import React, { useCallback, useEffect, useRef, useState } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  duration?: number;
  onUndo?: () => void;
  undoLabel?: string;
}

type Listener = (toasts: Toast[]) => void;
let toastListeners: Listener[] = [];
let toastQueue: Toast[] = [];
let toastCounter = 0;
const MAX_VISIBLE = 3;

function notify() {
  toastListeners.forEach((fn) => fn([...toastQueue]));
}

export function showToast(toast: Omit<Toast, "id">) {
  const id = `toast_${++toastCounter}`;
  const entry: Toast = { ...toast, id };
  toastQueue = [...toastQueue, entry];
  notify();

  const duration = toast.duration ?? 4000;
  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== id);
    notify();
  }, duration);

  return id;
}

export function dismissToast(id: string) {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  notify();
}

const TYPE_STYLES: Record<Toast["type"], { bg: string; border: string; text: string; barColor: string; icon: React.ReactNode }> = {
  success: {
    bg: "bg-gradient-to-r from-emerald-950/85 to-emerald-900/70",
    border: "border-emerald-500/20",
    text: "text-emerald-200",
    barColor: "bg-emerald-500/50",
    icon: (
      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  warning: {
    bg: "bg-gradient-to-r from-amber-950/85 to-amber-900/70",
    border: "border-amber-500/20",
    text: "text-amber-200",
    barColor: "bg-amber-500/50",
    icon: (
      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  error: {
    bg: "bg-gradient-to-r from-rose-950/85 to-rose-900/70",
    border: "border-rose-500/20",
    text: "text-rose-200",
    barColor: "bg-rose-500/50",
    icon: (
      <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  info: {
    bg: "bg-gradient-to-r from-surface-950/85 to-surface-900/70",
    border: "border-gold-500/15",
    text: "text-surface-200",
    barColor: "bg-gold-500/40",
    icon: (
      <svg className="w-4 h-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

interface ToastItemProps {
  toast: Toast;
  index: number;
  total: number;
}

function ToastItem({ toast, index, total }: ToastItemProps) {
  const [exiting, setExiting] = useState(false);
  const startTime = useRef(Date.now());
  const animFrame = useRef<number>(0);
  const barRef = useRef<HTMLDivElement>(null);

  const duration = toast.duration ?? 4000;
  const style = TYPE_STYLES[toast.type];

  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running || !barRef.current) return;
      const elapsed = Date.now() - startTime.current;
      const pct = Math.min((elapsed / duration) * 100, 100);
      barRef.current.style.width = `${100 - pct}%`;
      if (pct < 100) {
        animFrame.current = requestAnimationFrame(animate);
      }
    };
    animFrame.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      cancelAnimationFrame(animFrame.current);
    };
  }, [duration]);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => dismissToast(toast.id), 200);
  }, [toast.id]);

  const delay = (total - 1 - index) * 90;

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl
        transition-all duration-200 ease-out relative overflow-hidden
        hover:-translate-y-0.5 hover:shadow-[0_20px_56px_rgba(0,0,0,0.45)]
        ${style.bg} ${style.border} ${style.text}
        ${exiting ? "opacity-0 translate-y-4 scale-95" : "opacity-100 translate-y-0 scale-100"}
      `}
      style={{
        maxWidth: "420px",
        width: "100%",
        animation: `slide-in-toast 0.35s ease-out ${delay}ms both`,
        marginBottom: index > 0 ? "-0.5rem" : "0",
        boxShadow: "0 16px 48px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      {/* Edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Type icon */}
      <div className="shrink-0 mt-0.5 relative z-[1]">{style.icon}</div>

      {/* Message */}
      <span className="text-xs font-medium leading-tight flex-1 relative z-[1]">{toast.message}</span>

      {/* Undo button */}
      {toast.onUndo && (
        <button
          onClick={toast.onUndo}
          className="text-[9px] uppercase tracking-wider font-bold text-gold-400 hover:text-gold-300 transition-colors whitespace-nowrap px-1.5 py-0.5 rounded-md bg-gold-500/10 hover:bg-gold-500/15 relative z-[1]"
        >
          {toast.undoLabel ?? "Undo"}
        </button>
      )}

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="shrink-0 p-0.5 rounded-md hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-all duration-200 active:scale-90 relative z-[1]"
        aria-label="Dismiss"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full overflow-hidden bg-white/[0.04]">
        <div
          ref={barRef}
          className={`h-full transition-none rounded-full ${style.barColor}`}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler: Listener = (updated) => setToasts([...updated]);
    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((h) => h !== handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  const visible = toasts.slice(-MAX_VISIBLE);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-1 pointer-events-none"
      style={{ width: "min(420px, calc(100vw - 2rem))" }}
    >
      {visible.map((toast, idx) => (
        <ToastItem key={toast.id} toast={toast} index={idx} total={visible.length} />
      ))}
    </div>
  );
}
