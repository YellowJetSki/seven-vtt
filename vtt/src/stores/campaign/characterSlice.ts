import type { PlayerCharacter } from "@/types";

export interface CampaignCharacterState {
  characters: PlayerCharacter[];
}

export interface CampaignCharacterActions {
  setCharacters: (characters: PlayerCharacter[]) => void;
  addCharacter: (character: PlayerCharacter) => void;
  updateCharacter: (charId: string, updates: Partial<PlayerCharacter>) => void;
  removeCharacter: (charId: string) => void;
}

export type CampaignCharacterSlice = CampaignCharacterState & CampaignCharacterActions;

type SetPartial = (partial: Partial<CampaignCharacterSlice>) => void;
type GetState = () => CampaignCharacterSlice;

export function createCharacterSlice(set: SetPartial, get?: GetState): CampaignCharacterSlice {
  const state = {
    characters: [] as PlayerCharacter[],
  };

  return {
    ...state,

    setCharacters: (characters: PlayerCharacter[]) => set({ characters }),

    addCharacter: (character: PlayerCharacter) =>
      set({ characters: [...(get ? get().characters : []), character] }),

    updateCharacter: (charId: string, updates: Partial<PlayerCharacter>) =>
      set({
        characters: (get ? get().characters : []).map((c) =>
          c.id === charId ? { ...c, ...updates } : c
        ),
      }),

    removeCharacter: (charId: string) =>
      set({
        characters: (get ? get().characters : []).filter((c) => c.id !== charId),
      }),
  };
}
