/**
 * STᚱ VTT — Connected Players Panel (Sprint 10)
 *
 * DM-accessible panel showing which players are currently connected
 * to the campaign. Integrated into the sidebar under Sync Health.
 *
 * Features:
 *   - Live player list with character names and player handles
 *   - Connection indicator per player (green = active heartbeat)
 *   - Total connected count
 *   - Empty state when no players are online
 *   - Role badges (Player/DM)
 *   - Stale entry protection (entries older than 90s filtered out)
 *
 * Data source: Firestore /campaign/{id}/presence/{charId}
 *   Each connected player writes a heartbeat every 30s.
 *   DM subscribes via onSnapshot.
 */

import { usePresenceSubscription } from "@/hooks/usePresence";

interface ConnectedPlayersPanelProps {
  compact?: boolean;
}

export default function ConnectedPlayersPanel({ compact = false }: ConnectedPlayersPanelProps) {
  const { connectedPlayers, isLoading, connectedCount } = usePresenceSubscription();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h4 className="text-[9px] uppercase tracking-widest text-gold-400/50 font-medium">
          Connected Players
        </h4>
        <div className="flex items-center justify-center py-4">
          <div className="w-3 h-3 border border-gold-500/30 rounded-full animate-spin border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[9px] uppercase tracking-widest text-gold-400/50 font-medium">
          Connected Players
        </h4>
        {connectedCount > 0 && (
          <span className="text-[8px] text-surface-600 bg-white/[0.03] px-1.5 py-0.5 rounded">
            {connectedCount}
          </span>
        )}
      </div>

      {connectedPlayers.length === 0 ? (
        <div className="py-3 text-center">
          <p className="text-[9px] text-surface-600">
            {compact ? "No players connected" : "No players are currently connected to the campaign."}
          </p>
          {!compact && (
            <p className="text-[8px] text-surface-700 mt-1">
              Players can join via the login page or a join code.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {connectedPlayers.map((player) => (
            <div
              key={player.characterId}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.03]"
            >
              {/* Status dot */}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.3)] shrink-0" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-white/80 truncate">
                    {player.playerName}
                  </span>
                  <span className="text-[7px] uppercase tracking-wider text-gold-400/40 bg-gold-500/10 px-1 py-0.5 rounded font-medium">
                    {player.role}
                  </span>
                </div>
                <p className="text-[8px] text-surface-600 truncate">
                  {player.characterId.slice(0, 16)}...
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
