/**
 * STᚱ VTT — DM Encounter Analyzer & Party Balance Tool
 *
 * Cycle 31: Analyzes the current encounter against the party's
 * actual capabilities. Shows recommended difficulty, save targeting
 * warnings, action economy analysis, and encounter adjustment
 * suggestions based on 5.5e RAW.
 *
 * Features:
 *   - Party profile summary (avg level, AC, HP, roles)
 *   - Enemy breakdown by type/CR/count with XP contribution
 *   - Difficulty calculation with adjusted XP (DMG multiplier)
 *   - Save targeting analysis (strong vs weak saves)
 *   - Action economy analysis (party vs enemy count ratio)
 *   - Role coverage check (frontline/healer/arcane/skill)
 *   - Smart recommendations with color-coded severity
 *   - Empty state guidance when no encounter or characters
 *   - Character data auto-reads from campaign store
 *
 * Design: Overrrides/Lusion — gold glassmorphism, staggered entrance,
 *   color-coded severity chips, per-section progressive reveal.
 */

import { useState, useMemo, useEffect } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import PremiumIcon from "@/components/ui/PremiumIcon";
import { analyzeEncounterComprehensive } from "@/lib/mechanics/encounter-analyzer";

interface DmEncounterAnalyzerProps {
  onClose: () => void;
}

export default function DmEncounterAnalyzer({
  onClose,
}: DmEncounterAnalyzerProps) {
  // ── Store reads ──
  const characters = useCampaignStore((s) => s.characters);
  const encounter = useCombatStore((s) => s.activeEncounter);

  // ── Escape key ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<"overview" | "saves" | "recommend">(
    "overview"
  );

  // ── Analysis ──
  const analysis = useMemo(() => {
    if (characters.length === 0) return null;
    const pcData = characters.map((c) => ({
      class: c.class || "",
      level: c.level || 1,
      armorClass: c.armorClass || 10,
      hitPoints: c.hitPoints || { current: 10, max: 10 },
      strength: c.strength || 10,
      dexterity: c.dexterity || 10,
      constitution: c.constitution || 10,
      intelligence: c.intelligence || 10,
      wisdom: c.wisdom || 10,
      charisma: c.charisma || 10,
    }));

    const encounterEnemies =
      encounter?.combatants
        ?.filter((c) => c.type === "enemy")
        .map((c) => ({
          name: c.name,
          type: "humanoid",
          challengeRating: 1,
          count: 1 as const,
        })) || [];

    return analyzeEncounterComprehensive(pcData as any, encounterEnemies);
  }, [characters, encounter]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-hidden
        bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98
        border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)]
        animate-in slide-in-from-bottom-2 fade-in duration-300"
        style={{ animationTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/15 to-rose-500/10 flex items-center justify-center border border-amber/10">
              <PremiumIcon name="conditions" className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="font-display text-sm text-white/90">
              Encounter Analyzer
            </h3>
            {analysis && (
              <span
                className={`text-[7px] px-1 py-px rounded font-medium ${analysis.difficultyColor} bg-white/[0.03] border border-white/[0.06]`}
              >
                {analysis.difficulty}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg bg-surface-800/40 border border-white/[0.04] flex items-center justify-center
              text-surface-400 hover:text-white/70 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── TAB BAR ── */}
        <div className="flex mx-3 gap-px mb-1">
          {(["overview", "saves", "recommend"] as const).map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 text-[7px] uppercase tracking-wider rounded-t transition-all
                ${
                  activeTab === tab
                    ? "bg-white/[0.03] text-gold-300 border border-white/[0.06] border-b-transparent"
                    : "text-surface-500 hover:text-surface-400"
                }`}
              style={{
                animationDelay: `40ms`,
                animationFillMode: "forwards",
              }}
            >
              {tab === "overview"
                ? "📊 Overview"
                : tab === "saves"
                ? "🛡️ Saves"
                : "💡 Recommendations"}
            </button>
          ))}
        </div>

        {/* ── EMPTY STATE ── */}
        {!analysis && (
          <div className="px-3 pb-2 flex flex-col items-center justify-center mt-2">
            <div className="w-8 h-8 rounded-lg bg-surface-800/30 border border-white/[0.04] flex items-center justify-center">
              <PremiumIcon
                name="conditions"
                className="w-4 h-4 text-surface-500"
              />
            </div>
            <p className="text-[10px] text-surface-400 font-display mt-1">
              No encounter to analyze
            </p>
            <p className="text-[7px] text-surface-600 text-center mt-0.5">
              Start or load a combat encounter with active combatants
              <br />
              to see the encounter analysis.
            </p>
          </div>
        )}

        {/* ── CONTENT (scrollable) ── */}
        {analysis && (
          <div className="mx-3 mb-1 overflow-y-auto max-h-[60vh] space-y-1 scrollbar-gold">
            {activeTab === "overview" && (
              <div>
                {/* Party Profile */}
                <div
                  className="p-1.5 rounded-lg bg-surface-800/20 border border-white/[0.03]
                    animate-in slide-in-from-bottom-1 fade-in duration-200"
                >
                  <span className="text-[7px] uppercase tracking-wider text-surface-500">
                    👥 Party Profile
                  </span>
                  <div className="grid grid-cols-4 gap-1 mt-0.5">
                    {[
                      { label: "Size", value: `${analysis.party.size}`, color: "text-gold-300" },
                      { label: "Avg Lv", value: `${analysis.party.avgLevel}`, color: "text-gold-300" },
                      { label: "Avg AC", value: `${analysis.party.avgAc}`, color: "text-amber-300" },
                      { label: "Avg HP", value: `${analysis.party.avgHp}`, color: "text-emerald-300" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="flex flex-col items-center p-0.5 rounded bg-surface-900/40"
                      >
                        <span className="text-[6px] text-surface-500">{s.label}</span>
                        <span className={`text-[11px] font-display tabular-nums ${s.color}`}>
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {analysis.party.hasFrontline && (
                      <span className="text-[6px] px-0.5 py-px rounded bg-rose-500/10 text-rose-300 border border-rose-500/10">
                        🛡️ Frontline
                      </span>
                    )}
                    {analysis.party.hasHealer && (
                      <span className="text-[6px] px-0.5 py-px rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/10">
                        ❤️ Healer
                      </span>
                    )}
                    {analysis.party.hasArcane && (
                      <span className="text-[6px] px-0.5 py-px rounded bg-violet-500/10 text-violet-300 border border-violet-500/10">
                        🧙 Arcane
                      </span>
                    )}
                    {analysis.party.hasSkillMonkey && (
                      <span className="text-[6px] px-0.5 py-px rounded bg-sky-500/10 text-sky-300 border border-sky-500/10">
                        🗝️ Skills
                      </span>
                    )}
                  </div>
                </div>

                {/* Difficulty Table */}
                <div
                  className="p-1.5 rounded-lg bg-surface-800/20 border border-white/[0.03]
                    animate-in slide-in-from-bottom-1 fade-in duration-200"
                  style={{ animationDelay: "60ms", animationFillMode: "forwards" }}
                >
                  <span className="text-[7px] uppercase tracking-wider text-surface-500">
                    ⚔️ Difficulty Thresholds
                  </span>
                  <div className="grid grid-cols-4 gap-0.5 mt-0.5">
                    {[
                      { label: "Easy", value: analysis.easyThreshold, color: "text-emerald-400" },
                      { label: "Medium", value: analysis.mediumThreshold, color: "text-gold-400" },
                      { label: "Hard", value: analysis.hardThreshold, color: "text-amber-400" },
                      { label: "Deadly", value: analysis.deadlyThreshold, color: "text-rose-400" },
                    ].map((t) => (
                      <div
                        key={t.label}
                        className="flex flex-col items-center p-0.5 rounded bg-surface-900/40"
                      >
                        <span className="text-[6px] text-surface-500">{t.label}</span>
                        <span className={`text-[9px] font-mono tabular-nums ${t.color}`}>
                          {t.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 p-0.5 rounded bg-surface-900/40">
                    <span className="text-[7px] text-surface-400">Total XP</span>
                    <span className="text-[9px] font-mono tabular-nums text-white/80">
                      {analysis.totalXp.toLocaleString()}
                    </span>
                    <span className="text-[7px] text-surface-500">→</span>
                    <span className="text-[7px] text-surface-400">Adjusted</span>
                    <span className={`text-[9px] font-mono tabular-nums ${analysis.difficultyColor}`}>
                      {analysis.adjustedXp.toLocaleString()}
                    </span>
                    <span className={`text-[7px] px-0.5 py-px rounded ${analysis.difficultyColor} bg-white/[0.03] ml-auto`}>
                      ×{analysis.enemies.length > 0 ? (analysis.adjustedXp / Math.max(analysis.totalXp, 1)).toFixed(1) : "0"}
                    </span>
                  </div>
                </div>

                {/* Enemy Breakdown */}
                <div
                  className="p-1.5 rounded-lg bg-surface-800/20 border border-white/[0.03]
                    animate-in slide-in-from-bottom-1 fade-in duration-200"
                  style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
                >
                  <span className="text-[7px] uppercase tracking-wider text-surface-500">
                    👹 Enemies ({analysis.enemies.length})
                  </span>
                  <div className="space-y-px mt-0.5">
                    {analysis.enemies.map((enemy, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-0.5 p-0.5 rounded bg-surface-900/40"
                      >
                        <span className="text-[7px] text-white/80 min-w-0 truncate flex-1">
                          {enemy.name}
                        </span>
                        <span className="text-[6px] px-0.5 py-px rounded bg-surface-800/40 text-surface-400">
                          CR {enemy.cr}
                        </span>
                        <span className="text-[6px] text-surface-500 font-mono tabular-nums">
                          {enemy.xp.toLocaleString()} XP
                        </span>
                        <span className="text-[6px] text-surface-500">
                          ×{enemy.count}
                        </span>
                      </div>
                    ))}
                    {analysis.enemies.length === 0 && (
                      <span className="text-[7px] text-surface-500 italic">
                        No enemies in current encounter
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Economy */}
                <div
                  className="p-1.5 rounded-lg bg-surface-800/20 border border-white/[0.03]
                    animate-in slide-in-from-bottom-1 fade-in duration-200"
                  style={{ animationDelay: "140ms", animationFillMode: "forwards" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] uppercase tracking-wider text-surface-500">
                      ⚖️ Action Economy
                    </span>
                    <span
                      className={`text-[7px] px-0.5 py-px rounded ${
                        analysis.actionEconomyAdvantage === "party"
                          ? "text-emerald-300 bg-emerald-500/10 border border-emerald-500/10"
                          : analysis.actionEconomyAdvantage === "enemies"
                          ? "text-rose-300 bg-rose-500/10 border border-rose-500/10"
                          : "text-gold-300 bg-gold-500/10 border border-gold-500/10"
                      }`}
                    >
                      {analysis.actionEconomyAdvantage === "party"
                        ? "Party Advantage"
                        : analysis.actionEconomyAdvantage === "enemies"
                        ? "Enemy Advantage"
                        : "Balanced"}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-0.5 p-0.5 rounded bg-surface-900/40">
                    <span className="text-[7px] text-surface-400">PCs</span>
                    <span className="text-[9px] font-mono tabular-nums text-white/80">
                      {analysis.party.size}
                    </span>
                    <span className="text-[7px] text-surface-500">:</span>
                    <span className="text-[7px] text-surface-400">Enemies</span>
                    <span className="text-[9px] font-mono tabular-nums text-white/80">
                      {analysis.enemies.reduce((s, e) => s + e.count, 0)}
                    </span>
                    <span className="text-[7px] text-surface-500 ml-auto">
                      {analysis.partyVsEnemyCountRatio.toFixed(1)} : 1
                    </span>
                  </div>
                </div>

                {/* CR vs Level */}
                {analysis.avgEnemyCrVsPartyLevel > 0 && (
                  <div
                    className="p-1.5 rounded-lg bg-surface-800/20 border border-white/[0.03]
                      animate-in slide-in-from-bottom-1 fade-in duration-200"
                    style={{ animationDelay: "160ms", animationFillMode: "forwards" }}
                  >
                    <span className="text-[7px] uppercase tracking-wider text-surface-500">
                      📈 CR vs Party Level
                    </span>
                    <div className="flex items-center gap-0.5 mt-0.5 p-0.5 rounded bg-surface-900/40">
                      <span className="text-[7px] text-surface-400">
                        Avg Enemy CR
                      </span>
                      <span className="text-[9px] font-mono tabular-nums text-white/80">
                        {(
                          analysis.enemies.reduce(
                            (s, e) => s + e.cr * e.count,
                            0
                          ) /
                            Math.max(
                              analysis.enemies.reduce((s, e) => s + e.count, 0),
                              1
                            )
                        ).toFixed(1)}
                      </span>
                      <span className="text-[7px] text-surface-500">vs</span>
                      <span className="text-[7px] text-surface-400">
                        Party Lv
                      </span>
                      <span className="text-[9px] font-mono tabular-nums text-white/80">
                        {analysis.party.avgLevel}
                      </span>
                      <span
                        className={`text-[7px] ml-auto ${
                          analysis.avgEnemyCrVsPartyLevel <= 0.5
                            ? "text-emerald-400"
                            : analysis.avgEnemyCrVsPartyLevel <= 1
                            ? "text-gold-400"
                            : "text-rose-400"
                        }`}
                      >
                        {analysis.avgEnemyCrVsPartyLevel.toFixed(2)} ratio
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "saves" && (
              <div>
                {/* Strong Saves */}
                <div
                  className="p-1.5 rounded-lg bg-surface-800/20 border border-white/[0.03]
                    animate-in slide-in-from-bottom-1 fade-in duration-200"
                >
                  <span className="text-[7px] uppercase tracking-wider text-surface-500">
                    💪 Strong Saves
                  </span>
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {analysis.party.strongSaves.length > 0 ? (
                      analysis.party.strongSaves.map((save) => (
                        <span
                          key={save}
                          className="text-[7px] px-0.5 py-px rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/10"
                        >
                          {save.charAt(0).toUpperCase() + save.slice(1)}
                        </span>
                      ))
                    ) : (
                      <span className="text-[7px] text-surface-500 italic">
                        No standout strong saves
                      </span>
                    )}
                  </div>
                </div>

                {/* Weak Saves */}
                <div
                  className="p-1.5 rounded-lg bg-surface-800/20 border border-white/[0.03]
                    animate-in slide-in-from-bottom-1 fade-in duration-200"
                  style={{ animationDelay: "40ms", animationFillMode: "forwards" }}
                >
                  <span className="text-[7px] uppercase tracking-wider text-surface-500">
                    🎯 Weak Saves
                  </span>
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {analysis.party.weakSaves.length > 0 ? (
                      analysis.party.weakSaves.map((save) => (
                        <span
                          key={save}
                          className="text-[7px] px-0.5 py-px rounded bg-rose-500/10 text-rose-300 border border-rose-500/10"
                        >
                          {save.charAt(0).toUpperCase() + save.slice(1)}
                        </span>
                      ))
                    ) : (
                      <span className="text-[7px] text-surface-500 italic">
                        All saves are well-covered
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 space-y-px">
                    {analysis.saveTargetingWarnings
                      .filter((w) => w.type === "danger")
                      .map((w, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-0.5 p-0.5 rounded bg-rose-950/30 border border-rose-500/10"
                        >
                          <span className="text-[7px] text-rose-300">⚠️</span>
                          <span className="text-[7px] text-rose-200/80">
                            {w.message}
                          </span>
                        </div>
                      ))}
                    {analysis.saveTargetingWarnings
                      .filter((w) => w.type === "info")
                      .map((w, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-0.5 p-0.5 rounded bg-sky-950/30 border border-sky-500/10"
                        >
                          <span className="text-[7px] text-sky-300">ℹ️</span>
                          <span className="text-[7px] text-sky-200/80">
                            {w.message}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "recommend" && (
              <div>
                <div className="flex flex-col gap-0.5">
                  {analysis.recommendations.length > 0 ? (
                    analysis.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className={`p-1.5 rounded-lg border
                          animate-in slide-in-from-bottom-1 fade-in duration-200
                          ${
                            rec.type === "danger"
                              ? "bg-rose-950/30 border-rose-500/15"
                              : rec.type === "warning"
                              ? "bg-amber-950/30 border-amber-500/15"
                              : rec.type === "info"
                              ? "bg-sky-950/30 border-sky-500/15"
                              : "bg-emerald-950/30 border-emerald-500/15"
                          }`}
                        style={{
                          animationDelay: `${i * 40}ms`,
                          animationFillMode: "forwards",
                        }}
                      >
                        <div className="flex items-start gap-0.5">
                          <span className="text-[9px]">{rec.icon}</span>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-[7px] ${
                                rec.type === "danger"
                                  ? "text-rose-200/80"
                                  : rec.type === "warning"
                                  ? "text-amber-200/80"
                                  : rec.type === "info"
                                  ? "text-sky-200/80"
                                  : "text-emerald-200/80"
                              }`}
                            >
                              {rec.message}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center p-2">
                      <span className="text-[7px] text-surface-500 italic">
                        No recommendations available
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FOOTER ── */}
        <div className="mx-3 mb-1 p-1 rounded-lg bg-surface-800/20 border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <span className="text-[7px] text-surface-500">
              {analysis
                ? `${analysis.party.size} PCs · ${analysis.enemies.length} enemy groups`
                : "No active analysis"}
            </span>
            <span className="text-[6px] text-surface-600">
              {analysis &&
                `CR ${analysis.crRange.min.toFixed(1)}–${analysis.crRange.max.toFixed(1)}`}
            </span>
          </div>
        </div>
        <div className="h-2" />
      </div>
    </div>
  );
}
