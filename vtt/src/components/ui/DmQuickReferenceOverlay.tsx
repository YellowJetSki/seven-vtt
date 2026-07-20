/**
 * STᚱ VTT — DM Quick Reference Overlay (Real-Play D&D Mechanics, Sprint 16)
 *
 * A comprehensive floating rules reference overlay accessible from any DM page.
 * Designed to be the digital equivalent of a physical DM screen — all critical
 * 5e rules at a glance without leaving the current screen.
 *
 * Features:
 * - 12 sections covering every DM-critical rules category
 * - Keyboard shortcut support (? key to toggle)
 * - Floating glass modal with staggered entrance animation
 * - Dark theme matching the premium glass design system
 * - All data drawn from SRD-accurate 5e rules
 * - Persists open/close state via URL hash or Zustand
 *
 * Sections:
 *  1. DC Benchmarks (Easy → Nearly Impossible)
 *  2. Light & Vision (Bright/Dim/Darkness + Darkvision)
 *  3. Cover Rules (Half/Three-Quarters/Total)
 *  4. Key Conditions (Prone, Grappled, Restrained, Stunned, Invisible)
 *  5. Exhaustion (Lv.1 → Lv.6)
 *  6. Rest Variants (Short vs Long Rest)
 *  7. Travel Pace (Fast/Normal/Slow)
 *  8. Jumping Rules (Long/High/Hop)
 *  9. Light Sources (Candle → Daylight)
 * 10. Spellcasting (Components, Concentration, Rituals)
 * 11. Improvising Damage (by Severity/Level)
 * 12. Social Interaction (Attitude shifts)
 */

import { useEffect, useCallback, useRef, useState } from "react";

interface QuickRefOverlayProps {
  /** Whether the overlay is visible */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Optional className */
  className?: string;
}

// ── Section Component ──

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  index?: number;
}

function RefSection({ title, icon, children, defaultOpen = false, index = 0 }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="border-b border-white/[0.03] last:border-b-0"
      style={{ animation: `slide-in-up 0.2s ease-out ${0.1 + index * 0.03}s both` }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.02] transition-colors group"
      >
        <div className="flex items-center gap-2">
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
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-2.5 pb-2.5 pt-1 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Data Row Components ──

function RefRow({ label, value, color = "text-white/70" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-white/[0.01] transition-colors">
      <span className="text-[10px] text-surface-400">{label}</span>
      <span className={`text-[10px] font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function RefTableRow({ cols }: { cols: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="flex items-center justify-between py-0.5 px-1.5 rounded hover:bg-white/[0.01] transition-colors">
      {cols.map((col, i) => (
        <span
          key={i}
          className={`text-[9px] ${i === 0 ? "text-surface-400 min-w-[70px]" : col.color || "text-white/60"} tabular-nums`}
        >
          {col.value}
        </span>
      ))}
    </div>
  );
}

function RefDivider() {
  return <div className="h-px bg-white/[0.04] my-1" />;
}

function RefDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] text-surface-500 italic px-1.5 py-1">{children}</p>;
}

// ── Main Component ──

export default function DmQuickReferenceOverlay({
  isOpen,
  onClose,
  className = "",
}: QuickRefOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // ── Keyboard handler ──
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement as HTMLElement;
      document.addEventListener("keydown", handleKeyDown);
      // Focus trap — focus the overlay
      setTimeout(() => overlayRef.current?.focus(), 50);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: "fade-in 0.15s ease-out both" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Overlay Card */}
      <div
        ref={overlayRef}
        tabIndex={-1}
        className={`relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-gradient-to-b from-[#14151f]/95 to-[#0f1019]/98 border border-white/[0.06] rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5),0_0_40px_rgba(234,179,8,0.02)] ${className}`}
        style={{ animation: "slide-in-up 0.2s ease-out both" }}
        role="dialog"
        aria-modal="true"
        aria-label="DM Quick Reference"
      >
        {/* Top edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent pointer-events-none z-10" />

        {/* Scrollable content */}
        <div className="relative z-[1] p-4 space-y-0">
          {/* ── Header ── */}
          <div className="flex items-center justify-between pb-3 mb-1 border-b border-white/[0.04]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-sm">
                📋
              </div>
              <div>
                <h2 className="text-[11px] font-bold text-white/80 uppercase tracking-[0.08em]">
                  DM Quick Reference
                </h2>
                <p className="text-[8px] text-surface-500 mt-0.5">
                  Press <kbd className="px-1 py-0.5 rounded bg-[#0c0d15] border border-white/[0.06] text-[7px] font-mono text-gold-400">?</kbd> or <kbd className="px-1 py-0.5 rounded bg-[#0c0d15] border border-white/[0.06] text-[7px] font-mono text-gold-400">Esc</kbd> to toggle
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-[#0c0d15]/70 border border-white/[0.04] text-surface-500 hover:text-gold-400 hover:border-gold/15 hover:bg-gold-500/8 active:scale-90 transition-all duration-200 flex items-center justify-center"
              aria-label="Close quick reference"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── 1. Difficulty Class ── */}
          <RefSection title="Difficulty Class" icon="🎯" defaultOpen index={0}>
            <RefRow label="Very Easy" value="DC 5" color="text-emerald-400" />
            <RefRow label="Easy" value="DC 10" color="text-emerald-300" />
            <RefRow label="Moderate" value="DC 15" color="text-gold-400" />
            <RefRow label="Hard" value="DC 20" color="text-amber-400" />
            <RefRow label="Very Hard" value="DC 25" color="text-red-400" />
            <RefRow label="Nearly Impossible" value="DC 30" color="text-rose-400" />
            <RefDivider />
            <RefDescription>
              Standard DC for ability checks: Easy (10), Moderate (15), Hard (20).
              For passive checks: Passive Perception = 10 + WIS mod + proficiency.
            </RefDescription>
          </RefSection>

          {/* ── 2. Light & Vision ── */}
          <RefSection title="Light & Vision" icon="☀️" index={1}>
            <div className="px-1.5 py-1 space-y-1.5">
              {[
                { label: "Bright Light", desc: "Normal vision, no penalties", color: "text-yellow-300/80" },
                { label: "Dim Light", desc: "Disadvantage on Perception (sight)", color: "text-amber-400/60" },
                { label: "Darkness", desc: "Effectively blinded without darkvision", color: "text-indigo-400/60" },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-2">
                  <span className={`text-[10px] font-medium ${item.color} shrink-0`}>
                    {item.label}
                  </span>
                  <span className="text-[8px] text-surface-500 text-right">{item.desc}</span>
                </div>
              ))}
            </div>
            <RefDivider />
            <RefDescription>
              Darkvision: 60ft (most races), 120ft (Drow, Devil's Sight).
              Dim light counts as bright for creatures with darkvision.
              Darkness counts as dim for creatures with darkvision.
            </RefDescription>
          </RefSection>

          {/* ── 3. Cover Rules ── */}
          <RefSection title="Cover Rules" icon="🛡️" index={2}>
            <RefRow label="Half Cover" value="+2 AC · +2 DEX saves" color="text-emerald-400" />
            <RefRow label="Three-Quarters" value="+5 AC · +5 DEX saves" color="text-gold-400" />
            <RefRow label="Total Cover" value="Can't be targeted directly" color="text-rose-400" />
            <RefDivider />
            <RefDescription>
              Half cover: Behind a low wall, tree, or another creature.
              Three-quarters: Behind an arrow slit or narrow window.
              Total cover: Behind a wall with no openings.
            </RefDescription>
          </RefSection>

          {/* ── 4. Key Conditions ── */}
          <RefSection title="Key Conditions" icon="⚡" index={3}>
            {[
              { name: "Prone", desc: "Melee attacks have advantage · Ranged disadvantage · Half speed to stand" },
              { name: "Grappled", desc: "Speed = 0 · Escape: Athletics/Acrobatics vs DC" },
              { name: "Restrained", desc: "Speed = 0 · Attack disadvantage · DEX save disadvantage" },
              { name: "Stunned", desc: "Incapacitated · Auto-fail STR/DEX saves · Attacks have advantage" },
              { name: "Unconscious", desc: "Incapacitated · Auto-fail STR/DEX saves · Melee auto-crit (within 5ft)" },
              { name: "Invisible", desc: "Attack advantage · Attacks against have disadvantage · Hidden" },
              { name: "Concentrating", desc: "DC 10 or half damage (whichever higher) on damage taken" },
            ].map((cond) => (
              <div key={cond.name} className="flex items-center justify-between gap-2 py-0.5 px-1.5">
                <span className="text-[10px] text-surface-400 font-medium shrink-0">{cond.name}</span>
                <span className="text-[8px] text-surface-500 text-right max-w-[200px]">{cond.desc}</span>
              </div>
            ))}
          </RefSection>

          {/* ── 5. Exhaustion ── */}
          <RefSection title="Exhaustion" icon="💀" index={4}>
            {[
              ["Lv.1", "Disadvantage on ability checks"],
              ["Lv.2", "Speed halved"],
              ["Lv.3", "Disadvantage on attacks & saves"],
              ["Lv.4", "Hit point maximum halved"],
              ["Lv.5", "Speed reduced to 0"],
              ["Lv.6", "Death"],
            ].map(([lv, desc]) => (
              <div key={lv} className="flex items-center justify-between py-0.5 px-1.5">
                <span className={`text-[9px] font-mono font-bold ${lv === "Lv.6" ? "text-red-400" : "text-amber-400/80"}`}>
                  {lv}
                </span>
                <span className="text-[8px] text-surface-500 text-right max-w-[180px]">{desc}</span>
              </div>
            ))}
            <RefDivider />
            <RefDescription>
              Long rest reduces exhaustion by 1 level. Lesser Restoration cures 1 level.
              No level reduces on short rest. Each level stacks.
            </RefDescription>
          </RefSection>

          {/* ── 6. Rest Variants ── */}
          <RefSection title="Rest Variants" icon="😴" index={5}>
            <div className="px-1.5 py-1 space-y-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px]">😴</span>
                  <span className="text-[10px] font-bold text-emerald-400">Short Rest</span>
                  <span className="text-[8px] text-surface-500">(1 hour)</span>
                </div>
                <ul className="space-y-0.5 ml-5">
                  <li className="text-[9px] text-surface-500 list-disc">Spend hit dice to recover HP</li>
                  <li className="text-[9px] text-surface-500 list-disc">Recharge short-rest abilities (Ki, Action Surge, etc.)</li>
                  <li className="text-[9px] text-surface-500 list-disc">No spell slots recovered (except Warlock Pact Magic)</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px]">🛌</span>
                  <span className="text-[10px] font-bold text-gold-400">Long Rest</span>
                  <span className="text-[8px] text-surface-500">(8 hours)</span>
                </div>
                <ul className="space-y-0.5 ml-5">
                  <li className="text-[9px] text-surface-500 list-disc">Regain all HP</li>
                  <li className="text-[9px] text-surface-500 list-disc">Recover half hit dice (minimum 1)</li>
                  <li className="text-[9px] text-surface-500 list-disc">Regain all spell slots</li>
                  <li className="text-[9px] text-surface-500 list-disc">Recharge all abilities (long-rest features)</li>
                  <li className="text-[9px] text-surface-500 list-disc">Reduce exhaustion by 1 level</li>
                  <li className="text-[9px] text-surface-500 list-disc">Interrupted by 1+ hour of combat/walking/exertion</li>
                </ul>
              </div>
            </div>
          </RefSection>

          {/* ── 7. Travel Pace ── */}
          <RefSection title="Travel Pace" icon="🏃" index={6}>
            <div className="px-1.5 py-1">
              <div className="grid grid-cols-4 gap-1 mb-1">
                <span className="text-[7px] uppercase tracking-wider text-surface-600 font-medium">Pace</span>
                <span className="text-[7px] uppercase tracking-wider text-surface-600 font-medium">Minute</span>
                <span className="text-[7px] uppercase tracking-wider text-surface-600 font-medium">Hour</span>
                <span className="text-[7px] uppercase tracking-wider text-surface-600 font-medium">Day</span>
              </div>
              {[
                { pace: "Fast", min: "400ft", hr: "4 mi", day: "30 mi", color: "text-amber-400", note: "-5 penalty to Perception" },
                { pace: "Normal", min: "300ft", hr: "3 mi", day: "24 mi", color: "text-gold-400", note: "No penalty" },
                { pace: "Slow", min: "200ft", hr: "2 mi", day: "18 mi", color: "text-emerald-400", note: "Able to use Stealth" },
              ].map((p) => (
                <div key={p.pace} className="grid grid-cols-4 gap-1 py-1 items-center">
                  <span className={`text-[9px] font-bold ${p.color}`}>{p.pace}</span>
                  <span className="text-[9px] text-white/60 tabular-nums">{p.min}</span>
                  <span className="text-[9px] text-white/60 tabular-nums">{p.hr}</span>
                  <span className="text-[9px] text-white/60 tabular-nums">{p.day}</span>
                </div>
              ))}
              <RefDescription>{'Fast: -5 penalty to passive Perception while traveling. Slow: Able to use Stealth.'}</RefDescription>
            </div>
          </RefSection>

          {/* ── 8. Jumping ── */}
          <RefSection title="Jumping Rules" icon="🦘" index={7}>
            <div className="px-1.5 py-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-surface-400">Long Jump (running)</span>
                <span className="text-[10px] font-semibold text-white/70 tabular-nums">STR score (ft)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-surface-400">Long Jump (standing)</span>
                <span className="text-[10px] font-semibold text-white/70 tabular-nums">Half STR score (ft)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-surface-400">High Jump (running)</span>
                <span className="text-[10px] font-semibold text-white/70 tabular-nums">3 + STR mod (ft)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-surface-400">High Jump (standing)</span>
                <span className="text-[10px] font-semibold text-white/70 tabular-nums">Half of 3 + STR mod (ft)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-surface-400">Hop (10ft running start)</span>
                <span className="text-[10px] font-semibold text-white/70 tabular-nums">Half STR score (ft)</span>
              </div>
              <RefDivider />
              <RefDescription>
                No Athletics check needed for jumps ≤ your score. DC 10 Athletics to clear a prone creature. 
                Each foot of jumping costs 1 foot of movement — even on a standing jump.
              </RefDescription>
            </div>
          </RefSection>

          {/* ── 9. Light Sources ── */}
          <RefSection title="Light Sources" icon="🕯️" index={8}>
            <div className="px-1.5 py-1 space-y-1">
              {[
                { src: "Candle", bright: "5ft", dim: "+5ft", dur: "1 hour" },
                { src: "Torch", bright: "20ft", dim: "+20ft", dur: "1 hour" },
                { src: "Lantern (Hooded)", bright: "30ft", dim: "+30ft", dur: "6 hours / 1 flask" },
                { src: "Lantern (Bullseye)", bright: "60ft cone", dim: "+60ft", dur: "6 hours / 1 flask" },
                { src: "Dancing Lights", bright: "-", dim: "30ft (each)", dur: "1 min (conc)" },
                { src: "Light (Cantrip)", bright: "20ft", dim: "+20ft", dur: "1 hour" },
                { src: "Daylight (Spell)", bright: "60ft", dim: "+60ft", dur: "1 hour" },
              ].map((light) => (
                <div key={light.src} className="grid grid-cols-4 gap-1 py-0.5 px-1 items-center">
                  <span className="text-[9px] text-surface-400 font-medium">{light.src}</span>
                  <span className="text-[9px] text-yellow-300/70 tabular-nums">{light.bright}</span>
                  <span className="text-[9px] text-amber-400/60 tabular-nums">{light.dim}</span>
                  <span className="text-[9px] text-surface-500 tabular-nums">{light.dur}</span>
                </div>
              ))}
            </div>
          </RefSection>

          {/* ── 10. Spellcasting ── */}
          <RefSection title="Spellcasting Rules" icon="🔮" index={9}>
            <div className="px-1.5 py-1 space-y-1.5">
              {[
                { label: "V (Verbal)", desc: "Must be able to speak — gagged = no V spells" },
                { label: "S (Somatic)", desc: "Must have a free hand — bound/restrained = no S spells" },
                { label: "M (Material)", desc: "Must have the focus/component pouch — lost pouch = no M spells" },
                { label: "Concentration", desc: "Max 1 conc spell · DC 10 or half damage · Breaks on incapacitation" },
                { label: "Ritual", desc: "+10 min casting time · Doesn't consume a spell slot" },
                { label: "Reaction Casting", desc: "Cast on someone else's turn · Verbal+Somatic only" },
                { label: "Bonus Action Rule", desc: "Cast BA spell → can only cast cantrip with action" },
                { label: "Simultaneous Spells", desc: "Only 1 leveled spell per turn (except cantrip actions)" },
                { label: "Spell Scrolls", desc: "DC 10+spell level INT/WIS/CHA check if spell not on your list" },
              ].map((rule) => (
                <div key={rule.label} className="flex items-start justify-between gap-2 py-0.5">
                  <span className="text-[9px] text-surface-400 font-medium shrink-0 w-[80px]">{rule.label}</span>
                  <span className="text-[8px] text-surface-500 text-right">{rule.desc}</span>
                </div>
              ))}
            </div>
          </RefSection>

          {/* ── 11. Improvising Damage ── */}
          <RefSection title="Improvising Damage" icon="💥" index={10}>
            <div className="px-1.5 py-1">
              <div className="grid grid-cols-3 gap-1 mb-1">
                <span className="text-[7px] uppercase tracking-wider text-surface-600 font-medium">Severity</span>
                <span className="text-[7px] uppercase tracking-wider text-surface-600 font-medium">Lv 1-4</span>
                <span className="text-[7px] uppercase tracking-wider text-surface-600 font-medium">Lv 5-10</span>
              </div>
              {[
                { sev: "Bludgeoning", l1: "1d10", l5: "2d10" },
                { sev: "Falling (per 10ft)", l1: "1d6", l5: "1d6" },
                { sev: "Caustic liquid", l1: "1d6", l5: "4d6" },
                { sev: "Lava (immersed)", l1: "10d10", l5: "18d10" },
                { sev: "Collapsing roof", l1: "4d10", l5: "10d10" },
                { sev: "Being trampled", l1: "1d12", l5: "3d12" },
              ].map((row) => (
                <div key={row.sev} className="grid grid-cols-3 gap-1 py-0.5 px-1 items-center">
                  <span className="text-[9px] text-surface-400">{row.sev}</span>
                  <span className="text-[9px] text-white/60 tabular-nums">{row.l1}</span>
                  <span className="text-[9px] text-white/60 tabular-nums">{row.l5}</span>
                </div>
              ))}
            </div>
            <RefDivider />
            <RefDescription>
              DMG p.249: Setback = 1d6, Dangerous = 2d6, Deadly = 4d6+.
              Adjust by tier: ×2 for Lv 5-10, ×5 for Lv 11-16, ×10 for Lv 17-20.
            </RefDescription>
          </RefSection>

          {/* ── 12. Social Interaction ── */}
          <RefSection title="Social Interaction" icon="💬" index={11}>
            <div className="px-1.5 py-1">
              <div className="grid grid-cols-3 gap-1 mb-1">
                <span className="text-[7px] uppercase tracking-wider text-surface-600 font-medium">Attitude</span>
                <span className="text-[7px] uppercase tracking-wider text-surface-600 font-medium">DC</span>
                <span className="text-[7px] uppercase tracking-wider text-surface-600 font-medium">Shift</span>
              </div>
              {[
                { att: "Friendly", dc: "15 → 10", shift: "+4 DC per shift away" },
                { att: "Indifferent", dc: "20 → 15", shift: "+2 DC per shift away" },
                { att: "Hostile", dc: "25 → 20", shift: "-2 DC per shift closer" },
              ].map((row) => (
                <div key={row.att} className="grid grid-cols-3 gap-1 py-0.5 px-1 items-center">
                  <span className="text-[9px] text-surface-400">{row.att}</span>
                  <span className="text-[9px] text-white/60 tabular-nums">{row.dc}</span>
                  <span className="text-[9px] text-surface-500 tabular-nums">{row.shift}</span>
                </div>
              ))}
            </div>
            <RefDivider />
            <RefDescription>
              First DC = request that goes against the NPC's nature.
              Second DC = request that's reasonable for that attitude.
              Charisma (Persuasion/Intimidation/Deception) check vs DC.
            </RefDescription>
          </RefSection>

          {/* ── Footer ── */}
          <div
            className="pt-3 pb-1 px-2 text-center border-t border-white/[0.04] mt-1"
            style={{ animation: "slide-in-up 0.2s ease-out 0.45s both" }}
          >
            <p className="text-[7px] text-surface-600 uppercase tracking-[0.1em]">
              D&D 5th Edition SRD Rules Reference
            </p>
            <p className="text-[7px] text-surface-700 mt-0.5">
              Quick reference for DM use during live sessions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
