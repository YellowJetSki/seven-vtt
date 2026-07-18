/* ── CharacterCard ─────────────────────────────────────────────
 * Rich character card with prominent portrait, ability scores,
 * HP bar, speed, proficiencies summary, and quick-action overlay.
 * Click opens the full CharacterDetailModal.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import type { PlayerCharacter, Ability } from "@/types";
import { getClassSummary } from "@/types";
import { formatCurrency } from "@/lib/character-export";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { FullscreenImageModal } from "@/components/ui/FullscreenImageModal";

const PORTRAIT_BASE_PATH = "/images/portraits";
const ABILITY_ORDER: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABILITY_SHORT: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

/** Resolve portrait URL with legacy path correction */
function resolvePortraitUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/images/")) return url;
  if (url.startsWith("/")) return `${PORTRAIT_BASE_PATH}${url}`;
  return url;
}

interface Props {
  character: PlayerCharacter;
  index: number;
  onOpen: () => void;
  onEdit: () => void;
  onOpenInventory: () => void;
  onExport: () => void;
  onDelete: () => void;
}

function getAbilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function getHpBarColor(percent: number): string {
  if (percent <= 0) return "bg-surface-600";
  if (percent <= 25) return "bg-warrior-500";
  if (percent <= 50) return "bg-divine-500";
  return "bg-rogue-500";
}

function formatInitiative(init: number | string | undefined | null): string {
  if (init === undefined || init === null || init === "--" || init === "" || isNaN(Number(init))) return "—";
  return `+${init}`;
}

function getHpTextColor(percent: number): string {
  if (percent <= 0) return "text-surface-500";
  if (percent <= 25) return "text-warrior-400";
  if (percent <= 50) return "text-divine-400";
  return "text-rogue-400";
}

export function CharacterCard({ character, index, onOpen, onEdit, onOpenInventory, onExport, onDelete }: Props) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const hpPercent = character.hitPoints.max > 0
    ? Math.max(0, (character.hitPoints.current / character.hitPoints.max) * 100)
    : 0;

  const speedParts: string[] = [];
  if (character.speed?.walk) speedParts.push(`${character.speed.walk}ft`);
  if (character.speed?.fly) speedParts.push(`Fly ${character.speed.fly}ft`);
  if (character.speed?.swim) speedParts.push(`Swim ${character.speed.swim}ft`);
  if (character.speed?.climb) speedParts.push(`Climb ${character.speed.climb}ft`);
  const speedDisplay = speedParts.join(" | ");

  const proficientSkills = Object.entries(character.skills ?? {})
    .filter(([, v]) => v === "proficient" || v === "expertise")
    .map(([k]) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()));

  const portraitUrl = resolvePortraitUrl(character.imageUrl);
  const fallbackEmoji = character.race.includes("Gnome") ? "🧙" : character.race.includes("Elf") ? "🧝" : "⚔";

  const proficientSaves = Object.entries(character.savingThrows ?? {})
    .filter(([, v]) => v.proficient)
    .map(([k]) => ABILITY_SHORT[k as Ability]);

  return (
    <>
      <div
        className="group relative flex flex-col rounded-xl border border-surface-700/60 bg-surface-850/80 overflow-hidden transition-all duration-200 hover:border-accent-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-500/5 active:translate-y-0 cursor-pointer animate-slide-up"
        style={{ animationDelay: `${Math.min(index * 60, 420)}ms` }}
        onClick={onOpen}
      >
        {/* ── Colored accent bar ── */}
        <div className="h-1.5 bg-gradient-to-r from-rogue-500/50 via-accent-500/50 to-mage-500/50" />

        {/* ── Portrait + Identity row ── */}
        <div className="flex gap-3 p-3 pb-2">
          {/* Portrait */}
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 ring-surface-700 group-hover:ring-accent-500/40 transition-all">
            <ImageWithFallback
              src={portraitUrl}
              alt={`${character.name} portrait`}
              fallback={fallbackEmoji}
              className="h-full w-full"
              fit="cover"
              onClick={(e) => {
                e.stopPropagation();
                if (character.imageUrl) setShowFullscreen(true);
              }}
            />
          </div>

          {/* Identity */}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-surface-100 truncate group-hover:text-accent-300 transition-colors">
              {character.name}
            </h3>
            <p className="text-[11px] text-surface-400 mt-0.5">
              {character.race}
            </p>
            <p className="text-[11px] text-accent-400/80 font-medium">
              {getClassSummary(character.classes ?? [{ name: character.class, level: character.level } as any])}
            </p>
            {character.background && (
              <p className="text-[10px] text-surface-500 mt-0.5 italic">
                {character.background}
              </p>
            )}
          </div>

          {/* Level badge */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rogue-500/15 text-xs font-bold text-rogue-400 ring-1 ring-rogue-500/20">
            {character.level}
          </div>
        </div>

        {/* ── HP Bar ── */}
        <div className="px-3 pb-1">
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-surface-500">HP</span>
            <span className={`font-medium ${getHpTextColor(hpPercent)}`}>
              {character.hitPoints.current}/{character.hitPoints.max}
              {character.hitPoints.temporary > 0 && (
                <span className="text-mage-400 ml-1">(+{character.hitPoints.temporary})</span>
              )}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-700/80 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getHpBarColor(hpPercent)}`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* ── Key Stats Row ── */}
        <div className="grid grid-cols-4 gap-px bg-surface-800 mx-3 rounded-lg overflow-hidden border border-surface-700/50">
          <StatCell label="AC" value={String(character.armorClass)} />
          <StatCell label="Init" value={formatInitiative(character.initiative)} />
          <StatCell label="PB" value={`+${character.proficiencyBonus}`} />
          <StatCell label="Speed" value={String(character.speed?.walk ?? 30)} />
        </div>

        {/* ── Ability Scores ── */}
        <div className="grid grid-cols-6 gap-px bg-surface-800 mx-3 mt-1.5 rounded-lg overflow-hidden border border-surface-700/50">
          {ABILITY_ORDER.map((ability) => {
            const score = character[ability] ?? 10;
            const mod = getAbilityMod(score);
            return (
              <div key={ability} className="bg-surface-850 py-1 text-center">
                <p className="text-[8px] font-semibold text-surface-500 uppercase tracking-wider">{ABILITY_SHORT[ability]}</p>
                <p className="text-xs font-bold text-surface-100 leading-tight">{score}</p>
                <p className={`text-[9px] font-medium leading-tight ${mod >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>
                  {formatMod(mod)}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Saving Throws & Speed ── */}
        <div className="px-3 pt-2 space-y-1">
          {proficientSaves.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[9px] text-surface-500 font-medium uppercase tracking-wider">Saves:</span>
              {proficientSaves.map((save) => (
                <span key={save} className="rounded bg-mage-500/10 px-1.5 py-0.5 text-[9px] font-medium text-mage-400">
                  {save}
                </span>
              ))}
            </div>
          )}
          {proficientSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[9px] text-surface-500 font-medium uppercase tracking-wider">Skills:</span>
              <span className="text-[9px] text-surface-400 truncate max-w-[200px]">
                {proficientSkills.slice(0, 4).join(", ")}
                {proficientSkills.length > 4 && <span className="text-surface-500"> +{proficientSkills.length - 4}</span>}
              </span>
            </div>
          )}
        </div>

        {/* ── Inventory & Currency footer ── */}
        <div className="mt-auto px-3 py-2 flex items-center justify-between text-[10px] text-surface-500 border-t border-surface-700/30">
          <span className="flex items-center gap-1">
            <span>🎒</span>
            {(character.equipment ?? []).length + (character.inventory ?? []).length} items
          </span>
          <span className="flex items-center gap-1">
            <span>🪙</span>
            {formatCurrency(character, "gp")} gp
          </span>
          {character.playerName && (
            <span className="text-surface-600" title={`Player: ${character.playerName}`}>
              👤
            </span>
          )}
        </div>

        {/* ── Action Overlay ── */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex gap-1">
          <ActionButton icon="🎒" title="Inventory" onClick={(e) => { e.stopPropagation(); onOpenInventory(); }} />
          <ActionButton icon="✏️" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(); }} />
          <ActionButton icon="📤" title="Export" onClick={(e) => { e.stopPropagation(); onExport(); }} />
          <ActionButton icon="🗑️" title="Remove" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="hover:bg-warrior-500/20 hover:text-warrior-400" />
        </div>

        {/* ── Hover glow ── */}
        <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-1 ring-accent-500/20" />
      </div>

      {/* ── Fullscreen Portrait ── */}
      {showFullscreen && portraitUrl && (
        <FullscreenImageModal
          src={portraitUrl}
          alt={`${character.name} portrait`}
          onClose={() => setShowFullscreen(false)}
        />
      )}
    </>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-850 px-1.5 py-1.5 text-center">
      <p className="text-[8px] font-semibold text-surface-500 uppercase tracking-wider">{label}</p>
      <p className="text-xs font-bold text-surface-100">{value}</p>
    </div>
  );
}

function ActionButton({
  icon,
  title,
  onClick,
  className = "",
}: {
  icon: string;
  title: string;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-md bg-surface-900/80 px-1.5 py-1 text-xs text-surface-300 backdrop-blur-sm transition-colors hover:bg-accent-500/20 hover:text-accent-300 ${className}`}
    >
      {icon}
    </button>
  );
}
