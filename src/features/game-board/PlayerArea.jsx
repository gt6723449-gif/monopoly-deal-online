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
  const bankTotal = player.bank.reduce((sum, card) => sum + card.value, 0);

  function handlePlayerNameClick() {
    window.dispatchEvent(
      new CustomEvent("monopoly-deal-player-target", {
        detail: {
          playerId: player.id,
        },
      })
    );
  }

  return (
    <section
      className={[
        "player-area",
        isActivePlayer ? "current-player-area" : "",
        !isHumanPlayer ? "compact-player-area" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="player-area-header">
        <div className="player-name-controls">
          <div
            role="button"
            tabIndex={0}
            className={
              isActivePlayer ? "player-name-timer active" : "player-name-timer"
            }
            onClick={handlePlayerNameClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handlePlayerNameClick();
              }
            }}
          >
            {isActivePlayer && !isHumanPlayer && (
              <TurnTimer
                game={game}
                player={player}
                dispatch={dispatch}
                isRunning
                durationSeconds={2}
                shouldDispatchOnExpire={false}
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
          <span className="player-sets-count">
            {t(language, "sets")} {completedSetCount}/3
          </span>
          <div className="player-bank-card">
            <strong>${bankTotal}M</strong>
            <div className="player-bank-icon" />
          </div>
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
            language={language}
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
            language={language}
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
