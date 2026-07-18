/* ── CharacterCard (v3 — Premium Redesign) ─────────────────────
 * Rich, information-dense character card inspired by premium VTTs
 * (Foundry, Roll20, D&D Beyond). Composes sub-components for:
 *  - Combat block (AC, Init, PB, HP bar, hit dice, speed, passives)
 *  - Ability scores with save proficiency dots
 *  - Saving throws + key skill bonuses
 *  - Weapon attacks with attack bonus & damage
 *  - Spellcasting ability, DC, attack bonus, slot gauges
 *  - Class resources (Ki, Rage, etc.)
 *  - Equipment quick-view + currency
 *  - XP progress bar
 * ─── No dice rollers ─────────────────────────────────────────── */

import { useState } from "react";
import type { PlayerCharacter } from "@/types";
import { getClassSummary } from "@/types";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { FullscreenImageModal } from "@/components/ui/FullscreenImageModal";
import { CharacterCombatBlock } from "./CharacterCombatBlock";
import { CharacterAbilityBlock } from "./CharacterAbilityBlock";
import { CharacterSkillSummary } from "./CharacterSkillSummary";
import { CharacterWeaponSummary } from "./CharacterWeaponSummary";
import { CharacterSpellSummary } from "./CharacterSpellSummary";
import { CharacterResourcesSummary } from "./CharacterResourcesSummary";
import { CharacterEquipmentSummary } from "./CharacterEquipmentSummary";
import { CharacterXpProgress } from "./CharacterXpProgress";

const PORTRAIT_BASE_PATH = "/images/portraits";

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

export function CharacterCard({ character, index, onOpen, onEdit, onOpenInventory, onExport, onDelete }: Props) {
  const [showFullscreen, setShowFullscreen] = useState(false);

  const portraitUrl = resolvePortraitUrl(character.imageUrl);
  const fallbackEmoji = character.race.includes("Gnome") ? "🧙" : character.race.includes("Elf") ? "🧝" : "⚔";

  return (
    <>
      <div
        className="group relative flex flex-col rounded-xl border border-surface-700/60 bg-surface-850/80 overflow-hidden transition-all duration-200 hover:border-accent-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-500/5 active:translate-y-0 cursor-pointer animate-slide-up"
        style={{ animationDelay: `${Math.min((index || 0) * 60, 420)}ms` }}
        onClick={onOpen}
      >
        {/* ── Level-tinted accent bar ── */}
        <div className="h-1.5 bg-gradient-to-r from-rogue-500/50 via-accent-500/50 to-mage-500/50" />

        {/* ════════ PORTRAIT + IDENTITY ════════ */}
        <div className="flex gap-3 p-3 pb-2">
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
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-surface-100 truncate group-hover:text-accent-300 transition-colors">
              {character.name}
            </h3>
            <p className="text-[11px] text-surface-400 mt-0.5">{character.race}</p>
            <p className="text-[11px] text-accent-400/80 font-medium">
              {getClassSummary(character.classes ?? [{ name: character.class, level: character.level } as any])}
            </p>
            {character.background && (
              <p className="text-[10px] text-surface-500 mt-0.5 italic truncate">{character.background}</p>
            )}
            {character.playerName && (
              <p className="text-[9px] text-surface-600 mt-0.5">👤 {character.playerName}</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rogue-500/15 text-xs font-bold text-rogue-400 ring-1 ring-rogue-500/20">
              {character.level}
            </div>
          </div>
        </div>

        {/* ════════ COMBAT BLOCK ════════ */}
        <div className="px-3 pb-1.5">
          <CharacterCombatBlock character={character} />
        </div>

        {/* ════════ ABILITY SCORES ════════ */}
        <div className="px-3 pb-1.5">
          <CharacterAbilityBlock character={character} />
        </div>

        {/* ════════ SAVES + SKILLS ════════ */}
        <div className="px-3 pb-1.5">
          <CharacterSkillSummary character={character} />
        </div>

        {/* ════════ WEAPONS ════════ */}
        <div className="px-3 pb-1.5">
          <CharacterWeaponSummary character={character} />
        </div>

        {/* ════════ SPELLCASTING ════════ */}
        <div className="px-3 pb-1.5">
          <CharacterSpellSummary character={character} />
        </div>

        {/* ════════ RESOURCES ════════ */}
        <div className="px-3 pb-1.5">
          <CharacterResourcesSummary character={character} />
        </div>

        {/* ════════ EQUIPMENT ════════ */}
        <div className="px-3 pb-1.5">
          <CharacterEquipmentSummary character={character} />
        </div>

        {/* ════════ XP PROGRESS ════════ */}
        <div className="px-3 pb-3">
          <CharacterXpProgress character={character} />
        </div>

        {/* ── Action Overlay ── */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex gap-1">
          <ActionBtn icon="🎒" title="Inventory" onClick={(e) => { e.stopPropagation(); onOpenInventory(); }} />
          <ActionBtn icon="✏️" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(); }} />
          <ActionBtn icon="📤" title="Export" onClick={(e) => { e.stopPropagation(); onExport(); }} />
          <ActionBtn icon="🗑️" title="Remove" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="hover:bg-warrior-500/20 hover:text-warrior-400" />
        </div>

        {/* ── Hover glow ring ── */}
        <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-1 ring-accent-500/20" />
      </div>

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

/* ── Sub-component ──────────────────────────────────────────── */

function ActionBtn({ icon, title, onClick, className = "" }: {
  icon: string; title: string; onClick: (e: React.MouseEvent) => void; className?: string;
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
