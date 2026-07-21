/**
 * STᚱ VTT — DM Quick Reference (Premium Accordion Design)
 *
 * A premium quick-reference panel for the DM dashboard, inspired by
 * physical DM screens. Collapsible section accordions with:
 * - Smooth height transitions
 * - Gold-accented headers with character icons
 * - Data-dense rows with tabular layout
 * - Color-coded stat values
 * - Hover states on every interactive element
 *
 * Sections: DC Benchmarks, Light & Vision, Cover, Key Conditions, Exhaustion
 */

import { useState } from "react";
import DashboardPanel from "@/components/ui/DashboardPanel";

// ── Sub-components ──

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function QuickRefSection({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/[0.03] last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/[0.02] transition-colors group"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider group-hover:text-white/80 transition-colors">
            {title}
          </span>
        </div>
        <span
          className={`text-[8px] text-surface-500 transition-transform duration-300 ease-out ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-2 pb-2 pt-1 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function QuickRefRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-white/[0.01] transition-colors">
      <span className="text-[10px] text-surface-400">{label}</span>
      <span className="text-[10px] font-semibold text-white/70 tabular-nums">{value}</span>
    </div>
  );
}

// ── Main Component ──

export default function DmQuickRef() {
  return (
    <DashboardPanel
      icon="📋"
      title="DM Quick Reference"
    >
          {/* Difficulty Class */}
          <QuickRefSection title="Difficulty Class" icon="🎯" defaultOpen>
            <QuickRefRow label="Very Easy" value="DC 5" />
            <QuickRefRow label="Easy" value="DC 10" />
            <QuickRefRow label="Moderate" value="DC 15" />
            <QuickRefRow label="Hard" value="DC 20" />
            <QuickRefRow label="Very Hard" value="DC 25" />
            <QuickRefRow label="Nearly Impossible" value="DC 30" />
          </QuickRefSection>

          {/* Light Conditions */}
          <QuickRefSection title="Light & Vision" icon="☀️">
            <div className="py-1 px-1.5 space-y-1.5">
              {[
                { label: "Bright Light", desc: "Normal vision, no penalties", color: "text-yellow-300/80" },
                { label: "Dim Light", desc: "Disadvantage on Perception (sight)", color: "text-amber-400/60" },
                { label: "Darkness", desc: "Blinded condition · Darkvision 60ft", color: "text-indigo-400/60" },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-2">
                  <span className={`text-[10px] font-medium ${item.color} shrink-0`}>
                    {item.label}
                  </span>
                  <span className="text-[8px] text-surface-500 text-right">{item.desc}</span>
                </div>
              ))}
            </div>
          </QuickRefSection>

          {/* Cover */}
          <QuickRefSection title="Cover" icon="🛡️">
            <QuickRefRow label="Half Cover" value="+2 AC, +2 DEX saves" />
            <QuickRefRow label="Three-Quarters" value="+5 AC, +5 DEX saves" />
            <QuickRefRow label="Total Cover" value="Can't be targeted directly" />
          </QuickRefSection>

          {/* Key Conditions */}
          <QuickRefSection title="Key Conditions" icon="⚡">
            <div className="py-1 px-1.5 space-y-1.5">
              {[
                { name: "Prone", desc: "Melee attacks have advantage · Ranged have disadvantage · -half speed to stand" },
                { name: "Grappled", desc: "Speed = 0 · Escape with Athletics/Acrobatics vs DC" },
                { name: "Restrained", desc: "Speed = 0 · Attack disadvantage · Dex save disadvantage" },
                { name: "Stunned", desc: "Incapacitated · Auto-fail STR/DEX saves · Attacks have advantage" },
                { name: "Invisible", desc: "Attack advantage · Attacks against have disadvantage · Can't be seen" },
              ].map((cond) => (
                <div key={cond.name} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-surface-400 font-medium shrink-0">{cond.name}</span>
                  <span className="text-[8px] text-surface-500 text-right">{cond.desc}</span>
                </div>
              ))}
            </div>
          </QuickRefSection>

          {/* Exhaustion Table */}
          <QuickRefSection title="Exhaustion" icon="💀">
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
          </QuickRefSection>
    </DashboardPanel>
  );
}
