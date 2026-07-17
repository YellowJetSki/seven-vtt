/* ── Campaign Creation Wizard ───────────────────────────────────
 * Multi-step wizard orchestrator:
 *   Step 1: Choose template (Arkla / Blank / Import)
 *   Step 2: Campaign details (name, description)
 *   Step 3: Species & classes allowed
 *   Step 4: Currency & rules
 *   Step 5: Review
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { createDemoCampaign } from "@/data/demoCampaign";
import { buildPcsFromArkla } from "@/lib/arklaPcBuilder";
import { CampaignWizardChoice } from "./CampaignWizardChoice";
import { CampaignWizardDetails } from "./CampaignWizardDetails";
import { CampaignWizardSpecies } from "./CampaignWizardSpecies";
import { CampaignWizardClassesCurrency } from "./CampaignWizardClassesCurrency";
import { CampaignWizardReview } from "./CampaignWizardReview";

/* ── Types ──────────────────────────────────────────────────── */

type WizardStep = "choice" | "details" | "species" | "classes_currency" | "review";

interface SpeciesOption {
  id: string;
  label: string;
  isHomebrew?: boolean;
}

interface CurrencyPreset {
  id: string;
  label: string;
  copperLabel: string;
  silverLabel: string;
  electrumLabel: string;
  goldLabel: string;
  platinumLabel: string;
}

interface CampaignWizardProps {
  onClose: () => void;
  onImport: () => void;
}

/* ── Data ───────────────────────────────────────────────────── */

const DEFAULT_RACES: SpeciesOption[] = [
  { id: "dragonborn", label: "Dragonborn" },
  { id: "dwarf", label: "Dwarf" },
  { id: "elf", label: "Elf" },
  { id: "gnome", label: "Gnome" },
  { id: "half-elf", label: "Half-Elf" },
  { id: "half-orc", label: "Half-Orc" },
  { id: "halfling", label: "Halfling" },
  { id: "human", label: "Human" },
  { id: "tiefling", label: "Tiefling" },
];

const DEFAULT_CLASSES: SpeciesOption[] = [
  { id: "barbarian", label: "Barbarian" },
  { id: "bard", label: "Bard" },
  { id: "cleric", label: "Cleric" },
  { id: "druid", label: "Druid" },
  { id: "fighter", label: "Fighter" },
  { id: "monk", label: "Monk" },
  { id: "paladin", label: "Paladin" },
  { id: "ranger", label: "Ranger" },
  { id: "rogue", label: "Rogue" },
  { id: "sorcerer", label: "Sorcerer" },
  { id: "warlock", label: "Warlock" },
  { id: "wizard", label: "Wizard" },
];

const CURRENCY_PRESETS: CurrencyPreset[] = [
  { id: "standard", label: "Standard (pp/gp/sp/cp)", copperLabel: "Copper", silverLabel: "Silver", electrumLabel: "Electrum", goldLabel: "Gold", platinumLabel: "Platinum" },
  { id: "arks", label: "Arks Setting (Assarions/Quadrans)", copperLabel: "Leptons", silverLabel: "Assarions", electrumLabel: "Bronze Drakes", goldLabel: "Silver Drakes", platinumLabel: "Gold Crowns" },
  { id: "platinums", label: "Platinum Heavy (pp/gp)", copperLabel: "Copper", silverLabel: "Silver", electrumLabel: "Electrum", goldLabel: "Gold", platinumLabel: "Platinum" },
];

/* ── Component ──────────────────────────────────────────────── */

export function CampaignWizard({ onClose, onImport }: CampaignWizardProps) {
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const showToast = useUiStore((s) => s.showToast);

  const [step, setStep] = useState<WizardStep>("choice");
  const [useArklaTemplate, setUseArklaTemplate] = useState(false);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const [selectedRaces, setSelectedRaces] = useState<Set<string>>(new Set(DEFAULT_RACES.map((r) => r.id)));
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set(DEFAULT_CLASSES.map((c) => c.id)));
  const [customRaces, setCustomRaces] = useState<SpeciesOption[]>([]);
  const [customClasses, setCustomClasses] = useState<SpeciesOption[]>([]);

  const [currencyPreset, setCurrencyPreset] = useState(CURRENCY_PRESETS[0]);

  /* ── Toggle helpers ── */
  const toggleRace = useCallback((id: string) => {
    setSelectedRaces((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleClass = useCallback((id: string) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const addCustomRace = useCallback((label: string) => {
    const id = `custom_race_${Date.now()}`;
    setCustomRaces((prev) => [...prev, { id, label }]);
    setSelectedRaces((prev) => new Set(prev).add(id));
  }, []);

  const addCustomClass = useCallback((label: string) => {
    const id = `custom_class_${Date.now()}`;
    setCustomClasses((prev) => [...prev, { id, label }]);
    setSelectedClasses((prev) => new Set(prev).add(id));
  }, []);

  const handleSelectTemplate = useCallback((useArkla: boolean) => {
    setUseArklaTemplate(useArkla);
    if (useArkla) setCurrencyPreset(CURRENCY_PRESETS[1]);
    else setCurrencyPreset(CURRENCY_PRESETS[0]);
    setStep("details");
  }, []);

  /* ── Build settings from wizard state ── */
  const buildSettings = useCallback(() => ({
    homebrewRules: [] as string[],
    experienceSystem: "xp" as const,
    currencyName: currencyPreset.goldLabel,
    privateDmNotes: "",
    allowedRaces: Array.from(selectedRaces).map((id) => {
      const found = [...DEFAULT_RACES, ...customRaces].find((r) => r.id === id);
      return found?.label ?? id;
    }),
    allowedClasses: Array.from(selectedClasses).map((id) => {
      const found = [...DEFAULT_CLASSES, ...customClasses].find((c) => c.id === id);
      return found?.label ?? id;
    }),
    currencyPreset: {
      copperLabel: currencyPreset.copperLabel,
      silverLabel: currencyPreset.silverLabel,
      electrumLabel: currencyPreset.electrumLabel,
      goldLabel: currencyPreset.goldLabel,
      platinumLabel: currencyPreset.platinumLabel,
    },
  }), [selectedRaces, selectedClasses, customRaces, customClasses, currencyPreset]);

  const createBlankCampaign = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const campaign = createDemoCampaign();
    campaign.name = trimmed;
    campaign.description = desc.trim() || campaign.description;
    (campaign as any).settings = { ...campaign.settings, ...buildSettings() };
    setCampaign(campaign);
    showToast({ message: `Campaign "${trimmed}" created!`, type: "success" });
    onClose();
  }, [name, desc, buildSettings, setCampaign, showToast, onClose]);

  const handleCreateCampaign = useCallback(async () => {
    if (!name.trim()) return;

    if (useArklaTemplate) {
      try {
        const resp = await fetch("/arkla.json");
        if (!resp.ok) throw new Error("Failed to fetch Arkla template");
        const arklaData = await resp.json();
        const campaign = {
          id: `camp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: name.trim(),
          description: desc.trim() || "The Obelisks of Arkla — a world of mystery and adventure.",
          dmName: "Dungeon Master",
          playerCharacters: buildPcsFromArkla(arklaData.characters),
          encounters: [],
          battleMaps: [],
          journal: [],
          settings: buildSettings(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setCampaign(campaign as any);
        showToast({ message: `"${name.trim()}" created from Arkla template!`, type: "success" });
        onClose();
      } catch {
        showToast({ message: "Failed to load Arkla template. Creating blank campaign instead.", type: "error" });
        createBlankCampaign();
      }
    } else {
      createBlankCampaign();
    }
  }, [name, desc, useArklaTemplate, buildSettings, setCampaign, showToast, onClose, createBlankCampaign]);

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-xl animate-in slide-in-from-top-3 fade-in duration-200">
      {step === "choice" && (
        <CampaignWizardChoice
          onSelectTemplate={handleSelectTemplate}
          onImport={onImport}
          onCancel={onClose}
        />
      )}
      {step === "details" && (
        <CampaignWizardDetails
          name={name}
          description={desc}
          useArklaTemplate={useArklaTemplate}
          onNameChange={setName}
          onDescriptionChange={setDesc}
          onBack={() => setStep("choice")}
          onNext={() => setStep("species")}
        />
      )}
      {step === "species" && (
        <CampaignWizardSpecies
          selectedRaces={selectedRaces}
          customRaces={customRaces}
          onToggleRace={toggleRace}
          onAddCustomRace={addCustomRace}
          onBack={() => setStep("details")}
          onNext={() => setStep("classes_currency")}
        />
      )}
      {step === "classes_currency" && (
        <CampaignWizardClassesCurrency
          selectedClasses={selectedClasses}
          customClasses={customClasses}
          currencyPreset={currencyPreset}
          currencyPresets={CURRENCY_PRESETS}
          onToggleClass={toggleClass}
          onAddCustomClass={addCustomClass}
          onCurrencyChange={setCurrencyPreset}
          onBack={() => setStep("species")}
          onNext={() => setStep("review")}
        />
      )}
      {step === "review" && (
        <CampaignWizardReview
          name={name}
          useArklaTemplate={useArklaTemplate}
          currencyPreset={currencyPreset}
          selectedRaces={selectedRaces}
          selectedClasses={selectedClasses}
          defaultRaces={DEFAULT_RACES}
          defaultClasses={DEFAULT_CLASSES}
          customRaces={customRaces}
          customClasses={customClasses}
          onBack={() => setStep("classes_currency")}
          onCreate={handleCreateCampaign}
        />
      )}
    </div>
  );
}
