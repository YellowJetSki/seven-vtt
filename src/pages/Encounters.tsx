/* ── Premium Encounters & Combat Center ──────────────────────── */

import { useState } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useUiStore } from "@/stores/uiStore";
import { InitiativeTracker } from "@/components/combat/InitiativeTracker";
import { LiveSessionView } from "@/components/combat/LiveSessionView";
import { DmQuickReference } from "@/components/combat/DmQuickReference";
import { EncounterBuilder } from "@/components/combat/EncounterBuilder";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { Encounter } from "@/types";

type SubTab = "combat" | "session" | "reference" | "build";

export function Encounters() {
  const [subTab, setSubTab] = useState<SubTab>("combat");
  const campaign = useCampaignStore((s) => s.campaign);
  const addEncounter = useCampaignStore((s) => s.addEncounter);
  const updateEncounter = useCampaignStore((s) => s.updateEncounter);
  const removeEncounter = useCampaignStore((s) => s.removeEncounter);
  const setActiveEncounter = useCombatStore((s) => s.setActiveEncounter);
  const createEncounter = useCombatStore((s) => s.createEncounter);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const liveSession = useCombatStore((s) => s.liveSession);
  const showToast = useUiStore((s) => s.showToast);

  const [editingEncounter, setEditingEncounter] = useState<Encounter | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const encounters = campaign?.encounters ?? [];

  const handleSaveEncounter = (encounter: Encounter) => {
    const existing = encounters.find((e) => e.id === encounter.id);
    if (existing) {
      updateEncounter(encounter.id, encounter);
    } else {
      addEncounter(encounter);
    }
    setShowBuilder(false);
    setEditingEncounter(null);
  };

  const handleLoadIntoCombat = (encounter: Encounter) => {
    // Create a combat encounter from this campaign encounter
    const combatId = createEncounter(encounter.name);
    setActiveEncounter(combatId);
    setSubTab("combat");
    showToast({ message: `Loaded "${encounter.name}" into combat tracker.`, type: "success" });
  };

  const tabs: { id: SubTab; label: string; icon: string; badge?: string | number }[] = [
    { id: "combat", label: "Initiative", icon: "⚔️" },
    {
      id: "session",
      label: "Session",
      icon: "🎙️",
      badge: liveSession.sessionStartedAt ? "Live" : undefined,
    },
    { id: "reference", label: "Quick Ref", icon: "📖" },
    { id: "build", label: "Builder", icon: "⚒️", badge: encounters.length },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100 md:text-2xl">
            Combat Center
          </h2>
          <p className="mt-1 text-sm text-surface-400">
            Initiative tracking, encounter building, session management, and DM tools
          </p>
        </div>

        <div className="flex items-center gap-2">
          {liveSession.sessionStartedAt && (
            <div className="flex items-center gap-2 rounded-full bg-accent-500/10 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
              <span className="text-xs font-medium text-accent-400">Live</span>
            </div>
          )}
          <Button size="sm" onClick={() => { setEditingEncounter(null); setShowBuilder(true); }}>
            + New Encounter
          </Button>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-1 rounded-xl border border-surface-700 bg-surface-850 p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
              subTab === tab.id
                ? "bg-accent-500/15 text-accent-300 shadow-sm"
                : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-1 rounded-full bg-accent-500/20 px-2 py-0.5 text-[10px] font-bold text-accent-400">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {subTab === "combat" && (
        <div className="space-y-6">
          {/* Saved Encounters Quick List */}
          {encounters.length > 0 && !activeEncounter && (
            <section className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
                Saved Encounters
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {encounters.map((enc) => (
                  <div
                    key={enc.id}
                    className="flex items-center justify-between rounded-lg border border-surface-700 bg-surface-800 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-surface-200 truncate">{enc.name}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge size="xs" variant="neutral">
                          {enc.enemies.reduce((sum, e) => sum + e.count, 0)} enemies
                        </Badge>
                        {enc.difficulty && (
                          <Badge
                            size="xs"
                            variant={
                              enc.difficulty === "easy" ? "success" :
                              enc.difficulty === "medium" ? "warning" :
                              enc.difficulty === "hard" ? "danger" :
                              "danger"
                            }
                          >
                            {enc.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button size="xs" variant="ghost" onClick={() => handleLoadIntoCombat(enc)}>
                        Load
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => { setEditingEncounter(enc); setShowBuilder(true); }}>
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          <InitiativeTracker />
        </div>
      )}
      {subTab === "session" && <LiveSessionView />}
      {subTab === "reference" && <DmQuickReference />}
      {subTab === "build" && (
        <div className="rounded-xl border border-surface-700 bg-surface-850 p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-surface-400">
            Encounter Builder
          </h3>
          {encounters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-4xl text-surface-600">⚒️</span>
              <p className="mt-3 text-sm text-surface-500">
                No encounters yet. Build your first encounter!
              </p>
              <Button className="mt-4" size="sm" onClick={() => { setEditingEncounter(null); setShowBuilder(true); }}>
                + Build Encounter
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {encounters.map((enc) => (
                <div
                  key={enc.id}
                  className="flex items-center justify-between rounded-lg border border-surface-700 bg-surface-800 p-4 transition-colors hover:border-surface-600"
                >
                  <div>
                    <p className="font-medium text-surface-200">{enc.name}</p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {enc.enemies.reduce((sum, e) => sum + e.count, 0)} enemies
                      {enc.difficulty ? ` · ${enc.difficulty.charAt(0).toUpperCase() + enc.difficulty.slice(1)}` : ""}
                      {enc.environment ? ` · ${enc.environment}` : ""}
                    </p>
                    {enc.description && (
                      <p className="text-xs text-surface-500 mt-1 line-clamp-1">{enc.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <Button size="xs" variant="secondary" onClick={() => handleLoadIntoCombat(enc)}>
                      Load to Combat
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => { setEditingEncounter(enc); setShowBuilder(true); }}>
                      Edit
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => {
                      removeEncounter(enc.id);
                      showToast({ message: `Removed "${enc.name}"`, type: "info" });
                    }}>
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Encounter Builder Modal */}
      {showBuilder && (
        <Modal
          modalId="encounter-builder"
          title={editingEncounter ? `Edit: ${editingEncounter.name}` : "New Encounter"}
          size="xl"
        >
          <EncounterBuilder
            existingEncounter={editingEncounter ?? undefined}
            onSave={handleSaveEncounter}
            onCancel={() => { setShowBuilder(false); setEditingEncounter(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
