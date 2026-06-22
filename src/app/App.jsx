import { useState } from "react";
import { PlayerPanel } from "../features/game-board/PlayerPanel";
import { PaymentPanel } from "../features/game-board/PaymentPanel";
import { TurnControls } from "../features/game-board/TurnControls";
import { GameSetup } from "../features/game-board/GameSetup";
import { ResponsePanel } from "../features/game-board/ResponsePanel";
import { DiscardPanel } from "../features/game-board/DiscardPanel";
import { useGame } from "../hooks/useGame";
import { AutoTurnEffects } from "../features/game-board/AutoTurnEffects";
import { GameTable } from "../features/game-board/GameTable";
import { WinnerClaimPage } from "../features/game-board/WinnerClaimPage";
import { LanguageSelectPage } from "../features/language/LanguageSelectPage";





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

  if (winner) {
    return (
      <WinnerClaimPage
        winner={winner}
        amount={PRIZE_AMOUNT}
        language={language}
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

  return (
    <main className="app">
      <AutoTurnEffects
        game={game}
        currentPlayer={currentPlayer}
        dispatch={dispatch}
      />
      <section className="game-shell">

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
      </section>
    </main>
  );
}
