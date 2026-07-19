/**
 * STᚱ VTT — Player Sheet Page
 *
 * Full-screen player character sheet.
 * Accessed after player login. Shows all character info.
 * Mobile-first with Stats, Combat, and Inventory tabs.
 */

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import PlayerSheet from "@/components/player/PlayerSheet";

export default function PlayerSheetPage() {
  const navigate = useNavigate();
  const characterId = useAuthStore((s) => s.characterId);
  const username = useAuthStore((s) => s.username);
  const characters = useCampaignStore((s) => s.characters);
  const logout = useAuthStore((s) => s.logout);

  const character = characters.find((c) => c.id === characterId);

  if (!character) {
    return (
      <div className="h-screen w-screen bg-obsidian flex items-center justify-center p-4">
        <div className="glass-gold rounded-2xl p-8 max-w-sm w-full text-center">
          <span className="text-5xl block mb-4">⚔</span>
          <h2 className="text-lg font-bold text-white mb-2">Character Not Found</h2>
          <p className="text-sm text-surface-400 mb-6">
            Your character data isn't available. Please ask your DM to set up your character.
          </p>
          <button
            onClick={() => {
              logout();
              navigate("/player", { replace: true });
            }}
            className="btn-gold w-full"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-obsidian flex flex-col">
      {/* Player Status Bar */}
      <div className="glass-gold shrink-0 px-4 py-3 flex items-center gap-3 z-20">
        <span className="text-lg">⚔</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-surface-200 truncate">
            {character.name}
          </div>
          <div className="text-[10px] text-surface-500 uppercase tracking-wider">
            {character.race} · {character.class} {character.level} · Playing as{" "}
            <span className="text-rogue-400">{username}</span>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/player", { replace: true });
          }}
          className="text-[10px] uppercase tracking-wider text-surface-500 hover:text-surface-300 transition-colors px-3 py-1.5 rounded-lg border border-surface-700/30 hover:border-surface-600/50"
        >
          Sign Out
        </button>
      </div>

      {/* Player Sheet */}
      <div className="flex-1 overflow-hidden">
        <PlayerSheet character={character} onClose={() => {}} />
      </div>
    </div>
  );
}
