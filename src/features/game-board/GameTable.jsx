import { CardView } from "../../components/CardView/CardView";
import { PlayerArea } from "./PlayerArea";

export function GameTable({
  game,
  currentPlayer,
  dispatch,
  selectedColors,
  setSelectedColors,
  selectedTargets,
  setSelectedTargets,
}) {
  const opponents = game.players.filter(
    (player) => player.id !== currentPlayer.id
  );

  const lastDiscardedCard = game.discardPile.at(-1);

  return (
    <section className="game-table">
      <div className="opponents-row">
        {opponents.map((player) => (
          <PlayerArea
            key={player.id}
            player={player}
            currentPlayer={currentPlayer}
            game={game}
            dispatch={dispatch}
            isCurrentPlayer={false}
            selectedColors={selectedColors}
            setSelectedColors={setSelectedColors}
            selectedTargets={selectedTargets}
            setSelectedTargets={setSelectedTargets}
          />
        ))}
      </div>

      <div className="table-center">
        {lastDiscardedCard ? (
          <div className="table-played-card">
            <CardView card={lastDiscardedCard} />
          </div>
        ) : (
          <div className="empty-table-label">TABLE</div>
        )}
      </div>

      <div className="current-player-row">
        <PlayerArea
          player={currentPlayer}
          currentPlayer={currentPlayer}
          game={game}
          dispatch={dispatch}
          isCurrentPlayer
          selectedColors={selectedColors}
          setSelectedColors={setSelectedColors}
          selectedTargets={selectedTargets}
          setSelectedTargets={setSelectedTargets}
        />
      </div>
    </section>
  );
}