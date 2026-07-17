/* ── Recent Activity Feed — DM Dashboard Widget ────────────────
 * Shows the most recent changes to the campaign: journal entries,
 * encounters created, characters updated, etc. Chronological order.
 * ─────────────────────────────────────────────────────────────── */

import { useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { Link } from "react-router-dom";

interface ActivityItem {
  id: string;
  type: "journal" | "encounter" | "character" | "map" | "settings";
  label: string;
  description: string;
  timestamp: number;
  href: string;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  journal: { icon: "📝", color: "text-accent-400 bg-accent-500/10" },
  encounter: { icon: "⚔️", color: "text-warrior-400 bg-warrior-500/10" },
  character: { icon: "⚔", color: "text-rogue-400 bg-rogue-500/10" },
  map: { icon: "🗺️", color: "text-mage-400 bg-mage-500/10" },
  settings: { icon: "⚙️", color: "text-surface-400 bg-surface-800" },
};

export function RecentActivityFeed() {
  const meta = useCampaignStore((s) => s.meta);
  const characters = useCampaignStore((s) => s.characters);
  const campaign = meta ? { name: meta.name, playerCharacters: characters } as { name: string; playerCharacters: import("@/types").PlayerCharacter[] } : null;

  const activities = useMemo((): ActivityItem[] => {
    if (!campaign) return [];

    const items: ActivityItem[] = [];

    // Recent journal entries
    for (const entry of campaign.journal.slice(-5)) {
      items.push({
        id: `journal-${entry.id}`,
        type: "journal",
        label: entry.title,
        description: `Journal · ${entry.type}`,
        timestamp: entry.createdAt,
        href: "/campaign/journal",
      });
    }

    // Recent encounters
    for (const enc of campaign.encounters.slice(-3)) {
      items.push({
        id: `encounter-${enc.id}`,
        type: "encounter",
        label: enc.name,
        description: `Encounter · ${enc.difficulty ?? "unknown"} · ${enc.enemies.reduce((s, e) => s + e.count, 0)} enemies`,
        timestamp: enc.createdAt,
        href: "/campaign/encounters",
      });
    }

    // Recent characters
    for (const pc of campaign.playerCharacters.slice(-3)) {
      items.push({
        id: `character-${pc.id}`,
        type: "character",
        label: pc.name,
        description: `${pc.race} ${pc.class} · Level ${pc.level}`,
        timestamp: pc.createdAt,
        href: "/campaign/player-cards",
      });
    }

    // Sort by timestamp descending
    items.sort((a, b) => b.timestamp - a.timestamp);

    return items.slice(0, 8);
  }, [campaign]);

  if (!campaign || activities.length === 0) return null;

  return (
    <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-surface-400 flex items-center gap-2">
        <span>📋</span> Recent Activity
      </h3>
      <div className="space-y-2">
        {activities.map((item) => {
          const config = TYPE_CONFIG[item.type];
          return (
            <Link
              key={item.id}
              to={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-800 group"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${config.color}`}>
                {config.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-surface-200 truncate group-hover:text-accent-300 transition-colors">
                  {item.label}
                </p>
                <p className="text-[11px] text-surface-500 truncate">{item.description}</p>
              </div>
              <span className="shrink-0 text-[10px] text-surface-500">
                {formatRelativeTime(item.timestamp)}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
