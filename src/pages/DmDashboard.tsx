/* ── DM Command Center ───────────────────────────────────────── */

import { Link } from "react-router-dom";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";

export function DmDashboard() {
  const campaign = useCampaignStore((s) => s.campaign);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const liveSession = useCombatStore((s) => s.liveSession);

  const combatants = activeEncounter?.combatants ?? [];
  const aliveCount = combatants.filter((c) => !c.isDead).length;
  const deadCount = combatants.filter((c) => c.isDead).length;

  const sessionBorderColor = liveSession.sessionStartedAt
    ? "border-l-accent-500"
    : "border-l-surface-500";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Welcome */}
      <section>
        <h2 className="text-xl font-bold text-surface-100 md:text-2xl">
          DM Command Center
        </h2>
        <p className="mt-1 text-sm text-surface-400">
          {campaign
            ? `Welcome to the ${campaign.name} campaign.`
            : "Start by creating or importing a campaign."}
        </p>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        <StatCard
          label="Players"
          value={campaign?.playerCharacters.length ?? 0}
          icon="⚔"
          color="border-l-warrior-500"
        />
        <StatCard
          label="Combatants"
          value={combatants.length}
          icon="⚡"
          color="border-l-divine-500"
        />
        <StatCard
          label="Alive"
          value={aliveCount}
          icon="❤️"
          color="border-l-divine-400"
          detail={deadCount > 0 ? `${deadCount} down` : undefined}
        />
        <StatCard
          label="Round"
          value={activeEncounter?.round ?? 0}
          icon="🔄"
          color="border-l-mage-500"
        />
        <StatCard
          label="Session"
          value={liveSession.sessionStartedAt ? "Live" : "\u2014"}
          icon="🎙️"
          color={sessionBorderColor}
        />
      </section>

      {/* Live Status Bar */}
      {liveSession.sessionStartedAt && (
        <section className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-4">
          <div className="flex items-center gap-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500/20">
              <span className="h-2.5 w-2.5 rounded-full bg-accent-500 animate-pulse" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-accent-300">Session Active</p>
              <p className="text-xs text-accent-500">
                Phase: {liveSession.phase.charAt(0).toUpperCase() + liveSession.phase.slice(1)}
                {activeEncounter?.phase === "active" && ` \u00B7 Round ${activeEncounter.round}`}
              </p>
            </div>
            <span className="text-xs text-surface-500">
              {liveSession.currentScene ? "Scene set \u2713" : "No scene"}
            </span>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-surface-400">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickActionButton label="Combat Center" icon="⚔️" to="/encounters" />
          <QuickActionButton label="New Player" icon="+" to="/players" />
          <QuickActionButton label="Homebrew" icon="⚗️" to="/homebrew" />
          <QuickActionButton label="Journal Entry" icon="📝" to="/journal" />
        </div>
      </section>

      {/* Recent Activity */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-surface-400">
          Recent Activity
        </h3>
        <p className="text-sm text-surface-500 italic">
          {campaign
            ? "Use the Combat Center for session tracking and initiative management."
            : "Import a campaign to get started."}
        </p>
      </section>
    </div>
  );
}

/* ── Sub-Components ─────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  color,
  detail,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  detail?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-surface-700 bg-surface-850 p-4 border-l-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl font-bold text-surface-100">{value}</span>
      </div>
      <p className="mt-1 text-xs font-medium text-surface-400">{label}</p>
      {detail && (
        <p className="text-[11px] text-warrior-400 mt-0.5">{detail}</p>
      )}
    </div>
  );
}

function QuickActionButton({
  label,
  icon,
  to,
}: {
  label: string;
  icon: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-sm font-medium text-surface-300 transition-colors hover:border-accent-500/50 hover:bg-surface-700 hover:text-surface-100"
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
}
