import { createContext, useMemo, useReducer } from "react";
import { createInitialGame } from "../../game/engine/createInitialGame";
import { gameReducer } from "../../game/engine/gameReducer";

export const GameContext = createContext(null);

const initialGame = createInitialGame({
  playerNames: ["Roy", "Player 2"],
});

export function GameProvider({ children }) {
  const [game, dispatch] = useReducer(gameReducer, initialGame);

  const value = useMemo(() => {
    return {
      game,
      dispatch,
    };
  }, [game]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}