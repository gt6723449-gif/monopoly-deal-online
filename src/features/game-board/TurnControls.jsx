export function TurnControls({ game, currentPlayer, dispatch }) {
  const isWaiting = game.status !== "playing" && game.status !== "discarding";
  const isDiscarding = game.status === "discarding";

  function handleEndTurn() {
    dispatch({
      type: "END_TURN",
      payload: {
        playerId: currentPlayer.id,
      },
    });
  }

  return (
    <div className="controls">
      <button
        type="button"
        onClick={handleEndTurn}
        disabled={isWaiting || isDiscarding || game.turn.phase !== "action"}
      >
        End Turn Early
      </button>
    </div>
  );
}