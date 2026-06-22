import { getCompletedPropertySetCount } from "../../game/engine/winEngine";
import { t } from "../../i18n/translations";
import { PlayerHand } from "./PlayerHand";
import { PlayerProperties } from "./PlayerProperties";
import { TurnTimer } from "./TurnTimer";

export function PlayerArea({
  player,
  currentPlayer,
  game,
  dispatch,
  isActivePlayer,
  isHumanPlayer,
  selectedColors,
  setSelectedColors,
  selectedTargets,
  setSelectedTargets,
  language,
}) {
  const completedSetCount = getCompletedPropertySetCount(player);
  const canUseHandActions = isHumanPlayer && isActivePlayer;

  return (
    <section
      className={
        isActivePlayer ? "player-area current-player-area" : "player-area"
      }
    >
      <header className="player-area-header">
        <div className="player-name-controls">
          <div
            className={
              isActivePlayer ? "player-name-timer active" : "player-name-timer"
            }
          >
            {isActivePlayer && (
              <TurnTimer
                game={game}
                player={player}
                dispatch={dispatch}
                isRunning={isHumanPlayer}
              />
            )}

            <h2>{player.name}</h2>
          </div>

          {isActivePlayer &&
            isHumanPlayer &&
            game.status === "playing" &&
            game.turn.phase === "action" && (
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
                {t(language, "endTurnShort")}
              </button>
            )}
        </div>

        <div className="player-header-actions">
          <span>
            {t(language, "sets")} {completedSetCount}/3
          </span>
        </div>
      </header>

      {!isHumanPlayer && (
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
            language={language}
            canUseActions={false}
          />

          <PlayerProperties
            player={player}
            currentPlayer={currentPlayer}
            game={game}
            dispatch={dispatch}
          />
        </>
      )}

      {isHumanPlayer && (
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
            language={language}
            canUseActions={canUseHandActions}
          />
        </>
      )}
    </section>
  );
}
