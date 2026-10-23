import { createContext, useContext, useState, type ReactNode } from "react";
import type { StoryOutput } from "./types";

interface GameState {
  characterName: string;
  initialResponse: StoryOutput | null;
  setCharacter: (name: string, initial?: StoryOutput) => void;
  reset: () => void;
}

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [characterName, setCharacterName] = useState("");
  const [initialResponse, setInitialResponse] = useState<StoryOutput | null>(
    null,
  );

  const setCharacter = (name: string, initial?: StoryOutput) => {
    setCharacterName(name);
    if (initial) setInitialResponse(initial);
  };

  const reset = () => {
    setCharacterName("");
    setInitialResponse(null);
  };

  return (
    <GameContext.Provider
      value={{
        characterName,
        initialResponse,
        setCharacter,
        reset,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameStore() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameStore must be inside GameProvider");
  return ctx;
}
