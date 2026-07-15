/* ── Campaign Creation Wizard ───────────────────────────────────
 * Multi-step wizard for creating a new campaign:
 *   Step 1: Choose template (Arkla / Blank / Import)
 *   Step 2: Campaign details (name, description)
 *   Step 3: Species & classes allowed
 *   Step 4: Currency & rules
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { createDemoCampaign } from "@/data/demoCampaign";
import { Button } from "@/components/ui/Button";

/* ── Types ──────────────────────────────────────────────────── */

type WizardStep = "choice" | "details" | "species" | "classes_currency" | "review";

/* ── D&D 5e defaults ────────────────────────────────────────── */

const DEFAULT_RACES = [
  { id: "dragonborn", label: "Dragonborn", isHomebrew: false },
  { id: "dwarf",      label: "Dwarf",      isHomebrew: false },
  { id: "elf",        label: "Elf",         isHomebrew: false },
  { id: "gnome",      label: "Gnome",       isHomebrew: false },
  { id: "half-elf",   label: "Half-Elf",    isHomebrew: false },
  { id: "half-orc",   label: "Half-Orc",    isHomebrew: false },
  { id: "halfling",   label: "Halfling",    isHomebrew: false },
  { id: "human",      label: "Human",       isHomebrew: false },
  { id: "tiefling",   label: "Tiefling",    isHomebrew: false },
];

const DEFAULT_CLASSES = [
  { id: "barbarian", label: "Barbarian", isHomebrew: false },
  { id: "bard",      label: "Bard",      isHomebrew: false },
  { id: "cleric",    label: "Cleric",    isHomebrew: false },
  { id: "druid",     label: "Druid",     isHomebrew: false },
  { id: "fighter",   label: "Fighter",   isHomebrew: false },
  { id: "monk",      label: "Monk",      isHomebrew: false },
  { id: "paladin",   label: "Paladin",   isHomebrew: false },
  { id: "ranger",    label: "Ranger",    isHomebrew: false },
  { id: "rogue",     label: "Rogue",     isHomebrew: false },
  { id: "sorcerer",  label: "Sorcerer",  isHomebrew: false },
  { id: "warlock",   label: "Warlock",   isHomebrew: false },
  { id: "wizard",    label: "Wizard",    isHomebrew: false },
];

/* ── Currency presets ────────────────────────────────────────── */

const CURRENCY_PRESETS = [
  { id: "standard", label: "Standard (pp/gp/sp/cp)", copperLabel: "Copper", silverLabel: "Silver", electrumLabel: "Electrum", goldLabel: "Gold", platinumLabel: "Platinum" },
  { id: "arks",     label: "Arks Setting (Assarions/Quadrans)", copperLabel: "Leptons", silverLabel: "Assarions", electrumLabel: "Bronze Drakes", goldLabel: "Silver Drakes", platinumLabel: "Gold Crowns" },
  { id: "platinums",label: "Platinum Heavy (pp/gp)", copperLabel: "Copper", silverLabel: "Silver", electrumLabel: "Electrum", goldLabel: "Gold", platinumLabel: "Platinum" },
];

interface CampaignWizardProps {
  onClose: () => void;
  onImport: () => void;
}

export function CampaignWizard({ onClose, onImport }: CampaignWizardProps) {
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const showToast = useUiStore((s) => s.showToast);

  /* ── Wizard state ── */
  const [step, setStep] = useState<WizardStep>("choice");
  const [useArklaTemplate, setUseArklaTemplate] = useState(false);

  /* ── Campaign metadata ── */
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  /* ── Allowed species/classes (toggled) ── */
  const [selectedRaces, setSelectedRaces] = useState<Set<string>>(new Set(DEFAULT_RACES.map(r => r.id)));
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set(DEFAULT_CLASSES.map(c => c.id)));
  const [customRaces, setCustomRaces] = useState<{ id: string; label: string }[]>([]);
  const [customClasses, setCustomClasses] = useState<{ id: string; label: string }[]>([]);
  const [newRaceName, setNewRaceName] = useState("");
  const [newClassName, setNewClassName] = useState("");

  /* ── Currency ── */
  const [currencyPreset, setCurrencyPreset] = useState(CURRENCY_PRESETS[0]);

  /* ── Toggle helpers ── */
  const toggleRace = useCallback((id: string) => {
    setSelectedRaces(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleClass = useCallback((id: string) => {
    setSelectedClasses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const addCustomRace = useCallback(() => {
    const trimmed = newRaceName.trim();
    if (!trimmed) return;
    const id = `custom_race_${Date.now()}`;
    setCustomRaces(prev => [...prev, { id, label: trimmed }]);
    setSelectedRaces(prev => new Set(prev).add(id));
    setNewRaceName("");
  }, [newRaceName]);

  const addCustomClass = useCallback(() => {
    const trimmed = newClassName.trim();
    if (!trimmed) return;
    const id = `custom_class_${Date.now()}`;
    setCustomClasses(prev => [...prev, { id, label: trimmed }]);
    setSelectedClasses(prev => new Set(prev).add(id));
    setNewClassName("");
  }, [newClassName]);

  /* ── Create campaign ── */
  const handleCreateCampaign = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (useArklaTemplate) {
      // Fetch the Arkla template JSON from public folder
      try {
        const resp = await fetch("/arkla.json");
        if (!resp.ok) throw new Error("Failed to fetch Arkla template");
        const arklaData = await resp.json();

        // Build campaign from Arkla template
        const campaign = {
          id: `camp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: trimmed,
          description: desc.trim() || "The Obelisks of Arkla — a world of mystery and adventure.",
          dmName: "Dungeon Master",
          playerCharacters: buildPcsFromArkla(arklaData.characters),
          encounters: [],
          battleMaps: [],
          journal: [],
          settings: {
            homebrewRules: [] as string[],
            experienceSystem: "xp" as const,
            currencyName: currencyPreset.goldLabel,
            privateDmNotes: "",
            allowedRaces: Array.from(selectedRaces).map(id => {
              const found = [...DEFAULT_RACES, ...customRaces].find(r => r.id === id);
              return found?.label ?? id;
            }),
            allowedClasses: Array.from(selectedClasses).map(id => {
              const found = [...DEFAULT_CLASSES, ...customClasses].find(c => c.id === id);
              return found?.label ?? id;
            }),
            currencyPreset: {
              copperLabel: currencyPreset.copperLabel,
              silverLabel: currencyPreset.silverLabel,
              electrumLabel: currencyPreset.electrumLabel,
              goldLabel: currencyPreset.goldLabel,
              platinumLabel: currencyPreset.platinumLabel,
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        setCampaign(campaign as any);
        showToast({ message: `"${trimmed}" created from Arkla template!`, type: "success" });
        onClose();
      } catch {
        showToast({ message: "Failed to load Arkla template. Creating blank campaign instead.", type: "error" });
        createBlankCampaign();
      }
    } else {
      createBlankCampaign();
    }
  }, [name, desc, useArklaTemplate, selectedRaces, selectedClasses, customRaces, customClasses, currencyPreset, setCampaign, showToast, onClose]);

  const createBlankCampaign = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const campaign = createDemoCampaign();
    campaign.name = trimmed;
    campaign.description = desc.trim() || campaign.description;
    campaign.settings.currencyName = currencyPreset.goldLabel;
    (campaign.settings as any).allowedRaces = Array.from(selectedRaces).map(id => {
      const found = [...DEFAULT_RACES, ...customRaces].find(r => r.id === id);
      return found?.label ?? id;
    });
    (campaign.settings as any).allowedClasses = Array.from(selectedClasses).map(id => {
      const found = [...DEFAULT_CLASSES, ...customClasses].find(c => c.id === id);
      return found?.label ?? id;
    });
    (campaign.settings as any).currencyPreset = {
      copperLabel: currencyPreset.copperLabel,
      silverLabel: currencyPreset.silverLabel,
      electrumLabel: currencyPreset.electrumLabel,
      goldLabel: currencyPreset.goldLabel,
      platinumLabel: currencyPreset.platinumLabel,
    };

    setCampaign(campaign);
    showToast({ message: `Campaign "${trimmed}" created!`, type: "success" });
    onClose();
  }, [name, desc, selectedRaces, selectedClasses, customRaces, customClasses, currencyPreset, setCampaign, showToast, onClose]);

  /* ── Render helpers ── */

  const renderChoice = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-surface-100">Create a New Campaign</h3>
      <p className="text-sm text-surface-400">Choose how to get started:</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => { setUseArklaTemplate(true); setStep("details"); }}
          className="rounded-xl border-2 border-accent-500/30 bg-accent-500/5 p-5 text-left transition-all hover:border-accent-500/60 hover:bg-accent-500/10 hover:-translate-y-0.5"
        >
          <span className="text-3xl">🏛️</span>
          <p className="mt-2 font-semibold text-surface-100">Arkla Template</p>
          <p className="mt-1 text-xs text-surface-400">Pre-populated with 4 starter PCs, custom species & classes, and the Assarions currency system</p>
        </button>
        <button
          onClick={() => { setUseArklaTemplate(false); setStep("details"); }}
          className="rounded-xl border-2 border-dashed border-surface-600 bg-surface-800 p-5 text-left transition-all hover:border-mage-500/40 hover:bg-surface-700 hover:-translate-y-0.5"
        >
          <span className="text-3xl">✨</span>
          <p className="mt-2 font-semibold text-surface-100">Blank Campaign</p>
          <p className="mt-1 text-xs text-surface-400">Start from scratch — configure species, classes, currency, and rules yourself</p>
        </button>
      </div>
      <div className="border-t border-surface-700 pt-4">
        <button onClick={onImport} className="w-full rounded-lg border border-dashed border-surface-600 bg-surface-800 p-4 text-center transition-all hover:border-mage-500/40 hover:bg-surface-700">
          <span className="text-lg">📥</span>
          <span className="ml-2 text-sm font-medium text-surface-200">Import Campaign from JSON</span>
        </button>
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-surface-100">{useArklaTemplate ? "Name Your Arkla Campaign" : "New Campaign Details"}</h3>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Campaign Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. The Obelisks of Arkla"
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
          autoFocus
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Description (optional)</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={3}
          placeholder={useArklaTemplate ? "A world of floating islands, ancient obelisks, and lost Kolari magic..." : "A brief synopsis of your campaign..."}
          className="w-full resize-none rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
        />
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={() => setStep("choice")}>← Back</Button>
        <Button size="sm" onClick={() => setStep("species")} disabled={!name.trim()}>Next: Species →</Button>
      </div>
    </div>
  );

  const renderSpecies = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-surface-100">Allowed Species</h3>
      <p className="text-sm text-surface-400">Select which species players can choose from:</p>
      <div className="flex flex-wrap gap-2">
        {DEFAULT_RACES.map((race) => (
          <button
            key={race.id}
            onClick={() => toggleRace(race.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              selectedRaces.has(race.id)
                ? "bg-accent-500/20 text-accent-300 ring-1 ring-accent-500"
                : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-300"
            }`}
          >
            {race.label}
          </button>
        ))}
        {customRaces.map((race) => (
          <button
            key={race.id}
            onClick={() => toggleRace(race.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              selectedRaces.has(race.id)
                ? "bg-mage-500/20 text-mage-300 ring-1 ring-mage-500"
                : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-300"
            }`}
          >
            ✦ {race.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={newRaceName}
          onChange={(e) => setNewRaceName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustomRace()}
          placeholder="Add custom species..."
          className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
        />
        <Button size="xs" onClick={addCustomRace} disabled={!newRaceName.trim()}>+ Add</Button>
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={() => setStep("details")}>← Back</Button>
        <Button size="sm" onClick={() => setStep("classes_currency")}>Next: Classes & Currency →</Button>
      </div>
    </div>
  );

  const renderClassesCurrency = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-surface-100">Allowed Classes</h3>
        <p className="text-sm text-surface-400">Select which classes players can choose from:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEFAULT_CLASSES.map((cls) => (
            <button
              key={cls.id}
              onClick={() => toggleClass(cls.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                selectedClasses.has(cls.id)
                  ? "bg-accent-500/20 text-accent-300 ring-1 ring-accent-500"
                  : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-300"
              }`}
            >
              {cls.label}
            </button>
          ))}
          {customClasses.map((cls) => (
            <button
              key={cls.id}
              onClick={() => toggleClass(cls.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                selectedClasses.has(cls.id)
                  ? "bg-mage-500/20 text-mage-300 ring-1 ring-mage-500"
                  : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-300"
              }`}
            >
              ✦ {cls.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomClass()}
            placeholder="Add custom class..."
            className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
          />
          <Button size="xs" onClick={addCustomClass} disabled={!newClassName.trim()}>+ Add</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-surface-100">Currency System</h3>
        <p className="text-sm text-surface-400">Choose the currency naming for your world:</p>
        <div className="mt-2 space-y-2">
          {CURRENCY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setCurrencyPreset(preset)}
              className={`w-full rounded-lg border p-3 text-left transition-all ${
                currencyPreset.id === preset.id
                  ? "border-accent-500/50 bg-accent-500/10"
                  : "border-surface-700 bg-surface-800 hover:border-surface-600"
              }`}
            >
              <p className="text-sm font-medium text-surface-200">{preset.label}</p>
              <p className="mt-0.5 text-[11px] text-surface-500">
                cp: {preset.copperLabel} · sp: {preset.silverLabel} · ep: {preset.electrumLabel} · gp: {preset.goldLabel} · pp: {preset.platinumLabel}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={() => setStep("species")}>← Back</Button>
        <Button size="sm" onClick={() => setStep("review")}>Next: Review →</Button>
      </div>
    </div>
  );

  const renderReview = () => {
    const raceNames = Array.from(selectedRaces).map(id => {
      const found = [...DEFAULT_RACES, ...customRaces].find(r => r.id === id);
      return found?.label ?? id;
    });
    const classNames = Array.from(selectedClasses).map(id => {
      const found = [...DEFAULT_CLASSES, ...customClasses].find(c => c.id === id);
      return found?.label ?? id;
    });

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-surface-100">Review Your Campaign</h3>
        <div className="rounded-lg border border-surface-700 bg-surface-800 p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-xs text-surface-400">Name</span>
            <span className="text-sm font-medium text-surface-200">{name || "Unnamed"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-surface-400">Template</span>
            <span className="text-sm font-medium text-surface-200">{useArklaTemplate ? "🏛️ Arkla (pre-populated)" : "✨ Blank"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-surface-400">Currency</span>
            <span className="text-sm font-medium text-surface-200">{currencyPreset.label}</span>
          </div>
          <div>
            <span className="text-xs text-surface-400">Allowed Species ({raceNames.length})</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {raceNames.map(r => (
                <span key={r} className="rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] text-accent-300">{r}</span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-surface-400">Allowed Classes ({classNames.length})</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {classNames.map(c => (
                <span key={c} className="rounded-full bg-mage-500/10 px-2 py-0.5 text-[10px] text-mage-300">{c}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <Button variant="ghost" size="sm" onClick={() => setStep("classes_currency")}>← Back</Button>
          <Button size="sm" onClick={handleCreateCampaign}>✨ Create Campaign</Button>
        </div>
      </div>
    );
  };

  /* ── Main render ── */

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-xl animate-in slide-in-from-top-3 fade-in duration-200">
      {step === "choice" && renderChoice()}
      {step === "details" && renderDetails()}
      {step === "species" && renderSpecies()}
      {step === "classes_currency" && renderClassesCurrency()}
      {step === "review" && renderReview()}
    </div>
  );
}

/* ── Arkla JSON → PlayerCharacter converter ────────────────── */

function buildPcsFromArkla(characters: Record<string, any>): any[] {
  return Object.entries(characters).map(([id, raw]: [string, any]) => {
    const s = raw.stats || {};
    const speedVal = raw.speed ?? 30;
    const hp = raw.hitPoints || { current: raw.maxHp ?? 10, max: raw.maxHp ?? 10, temporary: 0 };
    const inv = (raw.inventory || []).map((item: any) => ({
      name: item.name || "Unknown Item",
      quantity: item.quantity ?? 1,
      weight: 0,
      description: item.desc || "",
      isEquipped: false,
    }));

    return {
      id: `pc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: raw.name || raw.label || "Unknown Hero",
      playerName: raw.playerName || "",
      race: raw.species || raw.race || "Unknown",
      class: raw.class || "Unknown",
      subClass: raw.subClass || "",
      level: raw.level || 1,
      experiencePoints: raw.experiencePoints || 0,
      background: raw.background || "",
      alignment: raw.alignment || "Neutral",
      inspiration: raw.inspiration ?? false,
      strength: s.STR ?? 10,
      dexterity: s.DEX ?? 10,
      constitution: s.CON ?? 10,
      intelligence: s.INT ?? 10,
      wisdom: s.WIS ?? 10,
      charisma: s.CHA ?? 10,
      savingThrows: {
        strength: { proficient: false, bonus: Math.floor(((s.STR ?? 10) - 10) / 2) },
        dexterity: { proficient: false, bonus: Math.floor(((s.DEX ?? 10) - 10) / 2) },
        constitution: { proficient: false, bonus: Math.floor(((s.CON ?? 10) - 10) / 2) },
        intelligence: { proficient: false, bonus: Math.floor(((s.INT ?? 10) - 10) / 2) },
        wisdom: { proficient: false, bonus: Math.floor(((s.WIS ?? 10) - 10) / 2) },
        charisma: { proficient: false, bonus: Math.floor(((s.CHA ?? 10) - 10) / 2) },
      },
      skills: Object.fromEntries(
        ['acrobatics','animalHandling','arcana','athletics','deception','history',
         'insight','intimidation','investigation','medicine','nature','perception',
         'performance','persuasion','religion','sleightOfHand','stealth','survival']
          .map(k => [k, 'none'])
      ),
      hitPoints: typeof hp === 'number' ? { current: hp, max: hp, temporary: 0 } : hp,
      armorClass: raw.ac ?? raw.armorClass ?? 10,
      initiative: raw.initiative ?? Math.floor(((s.DEX ?? 10) - 10) / 2),
      speed: typeof speedVal === 'number' ? { walk: speedVal } : speedVal,
      hitDice: raw.hitDice?.type ? `${raw.hitDice.max || 1}${raw.hitDice.type}` : "1d8",
      proficiencyBonus: raw.proficiencyBonus ?? 2,
      conditions: raw.conditions || [],
      deathSaves: raw.deathSaves || { successes: 0, failures: 0 },
      temporaryHitPoints: raw.temporaryHitPoints ?? 0,
      traits: [],
      proficiencies: [],
      languages: raw.languages || [],
      features: (raw.features || []).map((f: any) => ({
        name: f.name || "Feature",
        description: f.desc || "",
        source: f.source || "",
      })),
      equipment: [],
      inventory: inv,
      currency: raw.currency
        ? {
            copper: raw.currency.leptons ?? raw.currency.copper ?? 0,
            silver: raw.currency.assarions ?? raw.currency.silver ?? 0,
            electrum: raw.currency.bronzeDrakes ?? raw.currency.electrum ?? 0,
            gold: raw.currency.silverDrakes ?? raw.currency.gold ?? 0,
            platinum: raw.currency.goldCrowns ?? raw.currency.platinum ?? 0,
          }
        : { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
      appearance: raw.appearance || "",
      backstory: raw.backstory || "",
      allies: raw.allies || "",
      characterNotes: raw.notes || "",
      personalityTraits: raw.personalityTraits || "",
      ideals: raw.ideals || "",
      bonds: raw.bonds || "",
      flaws: raw.flaws || "",
      imageUrl: raw.imageUrl || "",
      isHomebrew: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });
}
