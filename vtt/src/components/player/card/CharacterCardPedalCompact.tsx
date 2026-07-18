/* ══════════════════════════════════════════════════════════════
   CharacterCardPedalCompact — Pedal-Sheet Inspired DM Card
   Compact view for player cards grid (DM's view).
   Matches the pedal-sheet DMPlayerCard layout with:
   • Chunky 3px borders + 6px hard shadows
   • Identity header with conditions indicator
   • 4-column vitals grid (HP with ±, AC, PP)
   • XP row with ±10 controls
   • Expandable rundown: abilities, quick edits, weapons, resources
   • Spell slots as clickable dot arrays
   • Per-class theme coloring
   ══════════════════════════════════════════════════════════════ */

import { useState, useMemo } from "react";
import type { PlayerCharacter, Ability } from "@/types";

const ABILITIES: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABIL_LABELS: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

const CLASS_THEMES: Record<string, { accent: string; bg: string; hover: string; hex: string }> = {
  barbarian: { accent: "text-rose-400", bg: "bg-rose-600", hover: "hover:bg-rose-500", hex: "#fb7185" },
  bard: { accent: "text-amber-400", bg: "bg-amber-600", hover: "hover:bg-amber-500", hex: "#fbbf24" },
  cleric: { accent: "text-indigo-400", bg: "bg-indigo-600", hover: "hover:bg-indigo-500", hex: "#818cf8" },
  druid: { accent: "text-emerald-400", bg: "bg-emerald-600", hover: "hover:bg-emerald-500", hex: "#34d399" },
  fighter: { accent: "text-rose-400", bg: "bg-rose-600", hover: "hover:bg-rose-500", hex: "#fb7185" },
  monk: { accent: "text-sky-400", bg: "bg-sky-600", hover: "hover:bg-sky-500", hex: "#38bdf8" },
  paladin: { accent: "text-amber-400", bg: "bg-amber-600", hover: "hover:bg-amber-500", hex: "#fbbf24" },
  ranger: { accent: "text-emerald-400", bg: "bg-emerald-600", hover: "hover:bg-emerald-500", hex: "#34d399" },
  rogue: { accent: "text-sky-400", bg: "bg-sky-600", hover: "hover:bg-sky-500", hex: "#38bdf8" },
  sorcerer: { accent: "text-indigo-400", bg: "bg-indigo-600", hover: "hover:bg-indigo-500", hex: "#818cf8" },
  warlock: { accent: "text-indigo-400", bg: "bg-indigo-600", hover: "hover:bg-indigo-500", hex: "#818cf8" },
  wizard: { accent: "text-indigo-400", bg: "bg-indigo-600", hover: "hover:bg-indigo-500", hex: "#818cf8" },
};

function getTheme(className?: string) {
  return CLASS_THEMES[className?.toLowerCase().trim() ?? ""] ?? { accent: "text-indigo-400", bg: "bg-indigo-600", hover: "hover:bg-indigo-500", hex: "#818cf8" };
}

function mod(s: number) { return Math.floor((s - 10) / 2); }

interface Props {
  character: PlayerCharacter;
  onHpChange?: (delta: number) => void;
  onXpChange?: (delta: number) => void;
  onEdit?: () => void;
  onOpenSheet?: () => void;
}

export function CharacterCardPedalCompact({ character, onHpChange, onXpChange, onEdit, onOpenSheet }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = getTheme(character.classes?.[0]?.name || character.class);
  const className = character.classes?.[0]?.name || character.class || "Adventurer";

  const hpPct = character.hitPoints.max > 0 ? (character.hitPoints.current / character.hitPoints.max) * 100 : 0;
  const hpColor = hpPct > 50 ? "bg-rogue-500" : hpPct > 25 ? "bg-divine-500" : "bg-warrior-500";
  const isDead = character.hitPoints.current <= 0;

  const activeConditions = character.conditions ?? [];
  const hasConditions = activeConditions.length > 0;

  // Compute passive perception
  const wisMod = mod(character.wisdom ?? 10);
  const prof = character.proficiencyBonus ?? Math.ceil(1 + character.level / 4);
  const percProf = (character.skills as Record<string, string>)?.["perception"] ?? "none";
  const pp = 10 + wisMod + (percProf === "proficient" ? prof : percProf === "expertise" ? prof * 2 : 0);

  // Extract equipment items
  const weaponEntries = useMemo(() => {
    return (character.equipment ?? []).filter(e => {
      const item = e.item?.toLowerCase() ?? "";
      return !item.includes("armor") && !item.includes("shield") && !item.includes("potion") && !item.includes("book") && !item.includes("pack") && !item.includes("kit");
    }).slice(0, 6);
  }, [character.equipment]);

  // Resources
  const resources = (character as any).resources ?? [];
  const spellSlots = (character as any).spellSlots ?? {};

  const getEquippedWeapons = () => {
    return (character.equipment ?? []).filter(e => {
      const item = e.item?.toLowerCase() ?? "";
      return !item.includes("armor") && !item.includes("shield") && !item.includes("potion");
    }).map(e => e.item).join(", ");
  };

  const portraitSrc = character.imageUrl
    ? character.imageUrl.startsWith("/images/")
      ? character.imageUrl
      : `/images/portraits/${character.imageUrl.replace(/^\//, "")}`
    : `/images/portraits/${character.name?.toLowerCase().replace(/\s+/g, "_")}.png`;

  return (
    <div className="bg-surface-900 border-[3px] border-surface-950 rounded-2xl p-4 shadow-[6px_6px_0px_rgba(15,16,22,0.8)] relative overflow-hidden group transition-all hover:-translate-y-0.5">
      
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full pointer-events-none opacity-20"
        style={{ background: theme.hex }}
      />

      {/* ── Identity Header ──────────────────────────────── */}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Portrait */}
          <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden border-[3px] border-surface-950 shadow-[3px_3px_0px_rgba(15,16,22,0.8)]">
            <img
              src={portraitSrc}
              alt={character.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/AppIcon.png";
              }}
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-white flex items-center gap-2 leading-none mb-0.5 truncate">
              {character.name}
              {hasConditions && <span className="w-2 h-2 rounded-full bg-warrior-500 border border-surface-950 animate-pulse shadow-sm shrink-0" title={`${activeConditions.length} condition(s)`} />}
            </h3>
            <p className="text-[9px] font-bold text-surface-500 uppercase tracking-widest truncate">
              Lv {character.level} {className.split(" ")[0]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onOpenSheet && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenSheet(); }}
              className="pedal-btn bg-accent-600 text-surface-950 hover:bg-accent-500 p-1.5"
              title="Open Sheet"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="pedal-btn bg-surface-800 text-surface-300 hover:bg-surface-700 p-1.5"
            title="Toggle Details"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Vitals Grid (HP + AC + PP) ──────────────────────── */}
      <div className="grid grid-cols-4 gap-2 mb-3 relative z-10">
        {/* HP — col-span-2 */}
        <div className="col-span-2 bg-surface-950 border-2 border-surface-900 rounded-xl p-2 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
          <div className="absolute bottom-0 left-0 h-1.5 transition-all duration-500 w-full bg-surface-800">
            <div className={`h-full ${hpColor} transition-all duration-500`} style={{ width: `${hpPct}%` }} />
          </div>
          <div className="flex items-center justify-between w-full mb-1 px-1">
            <button
              onClick={(e) => { e.stopPropagation(); onHpChange?.(-1); }}
              className="text-white hover:text-warrior-400 bg-surface-900 rounded p-1 border-2 border-surface-950 shadow-sm disabled:opacity-30"
              disabled={isDead}
              aria-label="Damage 1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
            </button>
            <span className="text-[9px] text-warrior-500 font-black uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">HP</span>
            <button
              onClick={(e) => { e.stopPropagation(); onHpChange?.(1); }}
              className="text-white hover:text-rogue-400 bg-surface-900 rounded p-1 border-2 border-surface-950 shadow-sm disabled:opacity-30"
              disabled={isDead}
              aria-label="Heal 1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
            </button>
          </div>
          <span className="text-lg font-black text-white leading-none">
            {character.hitPoints.current} <span className="text-[9px] text-surface-500">/ {character.hitPoints.max}</span>
          </span>
        </div>

        {/* AC */}
        <div className="bg-surface-950 border-2 border-surface-900 rounded-xl p-2 flex flex-col items-center justify-center shadow-inner">
          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            AC
          </span>
          <span className={isDead ? "text-surface-500 text-base font-black" : "text-white text-lg font-black leading-none"}>
            {character.armorClass}
          </span>
        </div>

        {/* PP */}
        <div className="bg-surface-950 border-2 border-surface-900 rounded-xl p-2 flex flex-col items-center justify-center shadow-inner">
          <span className="text-[9px] font-black text-rogue-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            PP
          </span>
          <span className="text-lg font-black text-white leading-none">{pp}</span>
        </div>
      </div>

      {/* ── XP Row ─────────────────────────────────────────── */}
      <div className="bg-surface-950 border-2 border-surface-900 rounded-xl p-2 flex items-center justify-between shadow-inner relative z-10 mb-2">
        <span className={`text-[9px] font-black uppercase tracking-widest leading-none pl-2 flex items-center gap-1.5 ${theme.accent}`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          XP
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onXpChange?.(-10); }}
            className="text-surface-400 hover:text-indigo-400 bg-surface-800 rounded p-1 border border-surface-700 active:translate-y-[1px]"
            aria-label="XP -10"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
          </button>
          <span className="text-sm font-black text-white leading-none w-12 text-center">{character.experiencePoints ?? 0}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onXpChange?.(10); }}
            className="text-surface-400 hover:text-indigo-400 bg-surface-800 rounded p-1 border border-surface-700 active:translate-y-[1px]"
            aria-label="XP +10"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
          </button>
        </div>
      </div>

      {/* ── Expandable Rundown ──────────────────────────────── */}
      {isExpanded && (
        <div className="pt-2 border-t-2 border-surface-800 mt-2 space-y-3 animate-in fade-in slide-in-from-top-2 relative z-10">
          
          {/* Ability Scores (6-col compact) */}
          <div className="grid grid-cols-6 gap-1 bg-surface-950 p-2 rounded-xl border-2 border-surface-900 shadow-inner">
            {ABILITIES.map((abil) => {
              const score = character[abil] ?? 10;
              const m = mod(score);
              return (
                <div key={abil} className="text-center flex flex-col">
                  <span className="text-[7px] uppercase font-black text-surface-500">{ABIL_LABELS[abil]}</span>
                  <span className="text-xs font-black text-white">{score}</span>
                  <span className={`text-[8px] font-bold ${m >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{m >= 0 ? `+${m}` : m}</span>
                </div>
              );
            })}
          </div>

          {/* Equipped Gear */}
          {weaponEntries.length > 0 && (
            <div className="bg-surface-900 p-3 rounded-xl border-2 border-surface-800">
              <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Equipment
              </h4>
              <div className="flex flex-wrap gap-1">
                {weaponEntries.map((e, i) => (
                  <span key={i} className="bg-surface-950 border border-surface-700 rounded-lg px-2 py-0.5 text-[9px] font-bold text-surface-300">
                    {e.item}
                    {e.quantity > 1 && ` ×${e.quantity}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Spell Slots */}
          {Object.keys(spellSlots).length > 0 && (
            <div className="bg-surface-900 p-3 rounded-xl border-2 border-surface-800">
              <h4 className="text-[9px] font-black text-fuchsia-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Spell Slots
              </h4>
              <div className="space-y-1.5">
                {Object.entries(spellSlots).map(([lvl, data]: [string, any]) => (
                  <div key={lvl} className="flex items-center justify-between">
                    <span className="text-[9px] text-surface-400 font-bold uppercase tracking-widest">Lv {lvl}</span>
                    <div className="flex gap-1">
                      {Array.from({ length: data.max ?? 0 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-md border-2 border-surface-950 transition-all shadow-sm ${
                            i < (data.current ?? 0) ? "bg-fuchsia-500" : "bg-surface-900"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {resources.length > 0 && (
            <div className="bg-surface-900 p-3 rounded-xl border-2 border-surface-800">
              <h4 className="text-[9px] font-black text-surface-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                Resources
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {resources.map((res: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-surface-950 px-2 py-1.5 rounded-lg border-2 border-surface-900 shadow-inner">
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest truncate max-w-[100px]">{res.name}</span>
                    <div className="flex gap-1">
                      {Array.from({ length: res.max ?? 1 }).map((_, slotIdx) => (
                        <div
                          key={slotIdx}
                          className={`w-3.5 h-3.5 rounded-md border-2 border-surface-950 transition-all shadow-sm ${
                            slotIdx < (res.current ?? 0) ? `${theme.bg}` : "bg-surface-900"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
