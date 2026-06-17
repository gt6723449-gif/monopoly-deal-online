import { getCompletedPropertySetCount } from "../../game/engine/winEngine";
import { PlayerHand } from "./PlayerHand";
import { PlayerProperties } from "./PlayerProperties";
import { TurnTimer } from "./TurnTimer"

export function PlayerArea({
  player,
  currentPlayer,
  game,
  dispatch,
  isCurrentPlayer,
  selectedColors,
  setSelectedColors,
  selectedTargets,
  setSelectedTargets,
}) {
  const completedSetCount = getCompletedPropertySetCount(player);

  return (
    <section
      className={
        isCurrentPlayer ? "player-area current-player-area" : "player-area"
      }
    >
      <header className="player-area-header">
        <div className={isCurrentPlayer ? "player-name-timer active" : "player-name-timer"}>
          {isCurrentPlayer && (
            <TurnTimer
              game={game}
              currentPlayer={currentPlayer}
              dispatch={dispatch}
            />
          )}

          <h2>{player.name}</h2>
        </div>

        <div className="player-header-actions">
          <span>Sets {completedSetCount}/3</span>

          {isCurrentPlayer && game.status === "playing" && game.turn.phase === "action" && (
            <button
              type="button"
              className="small-end-turn-button"
              onClick={() =>
                dispatch({
                  type: "END_TURN",
                  payload: {
                    playerId: currentPlayer.id,
                  },
                })
              }
            >
              End Turn
            </button>
          )}
        </div>


      </header>

      {!isCurrentPlayer && (
        <>
          <PlayerHand
            player={player}
            currentPlayer={currentPlayer}
            game={game}
            dispatch={dispatch}
            hideCards
            selectedColors={selectedColors}
            setSelectedColors={setSelectedColors}
            selectedTargets={selectedTargets}
            setSelectedTargets={setSelectedTargets}
          />

          <PlayerProperties
            player={player}
            currentPlayer={currentPlayer}
            game={game}
            dispatch={dispatch}
          />
        </>
      )}

      {isCurrentPlayer && (
        <>
          <PlayerProperties
            player={player}
            currentPlayer={currentPlayer}
            game={game}
            dispatch={dispatch}
          />

          <PlayerHand
            player={player}
            currentPlayer={currentPlayer}
            game={game}
            dispatch={dispatch}
            selectedColors={selectedColors}
            setSelectedColors={setSelectedColors}
            selectedTargets={selectedTargets}
            setSelectedTargets={setSelectedTargets}
          />
        </>
      )}
    </section>
  );
}