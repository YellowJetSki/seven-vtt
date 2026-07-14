import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { PlayerCharacterSheet } from "@/components/player/PlayerCharacterSheet";
import { Button } from "@/components/ui/Button";

export function PlayerDashboard() {
  const characterId = useAuthStore((s) => s.characterId);
  const characterName = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);
  const characters = useCampaignStore((s) => s.campaign?.playerCharacters ?? []);

  // Find the player's character (match on first name of the character name)
  const character = characters.find((c) => {
    const firstName = c.name.split(" ")[0];
    return firstName.toLowerCase() === characterId?.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Player Top Bar */}
      <header className="sticky top-0 z-10 border-b border-surface-700/50 bg-surface-900/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-accent-400 text-sm font-bold">Sᚱ</span>
            <span className="text-xs text-surface-500">Arkla Campaign</span>
          </div>
          <div className="flex items-center gap-3">
            {characterName && (
              <span className="text-xs text-surface-400">
                Signed in as <span className="text-surface-200 font-medium">{characterName}</span>
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 md:px-6">
        {character ? (
          <PlayerCharacterSheet character={character} />
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-dashed border-surface-700 bg-surface-850 py-20 text-center">
            <span className="text-5xl text-surface-600 mb-4">🔍</span>
            <h2 className="text-lg font-semibold text-surface-200 mb-2">
              Character Not Found
            </h2>
            <p className="text-sm text-surface-500 mb-6 max-w-sm">
              Your character "{characterName}" hasn't been added to this
              campaign yet. Please ask your DM to create your character card.
            </p>
            <Button variant="secondary" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-800 py-4 text-center">
        <p className="text-[10px] text-surface-600">
          STᚱ VTT · Player View
        </p>
      </footer>
    </div>
  );
}
