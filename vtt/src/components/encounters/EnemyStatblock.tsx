/**
 * STᚱ VTT — Enemy Statblock (Full 5e-Style Display)
 *
 * Complete D&D 5e monster statblock following the official format.
 * Supports read-only display and inline editing.
 *
 * Section order (official):
 *   Name, Size/Type/Alignment
 *   Armor Class, Hit Points, Speed
 *   STR/DEX/CON/INT/WIS/CHA
 *   Saving Throws, Skills
 *   Damage Resistances, Immunities
 *   Condition Immunities, Senses, Languages, CR
 *   Traits, Actions, Reactions, Legendary Actions
 */

import { useState, useCallback, useMemo } from "react";
import type { EnemyDoc, CreatureType, CreatureSize } from "@/types";

interface EnemyStatblockProps {
  enemy: EnemyDoc;
  onSave: (updated: EnemyDoc) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const CREATURE_TYPES: CreatureType[] = [
  "Aberration", "Beast", "Celestial", "Construct", "Dragon",
  "Elemental", "Fey", "Fiend", "Giant", "Humanoid",
  "Monstrosity", "Ooze", "Plant", "Undead", "Custom",
];

const SIZES: CreatureSize[] = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];

// ── Ability Modifier ──
function getMod(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function getModNumber(score: number): number {
  return Math.floor((score - 10) / 2);
}

// ── CR display ──
function formatCr(cr: number): string {
  if (cr === 0) return "0";
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}

// ── CR XP table ──
function crToXp(cr: number): string {
  const xpMap: Record<number, number> = {
    0: 10, 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700,
    4: 1100, 5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
    11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000, 16: 15000,
    17: 18000, 18: 20000, 19: 22000, 20: 25000, 21: 33000, 22: 41000,
    23: 50000, 24: 62000, 25: 75000, 26: 90000, 27: 105000,
    28: 120000, 29: 135000, 30: 155000,
  };
  const xp = xpMap[cr] || 0;
  return xp.toLocaleString();
}

const ABILITY_LABELS: (keyof EnemyDoc["abilities"])[] = [
  "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma",
];

const ABILITY_SHORT = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

export default function EnemyStatblock({ enemy, onSave, onDelete, onClose }: EnemyStatblockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState<EnemyDoc>({ ...enemy });
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleSave = useCallback(() => {
    onSave({ ...edited, updatedAt: Date.now() });
    setIsEditing(false);
  }, [edited, onSave]);

  const handleDelete = useCallback(() => {
    onDelete(enemy.id);
    onClose();
  }, [enemy.id, onDelete, onClose]);

  // Proficiency bonus by CR
  const profBonus = useMemo(() => {
    if (enemy.challengeRating <= 4) return 2;
    if (enemy.challengeRating <= 8) return 3;
    if (enemy.challengeRating <= 12) return 4;
    if (enemy.challengeRating <= 16) return 5;
    if (enemy.challengeRating <= 20) return 6;
    return 7;
  }, [enemy.challengeRating]);

  const passivePerception = useMemo(() => {
    const wisMod = getModNumber(enemy.abilities.wisdom);
    const prof = enemy.skills.perception ? profBonus : 0;
    return 10 + wisMod + prof;
  }, [enemy.abilities.wisdom, enemy.skills.perception, profBonus]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="glass-gold rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden border border-gold/10 shadow-2xl shadow-gold-500/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
        <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
        <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
        <div className="corner-ornament corner-br corner-gold corner-gold-glow" />

        {/* ── Header ── */}
        <div className="shrink-0 px-5 py-3 border-b border-gold/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">👾</span>
              <div>
                <h2 className="text-base font-black text-gold tracking-tight">{enemy.name}</h2>
                <p className="text-[10px] text-surface-500">
                  {enemy.size} {enemy.type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-500 hover:text-gold-400 hover:bg-gold-500/10 active:scale-90 transition-all text-[11px]"
                >
                  ✏
                </button>
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="overflow-y-auto p-5 space-y-4 text-[11px] leading-relaxed">
          {isEditing ? (
            <EditView
              edited={edited}
              setEdited={setEdited}
            />
          ) : (
            <ReadView
              enemy={enemy}
              profBonus={profBonus}
              passivePerception={passivePerception}
            />
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-5 py-3 border-t border-gold/10 flex items-center justify-between">
          {isEditing ? (
            <div className="flex gap-2 w-full">
              <button
                onClick={() => { setEdited({ ...enemy }); setIsEditing(false); }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-white/[0.12] active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="ml-auto px-4 py-1.5 rounded-lg text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all"
              >
                💾 Save Changes
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-lg text-[10px] border border-red-500/15 text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
              >
                🗑 Delete
              </button>
              {deleteConfirm && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-red-500/20">
                  <span className="text-[9px] text-red-400/70">Confirm?</span>
                  <button
                    onClick={handleDelete}
                    className="px-2 py-1 rounded-lg text-[9px] font-bold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 active:scale-95 transition-all"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-2 py-1 rounded-lg text-[9px] text-surface-500 hover:text-surface-300 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Read View ──
function ReadView({ enemy, profBonus, passivePerception }: { enemy: EnemyDoc; profBonus: number; passivePerception: number }) {
  return (
    <>
      {/* AC / HP / Speed */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-gold-500/8 border border-gold/10 p-3 text-center">
          <div className="text-[9px] uppercase tracking-wider text-surface-500 mb-1">Armor Class</div>
          <div className="text-2xl font-black text-cyan-300">{enemy.armorClass}</div>
        </div>
        <div className="rounded-xl bg-gold-500/8 border border-gold/10 p-3 text-center">
          <div className="text-[9px] uppercase tracking-wider text-surface-500 mb-1">Hit Points</div>
          <div className="text-2xl font-black text-green-400">{enemy.hitPoints.max}</div>
        </div>
        <div className="rounded-xl bg-gold-500/8 border border-gold/10 p-3 text-center">
          <div className="text-[9px] uppercase tracking-wider text-surface-500 mb-1">Speed</div>
          <div className="text-2xl font-black text-surface-200">{enemy.speed}ft</div>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="rounded-xl bg-obsidian-mid/60 border border-white/[0.04] p-3">
        <div className="grid grid-cols-6 gap-1">
          {ABILITY_LABELS.map((abl, i) => (
            <div key={abl} className="text-center">
              <div className="text-[9px] uppercase font-bold text-surface-500">{ABILITY_SHORT[i]}</div>
              <div className="text-base font-black text-surface-200">{enemy.abilities[abl]}</div>
              <div className="text-[10px] text-surface-500">({getMod(enemy.abilities[abl])})</div>
            </div>
          ))}
        </div>
      </div>

      {/* Attacks (structured from EnemyCreator) */}
      {enemy.attacks && enemy.attacks.length > 0 && (
        <div className="rounded-xl bg-obsidian-mid/60 border border-white/[0.04] p-3">
          <div className="text-[9px] uppercase tracking-wider text-surface-600 font-bold mb-2">Attacks</div>
          <div className="space-y-1.5">
            {enemy.attacks.map((att) => (
              <div key={att.id} className="flex items-center gap-2 text-[10px]">
                <span className="text-surface-200 font-semibold">{att.name}</span>
                <span className="text-gold-400">+{att.attackBonus}</span>
                <span className="text-surface-500">{att.damageDice} {att.damageType}</span>
                <span className="text-surface-600">{att.range}</span>
                {att.properties.length > 0 && (
                  <span className="text-[8px] text-surface-600">
                    {att.properties.join(", ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CR / XP / PB */}
      <div className="flex items-center gap-3 text-[10px]">
        <span className="px-2 py-0.5 rounded bg-gold-500/10 border border-gold/15 text-gold-400 font-semibold">
          CR {formatCr(enemy.challengeRating)}
        </span>
        <span className="text-surface-500">{crToXp(enemy.challengeRating)} XP</span>
        <span className="text-surface-500">PB +{profBonus}</span>
        <span className="text-surface-500">PP {passivePerception}</span>
      </div>

      {/* Saving Throws */}
      {Object.keys(enemy.savingThrows).length > 0 && (
        <div>
          <span className="text-[9px] uppercase tracking-wider text-gold-500/60 font-bold">Saving Throws</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {Object.entries(enemy.savingThrows).map(([key, val]) => {
              if (val === undefined) return null;
              return (
              <span key={key} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-surface-300">
                {key.charAt(0).toUpperCase() + key.slice(1, 3)} {val >= 0 ? `+${val}` : val}
              </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Skills */}
      {Object.keys(enemy.skills).length > 0 && (
        <div>
          <span className="text-[9px] uppercase tracking-wider text-gold-500/60 font-bold">Skills</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {Object.entries(enemy.skills).map(([key, val]) => {
              if (val === undefined) return null;
              return (
              <span key={key} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-surface-300">
                {key.charAt(0).toUpperCase() + key.slice(1)} {val >= 0 ? `+${val}` : val}
              </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Damage Resistances / Immunities */}
      {enemy.damageResistances.length > 0 && (
        <div>
          <span className="text-[9px] uppercase tracking-wider text-amber-400/60 font-bold">Damage Resistances</span>
          <p className="text-[11px] text-surface-300 mt-0.5">{enemy.damageResistances.join(", ")}</p>
        </div>
      )}
      {enemy.damageImmunities.length > 0 && (
        <div>
          <span className="text-[9px] uppercase tracking-wider text-rose-400/60 font-bold">Damage Immunities</span>
          <p className="text-[11px] text-surface-300 mt-0.5">{enemy.damageImmunities.join(", ")}</p>
        </div>
      )}
      {enemy.conditionImmunities.length > 0 && (
        <div>
          <span className="text-[9px] uppercase tracking-wider text-surface-500 font-bold">Condition Immunities</span>
          <p className="text-[11px] text-surface-300 mt-0.5">{enemy.conditionImmunities.join(", ")}</p>
        </div>
      )}

      {/* Senses & Languages */}
      {enemy.senses && <div><span className="text-[9px] uppercase tracking-wider text-surface-500 font-bold">Senses</span><p className="text-[11px] text-surface-300 mt-0.5">{enemy.senses}</p></div>}
      {enemy.languages && <div><span className="text-[9px] uppercase tracking-wider text-surface-500 font-bold">Languages</span><p className="text-[11px] text-surface-300 mt-0.5">{enemy.languages}</p></div>}

      {/* Traits */}
      {enemy.traits && (
        <div>
          <h3 className="text-[9px] uppercase tracking-wider text-gold-500/60 font-bold mb-1">Traits</h3>
          <p className="text-[11px] text-surface-200 whitespace-pre-wrap leading-relaxed">{enemy.traits}</p>
        </div>
      )}

      {/* Actions */}
      {enemy.actions && (
        <div>
          <h3 className="text-[9px] uppercase tracking-wider text-gold-500/60 font-bold mb-1 border-b border-gold/10 pb-1">Actions</h3>
          <p className="text-[11px] text-surface-200 whitespace-pre-wrap leading-relaxed mt-1">{enemy.actions}</p>
        </div>
      )}

      {/* Reactions */}
      {enemy.reactions && (
        <div>
          <h3 className="text-[9px] uppercase tracking-wider text-gold-500/60 font-bold mb-1">Reactions</h3>
          <p className="text-[11px] text-surface-200 whitespace-pre-wrap leading-relaxed">{enemy.reactions}</p>
        </div>
      )}

      {/* Legendary Actions */}
      {enemy.legendaryActions && (
        <div>
          <h3 className="text-[9px] uppercase tracking-wider text-amber-400/60 font-bold mb-1">Legendary Actions</h3>
          <p className="text-[11px] text-surface-200 whitespace-pre-wrap leading-relaxed">{enemy.legendaryActions}</p>
        </div>
      )}
    </>
  );
}

// ── Edit View ──
function EditView({ edited, setEdited }: { edited: EnemyDoc; setEdited: (e: EnemyDoc) => void }) {
  const update = useCallback(<K extends keyof EnemyDoc>(key: K, value: EnemyDoc[K]) => {
    setEdited({ ...edited, [key]: value });
  }, [edited, setEdited]);

  const updateAbility = useCallback((key: keyof EnemyDoc["abilities"], value: number) => {
    setEdited({ ...edited, abilities: { ...edited.abilities, [key]: value } });
  }, [edited, setEdited]);

  const updateSave = useCallback((key: string, value: number) => {
    const saves = { ...edited.savingThrows };
    if (value === 0) delete saves[key];
    else saves[key] = value;
    setEdited({ ...edited, savingThrows: saves });
  }, [edited, setEdited]);

  const updateSkill = useCallback((key: string, value: number) => {
    const skills = { ...edited.skills };
    if (value === 0) delete skills[key];
    else skills[key] = value;
    setEdited({ ...edited, skills });
  }, [edited, setEdited]);

  return (
    <div className="space-y-3">
      {/* Row 1: Name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Name</label>
          <input value={edited.name} onChange={(e) => update("name", e.target.value)}
            className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[11px] text-surface-200 focus:outline-none focus:border-gold/25" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Type</label>
            <select value={edited.type} onChange={(e) => update("type", e.target.value as CreatureType)}
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[11px] text-surface-200 appearance-none cursor-pointer">
              {CREATURE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Size</label>
            <select value={edited.size} onChange={(e) => update("size", e.target.value as CreatureSize)}
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[11px] text-surface-200 appearance-none cursor-pointer">
              {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Row 2: AC / HP / Speed / CR */}
      <div className="grid grid-cols-4 gap-2">
        {(["armorClass", "challengeRating"] as const).map((key) => (
          <div key={key}>
            <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">
              {key === "armorClass" ? "AC" : "CR"}
            </label>
            <input type="number" value={edited[key]} min={1} max={30}
              onChange={(e) => update(key, Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[11px] text-surface-200 focus:outline-none focus:border-gold/25" />
          </div>
        ))}
        <div>
          <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">HP</label>
          <input type="number" value={edited.hitPoints.max} min={1}
            onChange={(e) => update("hitPoints", { ...edited.hitPoints, max: Math.max(1, parseInt(e.target.value) || 1), current: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[11px] text-surface-200 focus:outline-none focus:border-gold/25" />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Speed</label>
          <input type="number" value={edited.speed} min={0} max={120}
            onChange={(e) => update("speed", Math.max(0, parseInt(e.target.value) || 30))}
            className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[11px] text-surface-200 focus:outline-none focus:border-gold/25" />
        </div>
      </div>

      {/* Ability Scores */}
      <div>
        <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Ability Scores</label>
        <div className="grid grid-cols-6 gap-1.5">
          {ABILITY_LABELS.map((abl, i) => (
            <div key={abl} className="text-center">
              <div className="text-[8px] uppercase font-bold text-surface-500 mb-0.5">{ABILITY_SHORT[i]}</div>
              <input type="number" value={edited.abilities[abl]} min={1} max={30}
                onChange={(e) => updateAbility(abl, Math.max(1, Math.min(30, parseInt(e.target.value) || 10)))}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-1 py-1 text-center text-[11px] text-surface-200 focus:outline-none focus:border-gold/25" />
              <div className="text-[8px] text-surface-600 mt-0.5">{getMod(edited.abilities[abl])}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Saving Throws */}
      <div>
        <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Saving Throws (optional)</label>
        <div className="grid grid-cols-6 gap-1.5">
          {ABILITY_LABELS.map((abl) => (
            <input key={abl} type="number" value={(edited.savingThrows as any)[abl] ?? ""} placeholder="—"
              onChange={(e) => updateSave(abl, e.target.value ? parseInt(e.target.value) : 0)}
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-1 py-1 text-center text-[10px] text-surface-200 focus:outline-none focus:border-gold/25 placeholder:text-surface-700" />
          ))}
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Skills (optional)</label>
        <div className="grid grid-cols-4 gap-1.5">
          {["acrobatics", "athletics", "stealth", "perception", "arcana", "history", "religion", "insight", "intimidation", "investigation", "nature", "survival"].map((skill) => (
            <div key={skill} className="flex items-center gap-1">
              <span className="text-[8px] text-surface-500 w-10 text-right truncate">{skill}</span>
              <input type="number" value={(edited.skills as any)[skill] ?? ""} placeholder="—"
                onChange={(e) => updateSkill(skill, e.target.value ? parseInt(e.target.value) : 0)}
                className="flex-1 bg-[#07080d]/70 border border-white/[0.06] rounded px-1 py-0.5 text-center text-[9px] text-surface-200 focus:outline-none focus:border-gold/25 placeholder:text-surface-700" />
            </div>
          ))}
        </div>
      </div>

      {/* Text areas for traits, actions, etc. */}
      {(["traits", "actions", "reactions", "legendaryActions"] as const).map((field) => (
        <div key={field}>
          <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">{field}</label>
          <textarea value={(edited as any)[field] || ""} rows={3}
            onChange={(e) => update(field, e.target.value)}
            placeholder={`Describe ${field.toLowerCase()}...`}
            className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[10px] text-surface-200 focus:outline-none focus:border-gold/25 placeholder:text-surface-700 resize-y min-h-[48px]" />
        </div>
      ))}

      {/* Senses, Languages */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Senses</label>
          <input value={edited.senses || ""} onChange={(e) => update("senses", e.target.value)}
            placeholder="Darkvision 60ft, Passive Perception 12"
            className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[10px] text-surface-200 focus:outline-none focus:border-gold/25 placeholder:text-surface-700" />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Languages</label>
          <input value={edited.languages || ""} onChange={(e) => update("languages", e.target.value)}
            placeholder="Common, Goblin"
            className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[10px] text-surface-200 focus:outline-none focus:border-gold/25 placeholder:text-surface-700" />
        </div>
      </div>

      {/* Resistances / Immunities (comma-separated) */}
      <div className="grid grid-cols-3 gap-2">
        {(["damageResistances", "damageImmunities", "conditionImmunities"] as const).map((field) => (
          <div key={field}>
            <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">
              {field === "damageResistances" ? "Resistances" : field === "damageImmunities" ? "Immunities" : "Cond. Immunities"}
            </label>
            <input value={(edited as any)[field]?.join(", ") || ""}
              onChange={(e) => update(field, e.target.value ? e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) : [])}
              placeholder="fire, poison"
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1 text-[9px] text-surface-200 focus:outline-none focus:border-gold/25 placeholder:text-surface-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
