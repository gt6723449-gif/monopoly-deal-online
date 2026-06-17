import { useEffect } from "react";

export function AutoTurnEffects({ game, currentPlayer, dispatch }) {
  useEffect(() => {
    if (game.status !== "playing") return;
    if (game.turn.phase !== "draw") return;
    if (game.turn.hasDrawn) return;

    const drawCount = currentPlayer.hand.length === 0 ? 5 : 2;

    dispatch({
      type: "DRAW_CARDS",
      payload: {
        playerId: currentPlayer.id,
        count: drawCount,
      },
    });
  }, [
    game.status,
    game.turn.phase,
    game.turn.hasDrawn,
    currentPlayer.id,
    currentPlayer.hand.length,
    dispatch,
  ]);

  useEffect(() => {
    if (game.status !== "playing") return;
    if (game.turn.phase !== "action") return;
    if (game.turn.actionsUsed < game.turn.maxActions) return;

    dispatch({
      type: "END_TURN",
      payload: {
        playerId: currentPlayer.id,
      },
    });
  }, [
    game.status,
    game.turn.phase,
    game.turn.actionsUsed,
    game.turn.maxActions,
    currentPlayer.id,
    dispatch,
  ]);

  return null;
}