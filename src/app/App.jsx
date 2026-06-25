import { useState } from "react";
import { PaymentPanel } from "../features/game-board/PaymentPanel";
import { GameSetup } from "../features/game-board/GameSetup";
import { ResponsePanel } from "../features/game-board/ResponsePanel";
import { DiscardPanel } from "../features/game-board/DiscardPanel";
import { useGame } from "../hooks/useGame";
import { AutoTurnEffects } from "../features/game-board/AutoTurnEffects";
import { GameTable } from "../features/game-board/GameTable";
import { WinnerClaimPage } from "../features/game-board/WinnerClaimPage";
import { LanguageSelectPage } from "../features/language/LanguageSelectPage";
import { TurnTimer } from "../features/game-board/TurnTimer";
import { getCompletedPropertySetCount } from "../game/engine/winEngine";
import { t } from "../i18n/translations";

export default function App() {
  const { game, dispatch } = useGame();
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedTargets, setSelectedTargets] = useState({});
  const [language, setLanguage] = useState(null);
  const PRIZE_AMOUNT = "$100";

  const currentPlayer = game.players.find(
    (player) => player.id === game.currentPlayerId
  );

  if (!language) {
    return (
      <LanguageSelectPage
        onSelectLanguage={(selectedLanguage) => {
          setLanguage(selectedLanguage);
        }}
      />
    );
  }

  if (!hasStarted) {
    return (
      <GameSetup
        dispatch={dispatch}
        language={language}
        onStart={() => setHasStarted(true)}
      />
    );
  }



  const winner = game.players.find((player) => player.id === game.winnerId);
  const humanPlayer =
    game.players.find((player) => player.id === game.humanPlayerId) ||
    game.players[0];

  if (winner) {
    return (
      <WinnerClaimPage
        winner={winner}
        amount={PRIZE_AMOUNT}
        language={language}
        isHumanWinner={winner.id === humanPlayer.id}
        onPlayAgain={() => {
          dispatch({
            type: "START_NEW_GAME",
            payload: {
              playerNames: game.players.map((player) => player.name),
              botPlayerIds: game.players
                .filter((player) => player.isBot)
                .map((player) => player.id),
              mode: game.mode,
            },
          });
        }}
      />
    );
  }

  const canAct =
    game.status === "playing" &&
    game.turn.phase === "action" &&
    game.turn.actionsUsed < game.turn.maxActions;
  const humanBankTotal = humanPlayer.bank.reduce(
    (sum, card) => sum + card.value,
    0
  );
  const humanCompletedSetCount = getCompletedPropertySetCount(humanPlayer);

  function handleEndTurn() {
    dispatch({
      type: "END_TURN",
      payload: {
        playerId: currentPlayer.id,
      },
    });
  }

  return (
    <main className="app">
      <AutoTurnEffects
        game={game}
        currentPlayer={currentPlayer}
        dispatch={dispatch}
      />
      <section className="game-shell">
        <header className="game-top-bar">
          <strong>Monopo Deal</strong>
        </header>

        {winner && (
          <section className="winner-banner">
            <h2>{winner.name} wins!</h2>
            <p>They completed 3 full property sets.</p>
          </section>
        )}

        <DiscardPanel
          game={game}
          currentPlayer={currentPlayer}
          dispatch={dispatch}
          language={language}
        />

        <ResponsePanel game={game} dispatch={dispatch} language={language}/>

        <PaymentPanel game={game} dispatch={dispatch} language={language}/>

        {!canAct && game.turn.phase === "action" && game.status === "playing" && (
          <p className="notice">No actions left. End your turn.</p>
        )}

        <GameTable
          game={game}
          currentPlayer={currentPlayer}
          dispatch={dispatch}
          selectedColors={selectedColors}
          setSelectedColors={setSelectedColors}
          selectedTargets={selectedTargets}
          setSelectedTargets={setSelectedTargets}
          language={language}
        />

        <footer className="game-bottom-bar">
          <div
            className={[
              "bottom-player-card",
              currentPlayer.id === humanPlayer.id ? "bottom-player-card-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="bottom-player-timer">
              {currentPlayer.id === humanPlayer.id && (
                <TurnTimer
                  game={game}
                  player={humanPlayer}
                  dispatch={dispatch}
                  isRunning
                />
              )}
              <span>{humanPlayer.name}</span>
            </div>
          </div>

          <div className="bottom-sets-count">
            {t(language, "sets")} {humanCompletedSetCount}/3
          </div>

          <div className="bottom-bank-card">
            <strong>${humanBankTotal}M</strong>
            <div className="bottom-bank-icon" />
          </div>

          <button
            type="button"
            className="bottom-end-turn-button"
            onClick={handleEndTurn}
            disabled={
              !(
                currentPlayer.id === humanPlayer.id &&
                game.status === "playing" &&
                game.turn.phase === "action"
              )
            }
          >
            <span>End</span>
            {currentPlayer.id === humanPlayer.id && (
              <strong>{game.turn.actionsUsed}/{game.turn.maxActions}</strong>
            )}
          </button>
        </footer>
      </section>
    </main>
  );
}
