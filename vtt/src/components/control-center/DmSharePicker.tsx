/**
 * ST R VTT — DmSharePicker
 *
 * DM tool for selecting images/maps/items and pushing them
 * as fullscreen overlays on all active player screens.
 *
 * Features:
 *   - URL input with live preview
 *   - Title and description fields
 *   - Type selector (image/map/item/handout)
 *   - Target player dropdown (or "All Players")
 *   - Optional inventory deposit payload
 *   - Send + Dismiss buttons
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useAuthStore } from "@/stores/authStore";
import { useInventoryMutations } from "@/hooks/useCharacterMutations";
import { setDmShare, dismissDmShare, clearDmShare, listenDmShare } from "@/lib/firestore-service";
import type { DmSharePayload } from "@/lib/firestore-service";
import Modal from "@/components/ui/Modal";

interface DmSharePickerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHARE_TYPES = [
  { value: "image", label: "Image", icon: "\uD83D\uDDBC" },
  { value: "map", label: "Map", icon: "\uD83D\uDDFA" },
  { value: "item", label: "Item", icon: "\uD83C\uDF92" },
  { value: "handout", label: "Handout", icon: "\uD83D\uDCC4" },
] as const;

export default function DmSharePicker({ isOpen, onClose }: DmSharePickerProps) {
  const characters = useCampaignStore((s) => s.characters);
  const username = useAuthStore((s) => s.username);
  // FIX (Sprint 29): Use Firestore-synced inventory mutations.
  // Previously used: useCampaignStore((s) => s.updateCharacter) → Zustand only.
  const { handleAddItem: inventoryAddItem } = useInventoryMutations();

  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shareType, setShareType] = useState<DmSharePayload["type"]>("image");
  const [targetPlayerId, setTargetPlayerId] = useState<string>("");
  const [imageError, setImageError] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemWeight, setItemWeight] = useState(0);
  const [itemDesc, setItemDesc] = useState("");
  const [sent, setSent] = useState(false);
  const [currentShare, setCurrentShare] = useState<DmSharePayload | null>(null);

  // Listen for current share state
  useEffect(() => {
    if (!isOpen) return;
    const unsub = listenDmShare((share) => {
      setCurrentShare(share);
      if (share) {
        setImageUrl(share.imageUrl);
        setTitle(share.title);
        setDescription(share.description);
        setShareType(share.type);
        setTargetPlayerId(share.targetPlayerId || "");
        setShowDeposit(!!share.inventoryPayload);
        if (share.inventoryPayload) {
          setItemName(share.inventoryPayload.name);
          setItemQty(share.inventoryPayload.quantity);
          setItemWeight(share.inventoryPayload.weight);
          setItemDesc(share.inventoryPayload.description);
        }
        setSent(true);
      }
    });
    return () => unsub();
  }, [isOpen]);

  const resetForm = useCallback(() => {
    setImageUrl(""); setTitle(""); setDescription("");
    setShareType("image"); setTargetPlayerId("");
    setImageError(false); setShowDeposit(false);
    setItemName(""); setItemQty(1); setItemWeight(0); setItemDesc("");
    setSent(false); setCurrentShare(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSend = useCallback(async () => {
    if (!imageUrl.trim() || !title.trim()) return;

    const payload: Omit<DmSharePayload, "id" | "sharedAt" | "isDismissed"> = {
      imageUrl: imageUrl.trim(),
      title: title.trim(),
      description: description.trim(),
      type: shareType,
      sharedBy: username || "DM",
      targetPlayerId: targetPlayerId || undefined,
    };

    if (showDeposit && itemName.trim()) {
      payload.inventoryPayload = {
        name: itemName.trim(),
        quantity: itemQty,
        weight: itemWeight,
        description: itemDesc.trim(),
      };
    }

    try {
      await setDmShare(payload);
      setSent(true);
    } catch (err) {
      console.warn("[DmSharePicker] Failed to send share:", err);
    }
  }, [imageUrl, title, description, shareType, username, targetPlayerId, showDeposit, itemName, itemQty, itemWeight, itemDesc]);

  const handleDismiss = useCallback(async () => {
    try {
      await dismissDmShare();
      setSent(false);
      resetForm();
      onClose();
    } catch (err) {
      console.warn("[DmSharePicker] Failed to dismiss:", err);
    }
  }, [resetForm, onClose]);

  const handleDepositToTarget = useCallback(() => {
    if (!currentShare?.inventoryPayload || !targetPlayerId) return;

    const target = characters.find((c) => c.id === targetPlayerId);
    if (!target) return;

    // FIX (Sprint 29 + Sprint 19): Use Firestore-synced inventory hook.
    // Check if the target already has an item with the same name. If so,
    // increment quantity instead of adding a duplicate.
    const payload = currentShare.inventoryPayload;
    const existingIndex = (target.inventory || []).findIndex(
      (i) => i.name.toLowerCase() === payload.name.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Increment quantity on existing item (InventoryItem is keyed by name+equip+desc)
      const { updateCharacter } = useCampaignStore.getState();
      const updatedInventory = (target.inventory || []).map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + payload.quantity }
          : item
      );
      updateCharacter(target.id, { inventory: updatedInventory });
    } else {
      // Add new item
      const newItem = {
        name: payload.name,
        quantity: payload.quantity,
        weight: payload.weight,
        description: payload.description,
        isEquipped: false,
      };
      inventoryAddItem(target, newItem);
    }
  }, [currentShare, targetPlayerId, characters, inventoryAddItem]);

  const isValid = imageUrl.trim().length > 0 && title.trim().length > 0 && !imageError;

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Share to Players">
      <div className="space-y-4 p-4 max-h-[70vh] overflow-y-auto scrollbar-gold">

        {/* Image URL + Preview */}
        <div>
          <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Image URL</label>
          <div className="flex items-center gap-2">
            <input
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImageError(false); }}
              placeholder="https://example.com/image.jpg"
              className="flex-1 py-2 px-3 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25 placeholder:text-surface-700"
              autoFocus
            />
          </div>
          {imageUrl && (
            <div className="mt-2 relative rounded-xl overflow-hidden border border-white/[0.06] bg-[#07080d]/50">
              <img
                src={imageUrl}
                alt="Preview"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
                className="w-full h-32 object-cover"
              />
              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#07080d]/80 text-[10px] text-rose-400">
                  Failed to load image
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title + Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ancient Map Fragment"
              className="w-full py-2 px-3 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25 placeholder:text-surface-700"
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Type</label>
            <div className="flex gap-1.5">
              {SHARE_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setShareType(t.value as DmSharePayload["type"])}
                  className={`flex-1 py-2 rounded-lg text-[9px] font-semibold transition-all active:scale-95 ${
                    shareType === t.value
                      ? "bg-gold-500/12 border border-gold/20 text-gold-400"
                      : "bg-[#07080d]/70 border border-white/[0.06] text-surface-400 hover:text-surface-200"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What do the players see?"
            className="w-full py-2 px-3 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25 placeholder:text-surface-700 resize-none scrollbar-gold"
          />
        </div>

        {/* Target Player */}
        <div>
          <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Target</label>
          <select
            value={targetPlayerId}
            onChange={(e) => setTargetPlayerId(e.target.value)}
            className="w-full py-2 px-3 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25 appearance-none cursor-pointer"
          >
            <option value="">All Players</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.playerName || "no player"})</option>
            ))}
          </select>
        </div>

        {/* Inventory Deposit Toggle */}
        <div className="rounded-xl bg-gradient-to-br from-[#141520]/50 to-[#0f1019]/50 border border-white/[0.04] p-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showDeposit}
              onChange={(e) => setShowDeposit(e.target.checked)}
              className="accent-gold-500"
            />
            <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">
              Deposit to Inventory
            </span>
          </label>
          {showDeposit && (
            <div className="mt-3 space-y-2">
              <input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Item name"
                className="w-full py-1.5 px-2.5 rounded text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25 placeholder:text-surface-700"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number" value={itemQty} min={1}
                  onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="Qty"
                  className="w-full py-1.5 px-2.5 rounded text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25"
                />
                <input
                  type="number" value={itemWeight} min={0}
                  onChange={(e) => setItemWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="Weight (lbs)"
                  className="w-full py-1.5 px-2.5 rounded text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25"
                />
              </div>
              <textarea
                value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} rows={1}
                placeholder="Item description"
                className="w-full py-1.5 px-2.5 rounded text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25 placeholder:text-surface-700 resize-none"
              />
            </div>
          )}
        </div>

        {/* Current Share Status */}
        {sent && currentShare && (
          <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/15 p-3 text-[10px]">
            <span className="text-emerald-400 font-semibold">Shared to players</span>
            <span className="text-surface-500 ml-2">
              {currentShare.title} ({currentShare.type})
            </span>
            {currentShare.targetPlayerId && (
              <span className="text-amber-400 ml-2">
                Target: {characters.find((c) => c.id === currentShare.targetPlayerId)?.name || "Unknown"}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gold/10">
          <div className="flex gap-2">
            {sent && currentShare && showDeposit && targetPlayerId && (
              <button onClick={handleDepositToTarget} className="px-3 py-1.5 rounded-lg text-[9px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 active:scale-95 transition-all">
                Deposit to Target
              </button>
            )}
            {sent && (
              <button onClick={handleDismiss} className="px-3 py-1.5 rounded-lg text-[9px] font-semibold text-rose-400 border border-rose-500/15 hover:bg-rose-500/10 active:scale-95 transition-all">
                Dismiss on Players
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleClose} className="px-3 py-1.5 rounded-lg text-[9px] text-surface-400 hover:text-surface-200 border border-white/[0.06] active:scale-95 transition-all">
              Close
            </button>
            {!sent && (
              <button onClick={handleSend} disabled={!isValid} className="px-4 py-1.5 rounded-lg text-[9px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                Send to Players
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
