/* ══════════════════════════════════════════════════════════════
   STᚱ VTT — Player Character Sheet (Pedal-Sheet Edition)
   Complete re-skin of the premium player sheet with the 
   chunky physical card aesthetic inspired by pedal-sheet
   ══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import type { PlayerCharacter } from "@/types";
import type { TempBuff } from "@/types/temp-buffs";
import { getThemeForClass } from "./character-theme";
import { HpBarPedal } from "./HpBarPedal";
import { PrimaryStatsPedal } from "./PrimaryStatsPedal";
import { AbilityGridPedal } from "./AbilityGridPedal";
import { ConditionsPedal } from "./ConditionsPedal";
import { XpBarPedal } from "./XpBarPedal";
import { WeaponsPedal } from "./WeaponsPedal";
import { SpellcastingPedal } from "./SpellcastingPedal";
import { ResourcesTrackersPedal } from "./ResourcesTrackersPedal";
import { TempBuffsModal } from "./TempBuffsModal";
import "./pedal-styles.css";

interface Props {
  character: PlayerCharacter;
  onHpChange?: (delta: number) => void;
  onUpdateCharacter?: (updates: Partial<PlayerCharacter>) => void;
  compact?: boolean;
}

function mod(s: number) { return Math.floor((s - 10) / 2); }

export function PlayerCharacterSheetPedal({ character, onHpChange, onUpdateCharacter }: Props) {
  const [showBuffs, setShowBuffs] = useState(false);
  const theme = getThemeForClass(character.classes?.[0]?.name || character.class || "");
  const hpPercent = character.hitPoints.max > 0 ? (character.hitPoints.current / character.hitPoints.max) * 100 : 0;
  const handleHpChange = (delta: number) => { if (onHpChange) onHpChange(delta); };

  const conditionList = character.conditions || [];
  const resources = (character as any).resources ?? [];
  const buffs: TempBuff[] = (character as any).tempBuffs ?? [];
  const deathSaves = character.deathSaves ?? { successes: 0, failures: 0 };
  const isDown = character.hitPoints.current <= 0;
  const speeds = [{ label: "Walk", value: character.speed?.walk }, { label: "Fly", value: character.speed?.fly }, { label: "Swim", value: character.speed?.swim }, { label: "Climb", value: character.speed?.climb }, { label: "Burrow", value: character.speed?.burrow }].filter((s) => s.value != null && s.value > 0);
  const equipmentCount = character.equipment?.length ?? 0;
  const inventoryCount = character.inventory?.length ?? 0;
  const totalItems = equipmentCount + inventoryCount;
  const currency = character.currency ?? {};
  const gpTotal = (currency.gold ?? 0) + Math.floor((currency.silver ?? 0) / 10);

  return (
    <div className="max-w-2xl mx-auto space-y-3 p-3">
      {/* Portrait + Identity Header */}
      <div className="pedal-card bg-surface-900 p-4 flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <div className="w-16 h-16 rounded-xl overflow-hidden border-[3px] border-surface-950 shadow-[4px_4px_0px_rgba(15,16,22,0.8)]">
            <img src={character.imageUrl || `/images/portraits/${character.name?.toLowerCase().replace(/\s+/g, "_")}.png`} alt={character.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/AppIcon.png"; }} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black shadow-[2px_2px_0px_rgba(15,16,22,0.8)] border-2 border-surface-950" style={{ background: theme.hexBg, color: "#0f1016" }}>{character.level}</div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-white truncate pedal-text-shadow">{character.name}</h2>
          <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest truncate">{character.race} · {character.classes?.map((c) => `${c.name} ${c.level}`).join(" / ") || `${character.class || "Adventurer"} ${character.level}`}</p>
          <p className="text-[9px] text-surface-600 mt-0.5">{character.playerName ? `Player: ${character.playerName}` : character.background || ""}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setShowBuffs(true)}
            className={`pedal-btn px-2 py-1 ${buffs.length > 0 ? "bg-accent-600 text-surface-950 hover:bg-accent-500" : "bg-surface-800 text-surface-300 hover:bg-surface-700"}`}
            title="Temp Buffs"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span className="ml-0.5 hidden sm:inline text-[9px] font-black uppercase tracking-widest">Buffs</span>
            {buffs.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rogue-400 animate-pulse ml-1" />}
          </button>
          <button className="pedal-btn bg-surface-800 text-surface-300 hover:bg-surface-700 px-2 py-1" title="View Sheet">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          </button>
        </div>
      </div>

      <HpBarPedal character={character} hpPercent={hpPercent} onHpChange={handleHpChange} />
      <PrimaryStatsPedal character={character} />
      <AbilityGridPedal character={character} />
      <XpBarPedal character={character} />
      <ConditionsPedal conditions={conditionList} />
      <WeaponsPedal character={character} />
      <SpellcastingPedal character={character} />
      <ResourcesTrackersPedal resources={resources} />

      {/* Speed Breakdown */}
      <div className="pedal-card bg-surface-900 p-3">
        <span className="pedal-label flex items-center gap-1.5 mb-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
          Movement
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {speeds.length > 0 ? speeds.map((s) => (
            <div key={s.label} className="pedal-stat-block p-2 text-center">
              <p className="text-[7px] font-black uppercase tracking-widest text-surface-500">{s.label}</p>
              <p className="text-sm font-bold text-surface-200">{s.value}ft</p>
            </div>
          )) : (
            <p className="text-[10px] text-surface-500 col-span-full text-center">{(character.speed?.walk ?? 30)}ft walk</p>
          )}
        </div>
        {character.speed?.canHover && <p className="text-[9px] text-mage-400 italic mt-1 flex items-center gap-1">Hover</p>}
      </div>

      {/* Equipment Summary */}
      {totalItems > 0 && (
        <div className="pedal-card bg-surface-900 p-3">
          <span className="pedal-label flex items-center gap-1.5 mb-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            Equipment & Inventory
          </span>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-surface-400">{equipmentCount} equipped · {inventoryCount} carried</span>
            <span className="text-[10px] font-bold text-surface-300">{totalItems} total items</span>
          </div>
          {character.equipment && character.equipment.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {character.equipment.slice(0, 8).map((e, i) => (
                <span key={i} className="bg-surface-950 border border-surface-800 rounded-lg px-2 py-0.5 text-[8px] font-bold text-surface-300">{e.item}{e.quantity && e.quantity > 1 ? ` x${e.quantity}` : ""}</span>
              ))}
              {character.equipment.length > 8 && <span className="text-[8px] text-surface-500">+{character.equipment.length - 8} more</span>}
            </div>
          )}
        </div>
      )}

      {/* Currency */}
      {gpTotal > 0 && (
        <div className="pedal-card bg-surface-900 p-3">
          <span className="pedal-label flex items-center gap-1.5 mb-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Currency
          </span>
          <div className="grid grid-cols-5 gap-1">
            {([["pp", currency.platinum ?? 0, "text-mage-400"], ["gp", currency.gold ?? 0, "text-gold-400"], ["ep", currency.electrum ?? 0, "text-surface-400"], ["sp", currency.silver ?? 0, "text-surface-300"], ["cp", currency.copper ?? 0, "text-warrior-400"]] as const).map(([key, val, color]) => (
              <div key={key} className="pedal-stat-block p-1.5 text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-surface-500">{key}</p>
                <p className={`text-sm font-black ${color}`}>{val}</p>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-surface-500 mt-1.5 text-center">~{gpTotal.toLocaleString()} GP equivalent</p>
        </div>
      )}

      {/* Temp Buffs Modal */}
      {showBuffs && (
        <TempBuffsModal
          tempBuffs={buffs}
          onAddBuff={(buff) => {
            const existing = buffs;
            onUpdateCharacter?.({ tempBuffs: [...existing, buff] });
          }}
          onRemoveBuff={(buffId) => {
            onUpdateCharacter?.({ tempBuffs: buffs.filter((b) => b.id !== buffId) });
          }}
          onClearBuffs={() => {
            onUpdateCharacter?.({ tempBuffs: [] });
          }}
          onClose={() => setShowBuffs(false)}
          baseAC={character.armorClass}
          baseSpeed={character.speed?.walk ?? 30}
        />
      )}

      {/* Death Saves (only when down) */}
      {isDown && (
        <div className="pedal-card bg-surface-900 p-3 border-warrior-500/30">
          <span className="pedal-label flex items-center gap-1.5 mb-2 text-warrior-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            Death Saves
          </span>
          <div className="flex items-center gap-6 justify-center">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-rogue-400 uppercase tracking-widest">Successes</span>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`w-5 h-5 rounded-md border-2 border-surface-950 transition-all shadow-sm ${i < deathSaves.successes ? "bg-rogue-500" : "bg-surface-950"}`} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-warrior-400 uppercase tracking-widest">Failures</span>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`w-5 h-5 rounded-md border-2 border-surface-950 transition-all shadow-sm ${i < deathSaves.failures ? "bg-warrior-500" : "bg-surface-950"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
