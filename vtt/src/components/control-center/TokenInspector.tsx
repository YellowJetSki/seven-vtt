/**
 * STᚱ VTT — Token Inspector
 *
 * Right-side panel for inspecting and editing a selected map token.
 * DM can adjust position (x/y), HP, conditions, visibility, and label.
 *
 * All changes sync instantly to the Theatric Display via campaignStore.
 */

import { useTokenInspector } from "./useTokenInspector";
import type { MapToken } from "@/types";
import type { ReactNode } from "react";

interface TokenInspectorProps {
  token: MapToken;
  mapId: string;
  onClose: () => void;
  onTokenUpdated?: (token: MapToken) => void;
}

function InspectorHeader({
  icon,
  onClose,
}: {
  icon?: string;
  onClose: () => void;
}) {
  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-gradient-to-r from-gold-500/[0.015] to-transparent">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gold-500/8 border border-gold/10 flex items-center justify-center text-xs">
          {icon || "🪙"}
        </div>
        <span className="text-xs font-semibold text-white/80">
          Token Inspector
        </span>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-surface-500 transition-colors"
        aria-label="Close inspector"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function InspectorLabelInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[9px] uppercase tracking-wider font-bold text-surface-500 mb-1.5">
        Label
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-[#0c0d15] border border-white/[0.06] text-xs text-white/80 placeholder:text-surface-600 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
        placeholder="Token label..."
      />
    </div>
  );
}

function InspectorPositionInput({
  x,
  y,
  onXChange,
  onYChange,
}: {
  x: number;
  y: number;
  onXChange: (v: number) => void;
  onYChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-[9px] uppercase tracking-wider font-bold text-surface-500 mb-1.5">
        Position
      </label>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-1.5">
          <span className="text-[10px] text-surface-500 font-mono w-4">X</span>
          <input
            type="number"
            value={x}
            onChange={(e) => onXChange(Number(e.target.value))}
            className="w-full px-2.5 py-2 rounded-xl bg-[#0c0d15] border border-white/[0.06] text-xs text-white/80 font-mono focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
          />
        </div>
        <div className="flex-1 flex items-center gap-1.5">
          <span className="text-[10px] text-surface-500 font-mono w-4">Y</span>
          <input
            type="number"
            value={y}
            onChange={(e) => onYChange(Number(e.target.value))}
            className="w-full px-2.5 py-2 rounded-xl bg-[#0c0d15] border border-white/[0.06] text-xs text-white/80 font-mono focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

const CONDITIONS_12 = [
  "poisoned", "paralyzed", "unconscious", "invisible",
  "concentrating", "restrained", "prone", "stunned",
  "charmed", "frightened", "blinded", "deafened",
] as const;

function InspectorHpSection({
  hpCurrent,
  hpMax,
  onCurrentChange,
  onMaxChange,
  onQuickDamage,
  onQuickHeal,
}: {
  hpCurrent: number;
  hpMax: number;
  onCurrentChange: (v: number) => void;
  onMaxChange: (v: number) => void;
  onQuickDamage: (amount: number) => void;
  onQuickHeal: (amount: number) => void;
}) {
  const ratio = hpMax > 0 ? hpCurrent / hpMax : 0;
  const barColor =
    ratio > 0.5
      ? "bg-emerald-500"
      : ratio > 0.25
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div>
      <label className="block text-[9px] uppercase tracking-wider font-bold text-gold-500/60 mb-1.5">
        Hit Points
      </label>
      <div className="bg-[#0c0d15] rounded-xl p-3 border border-white/[0.04] space-y-2">
        {/* HP Bar */}
        <div className="h-2 bg-surface-900/60 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-300`}
            style={{ width: `${Math.min(100, ratio * 100)}%` }}
          />
        </div>

        {/* Current / Max inputs */}
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={hpCurrent}
            onChange={(e) => onCurrentChange(Number(e.target.value))}
            className="w-16 px-2 py-1.5 rounded-lg bg-surface-900/60 border border-white/[0.04] text-xs text-white/80 font-mono text-center focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15"
            min={0}
          />
          <span className="text-[10px] text-surface-500 font-mono">/</span>
          <input
            type="number"
            value={hpMax}
            onChange={(e) => onMaxChange(Number(e.target.value))}
            className="w-16 px-2 py-1.5 rounded-lg bg-surface-900/60 border border-white/[0.04] text-xs text-white/80 font-mono text-center focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15"
            min={0}
          />
        </div>

        {/* Quick damage buttons */}
        <div className="flex gap-1.5">
          {[10, 5, 1].map((n) => (
            <button
              key={`dmg-${n}`}
              onClick={() => onQuickDamage(n)}
              className="flex-1 px-1.5 py-1 text-[10px] font-bold rounded-lg bg-red-500/12 text-red-400 border border-red-500/15 hover:bg-red-500/18 active:scale-95 transition-all"
            >
              -{n}
            </button>
          ))}
          {[1, 5, 10].map((n) => (
            <button
              key={`heal-${n}`}
              onClick={() => onQuickHeal(n)}
              className="flex-1 px-1.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-500/12 text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/18 active:scale-95 transition-all"
            >
              +{n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InspectorVisibilityToggle({
  visible,
  onChange,
}: {
  visible: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0c0d15] border border-white/[0.04]">
      <span className="text-[11px] text-surface-400 font-medium">
        Visible to Players
      </span>
      <button
        onClick={() => onChange(!visible)}
        className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
          visible ? "bg-gold-500/40 shadow-[0_0_6px_rgba(234,179,8,0.15)]" : "bg-surface-800/60"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
            visible ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

const PRESET_COLORS = [
  "#FFD700", "#FF6B35", "#FF4444", "#44FF44", "#4444FF",
  "#FF44FF", "#00FFFF", "#FFA500", "#808080", "#8B4513",
  "#2E8B57", "#4B0082", "#DC143C", "#00CED1", "#FFDAB9",
  "#98FB98", "#DDA0DD", "#F0E68C",
];

function InspectorColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[9px] uppercase tracking-wider font-bold text-surface-500 mb-1.5">
        Token Color
      </label>
      <div className="grid grid-cols-6 gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-7 h-7 rounded-lg border-2 transition-all ${
              value === c
                ? "border-gold-400 shadow-[0_0_6px_rgba(234,179,8,0.15)] scale-110"
                : "border-white/[0.06] hover:border-white/20"
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
    </div>
  );
}

function InspectorFooter({
  hasChanges,
  onSave,
  onDelete,
}: {
  hasChanges: boolean;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-white/[0.04]">
      <button
        onClick={onSave}
        disabled={!hasChanges}
        className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all duration-200 active:scale-95 ${
          hasChanges
            ? "bg-gradient-to-r from-gold-500/12 to-amber-500/8 text-gold-400 border border-gold/20 hover:shadow-[0_0_12px_rgba(234,179,8,0.04)]"
            : "bg-white/[0.02] text-surface-600 border border-white/[0.04] cursor-not-allowed"
        }`}
      >
        {hasChanges ? "💾 Save Changes" : "No Changes"}
      </button>
      <button
        onClick={onDelete}
        className="px-3 py-2 rounded-xl text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/15 hover:bg-red-500/15 active:scale-95 transition-all"
      >
        🗑 Delete
      </button>
    </div>
  );
}

export default function TokenInspector({
  token,
  mapId,
  onClose,
  onTokenUpdated,
}: TokenInspectorProps) {
  const {
    label,
    xPos,
    yPos,
    hpCurrent,
    hpMax,
    visible,
    color,
    hasChanges,
    setLabel,
    setXPos,
    setYPos,
    setHpCurrent,
    setHpMax,
    setVisible,
    setColor,
    markDirty,
    handleSave,
    handleDelete,
    handleQuickDamage,
    handleQuickHeal,
  } = useTokenInspector(token, mapId, onClose, onTokenUpdated);

  // ── Fix implicit any types on map calls ──
  const markDirtyWrap = {
    setLabel: (v: string) => { setLabel(v); markDirty(); },
    setXPos: (v: number) => { setXPos(v); markDirty(); },
    setYPos: (v: number) => { setYPos(v); markDirty(); },
    setHpCurrent: (v: number) => { setHpCurrent(v); markDirty(); },
    setHpMax: (v: number) => { setHpMax(v); markDirty(); },
    setVisible: (v: boolean) => { setVisible(v); markDirty(); },
    setColor: (v: string) => { setColor(v); markDirty(); },
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <InspectorHeader icon={token.icon} onClose={onClose} />

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <InspectorLabelInput
          value={label}
          onChange={markDirtyWrap.setLabel}
        />
        <InspectorPositionInput
          x={xPos}
          y={yPos}
          onXChange={markDirtyWrap.setXPos}
          onYChange={markDirtyWrap.setYPos}
        />
        <InspectorHpSection
          hpCurrent={hpCurrent}
          hpMax={hpMax}
          onCurrentChange={markDirtyWrap.setHpCurrent}
          onMaxChange={markDirtyWrap.setHpMax}
          onQuickDamage={handleQuickDamage}
          onQuickHeal={handleQuickHeal}
        />
        <InspectorVisibilityToggle
          visible={visible}
          onChange={markDirtyWrap.setVisible}
        />
        <InspectorColorPicker
          value={color}
          onChange={markDirtyWrap.setColor}
        />
      </div>

      <InspectorFooter
        hasChanges={hasChanges}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
