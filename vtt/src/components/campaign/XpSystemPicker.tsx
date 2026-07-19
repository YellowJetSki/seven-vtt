/**
 * STᚱ VTT — XP System & Currency Config
 *
 * Choose between XP (experience tracking) or Milestone (level at story beats).
 * Configure currency name and preset (standard, silver standard, etc.).
 */

import { useState, useCallback, useEffect } from "react";
import type { CampaignSettings } from "@/types";
import SettingsSection from "./SettingsSection";

interface XpSystemPickerProps {
  settings: CampaignSettings;
  onSave: (settings: Partial<CampaignSettings>) => void;
}

const XP_PRESETS = [
  { value: "xp", label: "Experience Points", desc: "Track XP per encounter and milestone awards", icon: "⭐" },
  { value: "milestone", label: "Milestone Leveling", desc: "Level up at story-driven milestones", icon: "🏆" },
];

const CURRENCY_PRESETS: { value: string; label: string; desc: string; icon: string }[] = [
  { value: "standard", label: "Standard (PP/GP/EP/SP/CP)", desc: "Platinum → Gold → Electrum → Silver → Copper", icon: "💰" },
  { value: "silver", label: "Silver Standard (GP/SP/CP)", desc: "Gold → Silver → Copper (no platinum/electrum)", icon: "🥈" },
  { value: "electrum", label: "Electrum Standard (GP/EP/SP/CP)", desc: "Gold → Electrum → Silver → Copper", icon: "🪙" },
  { value: "gold", label: "Gold Only", desc: "Single currency: Gold pieces", icon: "🟡" },
  { value: "custom", label: "Custom Name", desc: "Use a custom currency name", icon: "✨" },
];

const CURRENCY_NAMES: Record<string, string> = {
  standard: "Gold Pieces",
  silver: "Silver Pieces",
  electrum: "Electrum Pieces",
  gold: "Gold",
};

export default function XpSystemPicker({ settings, onSave }: XpSystemPickerProps) {
  const [xpSystem, setXpSystem] = useState<"xp" | "milestone">(settings.experienceSystem || "xp");
  const [currencyPreset, setCurrencyPreset] = useState(settings.currencyPreset || "standard");
  const [currencyName, setCurrencyName] = useState(settings.currencyName || CURRENCY_NAMES[settings.currencyPreset] || "Gold Pieces");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setXpSystem(settings.experienceSystem || "xp");
    setCurrencyPreset(settings.currencyPreset || "standard");
    setCurrencyName(settings.currencyName || CURRENCY_NAMES[settings.currencyPreset] || "Gold Pieces");
    setHasChanges(false);
  }, [settings.experienceSystem, settings.currencyPreset, settings.currencyName]);

  const handleSave = useCallback(() => {
    onSave({
      experienceSystem: xpSystem,
      currencyPreset,
      currencyName: currencyPreset === "custom" ? currencyName : (CURRENCY_NAMES[currencyPreset] || "Gold Pieces"),
    });
    setHasChanges(false);
  }, [xpSystem, currencyPreset, currencyName, onSave]);

  const handleSystemChange = useCallback((value: "xp" | "milestone") => {
    setXpSystem(value);
    setHasChanges(true);
  }, []);

  const handlePresetChange = useCallback((value: string) => {
    setCurrencyPreset(value);
    setHasChanges(true);
  }, []);

  return (
    <SettingsSection icon="⚙" title="Game Rules" description="Experience system, currency, and progression rules">
      <div className="space-y-4">
        {/* XP System */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wider text-gold-400/60">Leveling System</label>
          <div className="grid grid-cols-2 gap-2">
            {XP_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => handleSystemChange(p.value as "xp" | "milestone")}
                className={`text-left p-3 rounded-xl transition-all duration-150 active:scale-[0.98] ${
                  xpSystem === p.value
                    ? "bg-gold-500/10 border border-gold/20 shadow-[0_0_8px_rgba(234,179,8,0.04)]"
                    : "bg-[#07080d] border border-white/[0.04] hover:border-white/[0.08]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.icon}</span>
                  <div>
                    <div className={`text-xs font-semibold ${xpSystem === p.value ? "text-gold-300" : "text-surface-300"}`}>
                      {p.label}
                    </div>
                    <div className="text-[9px] text-surface-600 mt-0.5">{p.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wider text-gold-400/60">Currency System</label>
          <div className="grid grid-cols-2 gap-2">
            {CURRENCY_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePresetChange(p.value)}
                className={`text-left p-3 rounded-xl transition-all duration-150 active:scale-[0.98] ${
                  currencyPreset === p.value
                    ? "bg-gold-500/10 border border-gold/20 shadow-[0_0_8px_rgba(234,179,8,0.04)]"
                    : "bg-[#07080d] border border-white/[0.04] hover:border-white/[0.08]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{p.icon}</span>
                  <div>
                    <div className={`text-[10px] font-semibold ${currencyPreset === p.value ? "text-gold-300" : "text-surface-300"}`}>
                      {p.label}
                    </div>
                    <div className="text-[8px] text-surface-600 mt-0.5">{p.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {currencyPreset === "custom" && (
            <input
              type="text"
              value={currencyName}
              onChange={(e) => { setCurrencyName(e.target.value); setHasChanges(true); }}
              placeholder="e.g., Dragon Scales, Guild Marks..."
              className="w-full py-1.5 px-3 rounded-lg text-[10px] bg-[#07080d] border border-white/[0.06] text-white/70 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-700"
            />
          )}
        </div>

        {/* Save */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
          >
            💾 Save Rules
          </button>
        </div>
      </div>
    </SettingsSection>
  );
}
