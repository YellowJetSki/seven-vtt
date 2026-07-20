/**
 * ST R VTT — PlayerShareReveal
 *
 * A dismissable fullscreen modal that appears on ALL active player screens
 * when the DM pushes an image via DmSharePicker.
 *
 * The modal provides:
 *   - Full-screen image display with cinematic gradient overlays
 *   - Title, type badge, and description
 *   - "Dismiss" button (closes the modal, dismissed state persists)
 *   - Inventory deposit notification (if the DM included a loot item)
 *
 * This component uses useFirestoreSync's onSnapshot pattern
 * to listen for the DM share document in real-time.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { listenDmShare, dismissDmShare } from "@/lib/firestore-service";
import type { DmSharePayload } from "@/lib/firestore-service";

interface PlayerShareRevealProps {
  /** Campaign ID for Firestore subscription (optional — uses default) */
  campaignId?: string;
}

export default function PlayerShareReveal({}: PlayerShareRevealProps) {
  const [share, setShare] = useState<DmSharePayload | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // FIX (Sprint 29): Use ref to prevent stale closure in the onSnapshot callback.
  // Previously, the `share` variable in the dependency closure would not update
  // when the listener fired rapidly, causing a memory leak of previous share state.
  const shareRef = useRef<DmSharePayload | null>(share);
  shareRef.current = share;

  useEffect(() => {
    let mounted = true;
    const unsub = listenDmShare((payload) => {
      if (!mounted) return;
      if (payload && !payload.isDismissed) {
        setShare(payload);
        setVisible(true);
        setDismissed(false);
      } else if (shareRef.current) {
        // Use ref to avoid stale closure — only hide if we had a previous share
        setVisible(false);
      }
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []); // Intentionally [] — ref prevents stale closure

  const handleDismiss = useCallback(async () => {
    setDismissed(true);
    setVisible(false);
    try {
      await dismissDmShare();
    } catch (err) {
      console.warn("[PlayerShareReveal] Failed to dismiss:", err);
    }
  }, []);

  const handleBackgroundClick = useCallback(() => {
    handleDismiss();
  }, [handleDismiss]);

  if (!visible || !share || dismissed) return null;

  const typeIcons: Record<string, string> = {
    image: "\uD83D\uDDBC",
    map: "\uD83D\uDDFA",
    item: "\uD83C\uDF92",
    handout: "\uD83D\uDCC4",
  };

  const typeLabel = share.type.charAt(0).toUpperCase() + share.type.slice(1);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 animate-in fade-in duration-300"
      onClick={handleBackgroundClick}
    >
      {/* ── Image ── */}
      <div className="flex-1 relative overflow-hidden">
        <img
          src={share.imageUrl}
          alt={share.title}
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback if image fails
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />

        {/* Top gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* ── Top info bar ── */}
        <div className="absolute top-0 left-0 right-0 p-5 flex items-start justify-between pointer-events-none">
          <div className="pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="text-xl">{typeIcons[share.type] || "\uD83D\uDDBC"}</span>
              <span className="text-[9px] uppercase tracking-widest font-black text-gold-400/70 bg-black/40 px-2 py-0.5 rounded-full border border-gold-500/20">
                {typeLabel}
              </span>
            </div>
            <h1 className="text-xl font-black text-white/90 mt-1.5 drop-shadow-lg">
              {share.title}
            </h1>
          </div>
        </div>

        {/* ── Bottom info ── */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
          {share.description && (
            <p className="text-sm text-white/70 max-w-lg drop-shadow-lg mb-3">
              {share.description}
            </p>
          )}

          {/* Inventory deposit notification */}
          {share.inventoryPayload && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[10px] font-semibold mb-3 pointer-events-auto">
              <span>Received item:</span>
              <span className="text-white font-bold">{share.inventoryPayload.name}</span>
              <span className="text-emerald-400/70">x{share.inventoryPayload.quantity}</span>
            </div>
          )}

          {/* Dismiss button */}
          <div className="pointer-events-auto">
            <button
              onClick={handleDismiss}
              className="px-5 py-2 rounded-xl text-[10px] font-bold bg-white/10 border border-white/15 text-white/70 hover:bg-white/15 hover:text-white/90 active:scale-95 transition-all backdrop-blur-sm"
            >
              Tap to Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
