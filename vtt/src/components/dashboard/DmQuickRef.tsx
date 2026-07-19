/**
 * STᚱ VTT — DM Quick Reference
 *
 * A quick-reference panel for the DM dashboard, inspired by a physical
 * DM screen. Shows commonly-referenced 5e rules:
 *
 * - Difficulty Class benchmarks
 * - Light conditions (Bright/Dim/Darkness)
 * - Cover rules (Half/Three-Quarters/Total)
 * - Condition quick-summary (most common)
 *
 * Sections are collapsible to save space. The DM expands what they need.
 */

import { useState } from "react";

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors group"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider group-hover:text-white/80 transition-colors">
            {title}
          </span>
        </div>
        <span className={`text-[8px] text-surface-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="px-2 pb-2 pt-1 animate-slide-in-up space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-white/[0.01]">
      <span className="text-[10px] text-surface-400">{label}</span>
      <span className="text-[10px] font-semibold text-white/70 tabular-nums">{value}</span>
    </div>
  );
}

export default function DmQuickRef() {
  return (
    <div className="bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-sm">📋</span>
          <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
            DM Quick Reference
          </span>
        </div>
      </div>

      <div className="p-3 space-y-1">
        {/* DC Benchmarks */}
        <Section title="Difficulty Class" icon="🎯" defaultOpen>
          <Row label="Very Easy" value="DC 5" />
          <Row label="Easy" value="DC 10" />
          <Row label="Moderate" value="DC 15" />
          <Row label="Hard" value="DC 20" />
          <Row label="Very Hard" value="DC 25" />
          <Row label="Nearly Impossible" value="DC 30" />
        </Section>

        {/* Light Conditions */}
        <Section title="Light & Vision" icon="☀️">
          <div className="py-1 px-1.5">
            <div className="space-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-medium text-yellow-300/80">Bright Light</span>
                  <p className="text-[8px] text-surface-500">Normal vision, no penalties</p>
                </div>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-medium text-amber-400/60">Dim Light</span>
                  <p className="text-[8px] text-surface-500">Disadvantage on Perception (sight)</p>
                </div>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-medium text-indigo-400/60">Darkness</span>
                  <p className="text-[8px] text-surface-500">Blinded condition · Darkvision 60ft</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Cover */}
        <Section title="Cover" icon="🛡️">
          <Row label="Half Cover" value="+2 AC, +2 DEX saves" />
          <Row label="Three-Quarters" value="+5 AC, +5 DEX saves" />
          <Row label="Total Cover" value="Can't be targeted directly" />
        </Section>

        {/* Common Conditions */}
        <Section title="Key Conditions" icon="⚡">
          <div className="py-1 px-1.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-surface-400">Prone</span>
              <span className="text-[8px] text-surface-500 text-right max-w-[160px]">
                Melee attacks have advantage · Ranged have disadvantage · -half speed to stand
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-surface-400">Grappled</span>
              <span className="text-[8px] text-surface-500 text-right max-w-[160px]">
                Speed = 0 · Can escape with Athletics/Acrobatics vs DC
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-surface-400">Restrained</span>
              <span className="text-[8px] text-surface-500 text-right max-w-[160px]">
                Speed = 0 · Attack disadvantage · Dex save disadvantage
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-surface-400">Stunned</span>
              <span className="text-[8px] text-surface-500 text-right max-w-[160px]">
                Incapacitated · Auto-fail STR/DEX saves · Attacks have advantage
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-surface-400">Invisible</span>
              <span className="text-[8px] text-surface-500 text-right max-w-[160px]">
                Attack advantage · Attacks against have disadvantage · Can't be seen
              </span>
            </div>
          </div>
        </Section>

        {/* Exhaustion */}
        <Section title="Exhaustion" icon="💀">
          <div className="py-1 px-1.5 space-y-0.5">
            {[
              ["Lv.1", "Disadvantage on ability checks"],
              ["Lv.2", "Speed halved"],
              ["Lv.3", "Disadvantage on attacks & saves"],
              ["Lv.4", "Hit point maximum halved"],
              ["Lv.5", "Speed reduced to 0"],
              ["Lv.6", "Death"],
            ].map(([lv, desc]) => (
              <div key={lv} className="flex items-center justify-between py-0.5">
                <span className={`text-[9px] font-mono font-bold ${lv === "Lv.6" ? "text-red-400" : "text-amber-400/80"}`}>
                  {lv}
                </span>
                <span className="text-[8px] text-surface-500 text-right max-w-[180px]">{desc}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
