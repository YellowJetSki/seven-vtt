/* ══════════════════════════════════════════════════════════════
   TempBuffsModal — Pedal-Sheet Style Temporary Buff Manager
   Add, view, and remove temporary modifiers (AC, Attack, Speed,
   Saving Throws, Damage) with chunky button styling.
   Inspired by the pedal-sheet's TempBuffsModal.jsx
   ══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import type { TempBuff, BuffTarget } from "@/types/temp-buffs";
import { BUFF_TARGETS, BUFF_PRESETS, getBuffTotal } from "@/types/temp-buffs";

interface Props {
  tempBuffs: TempBuff[];
  onAddBuff: (buff: TempBuff) => void;
  onRemoveBuff: (buffId: string) => void;
  onClearBuffs: () => void;
  onClose: () => void;
  baseAC: number;
  baseSpeed: number;
}

function uid(): string {
  return `buf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function TempBuffsModal({ tempBuffs, onAddBuff, onRemoveBuff, onClearBuffs, onClose, baseAC, baseSpeed }: Props) {
  const [selectedTarget, setSelectedTarget] = useState<BuffTarget>("AC");
  const [buffValue, setBuffValue] = useState(2);
  const [buffLabel, setBuffLabel] = useState("");
  const [isDebuff, setIsDebuff] = useState(false);

  const effectAC = baseAC + getBuffTotal(tempBuffs, "AC");
  const effectSpeed = baseSpeed + getBuffTotal(tempBuffs, "Speed");

  const handleAddPreset = (preset: TempBuff) => {
    onAddBuff({ ...preset, id: uid() });
  };

  const handleAddCustom = () => {
    if (!buffLabel.trim()) return;
    const val = isDebuff ? -Math.abs(buffValue) : Math.abs(buffValue);
    onAddBuff({
      id: uid(),
      target: selectedTarget,
      value: val,
      label: buffLabel.trim(),
      source: "Custom",
      duration: "Until removed",
      isDebuff: val < 0,
    });
    setBuffLabel("");
    setBuffValue(2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border-[3px] border-surface-950 bg-surface-900 p-5 shadow-[8px_8px_0px_rgba(15,16,22,0.9)]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-white uppercase tracking-widest pedal-text-shadow flex items-center gap-2">
            <svg className="w-4 h-4 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Temp Buffs
          </h2>
          <button onClick={onClose} className="pedal-btn bg-surface-800 text-surface-400 hover:bg-warrior-500 hover:text-white p-1.5" title="Close">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Effect Preview */}
        <div className="bg-surface-950 border-2 border-surface-900 rounded-xl p-3 mb-4 grid grid-cols-2 gap-2">
          <div className="text-center">
            <p className="text-[8px] uppercase tracking-widest font-black text-surface-500">Effective AC</p>
            <p className={`text-xl font-black ${effectAC > baseAC ? "text-rogue-400" : effectAC < baseAC ? "text-warrior-400" : "text-white"}`}>
              {effectAC}
              {effectAC !== baseAC && <span className="text-[10px] ml-1">({baseAC})</span>}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[8px] uppercase tracking-widest font-black text-surface-500">Effective Speed</p>
            <p className={`text-xl font-black ${effectSpeed > baseSpeed ? "text-rogue-400" : effectSpeed < baseSpeed ? "text-warrior-400" : "text-white"}`}>
              {effectSpeed}ft
              {effectSpeed !== baseSpeed && <span className="text-[10px] ml-1">({baseSpeed})</span>}
            </p>
          </div>
        </div>

        {/* Presets Grid */}
        <div className="mb-4">
          <h3 className="text-[9px] font-black text-surface-400 uppercase tracking-widest mb-2">Quick Presets</h3>
          <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
            {BUFF_PRESETS.map((preset) => {
              const isActive = tempBuffs.some(b => b.id === preset.id);
              return (
                <button
                  key={preset.id}
                  onClick={() => handleAddPreset(preset)}
                  disabled={isActive}
                  className={`text-left px-2.5 py-2 rounded-xl border-2 transition-all shadow-sm ${
                    isActive
                      ? "bg-surface-950 border-rogue-500/30 text-surface-500 cursor-not-allowed"
                      : "bg-surface-950 border-surface-800 text-surface-300 hover:border-accent-500/30 hover:-translate-y-0.5"
                  } ${preset.isDebuff ? "border-l-warrior-500/40" : ""}`}
                >
                  <p className="text-[9px] font-black text-white uppercase tracking-wider truncate">{preset.label}</p>
                  <p className="text-[8px] text-surface-500">
                    {preset.target} {preset.value >= 0 ? `+${preset.value}` : preset.value}
                    {preset.duration ? ` · ${preset.duration}` : ""}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Buff Form */}
        <div className="bg-surface-950 border-2 border-surface-900 rounded-xl p-3 mb-4">
          <h3 className="text-[9px] font-black text-surface-400 uppercase tracking-widest mb-3">Custom Buff</h3>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {BUFF_TARGETS.map((t) => (
              <button
                key={t.key}
                onClick={() => setSelectedTarget(t.key)}
                className={`px-2 py-2 rounded-xl border-2 text-[9px] font-bold uppercase tracking-widest transition-all shadow-sm ${
                  selectedTarget === t.key
                    ? "bg-accent-600 text-surface-950 border-surface-950"
                    : "bg-surface-800 text-surface-300 border-surface-900 hover:bg-surface-700"
                }`}
              >
                <span className="block text-xs mb-0.5">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={buffLabel}
              onChange={(e) => setBuffLabel(e.target.value)}
              placeholder="Buff name..."
              className="flex-1 bg-surface-800 border-2 border-surface-900 rounded-lg px-3 py-1.5 text-xs font-bold text-white placeholder:text-surface-600 focus:border-accent-500 outline-none"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={buffValue}
                onChange={(e) => setBuffValue(Number(e.target.value))}
                className="w-14 bg-surface-800 border-2 border-surface-900 rounded-lg px-2 py-1.5 text-xs font-bold text-white text-center focus:border-accent-500 outline-none"
                min={1}
                max={10}
              />
              <button
                onClick={() => setIsDebuff(!isDebuff)}
                className={`px-2 py-1.5 rounded-lg border-2 text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${
                  isDebuff
                    ? "bg-warrior-600 text-white border-surface-950"
                    : "bg-rogue-600 text-surface-950 border-surface-950"
                }`}
              >
                {isDebuff ? "DEBUFF" : "BUFF"}
              </button>
            </div>
          </div>
          <button
            onClick={handleAddCustom}
            disabled={!buffLabel.trim()}
            className="w-full py-2 bg-accent-600 hover:bg-accent-500 text-surface-950 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-surface-950 shadow-[3px_3px_0px_rgba(15,16,22,0.8)] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add {selectedTarget} Buff
          </button>
        </div>

        {/* Active Buffs List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[9px] font-black text-surface-400 uppercase tracking-widest">
              Active Buffs ({tempBuffs.length})
            </h3>
            {tempBuffs.length > 0 && (
              <button onClick={onClearBuffs} className="text-[8px] font-bold text-warrior-400 hover:text-warrior-300 uppercase tracking-widest">
                Clear All
              </button>
            )}
          </div>
          {tempBuffs.length === 0 ? (
            <p className="text-[10px] text-surface-500 italic text-center py-4">No active buffs. Add one above.</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {tempBuffs.map((buff) => (
                <div
                  key={buff.id}
                  className="flex items-center justify-between bg-surface-950 border-2 border-surface-900 rounded-xl px-3 py-2 shadow-inner"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-white uppercase tracking-wider truncate">{buff.label}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${
                        buff.value > 0 ? "bg-rogue-500/20 text-rogue-400 border-rogue-500/30" : "bg-warrior-500/20 text-warrior-400 border-warrior-500/30"
                      }`}>
                        {buff.value > 0 ? "+" : ""}{buff.value} {buff.target}
                      </span>
                    </div>
                    {buff.source && <p className="text-[7px] text-surface-500 mt-0.5">{buff.source}{buff.duration ? ` · ${buff.duration}` : ""}</p>}
                  </div>
                  <button
                    onClick={() => onRemoveBuff(buff.id)}
                    className="pedal-btn bg-surface-800 text-surface-500 hover:bg-warrior-500 hover:text-white p-1.5 ml-2 shrink-0"
                    title="Remove"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
