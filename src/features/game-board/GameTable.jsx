import { CardView } from "../../components/CardView/CardView";
import monopolyGreenMan from "../../assets/monopoly-green-man.png?inline";
import { PlayerArea } from "./PlayerArea";

export function GameTable({
  game,
  currentPlayer,
  dispatch,
  selectedColors,
  setSelectedColors,
  selectedTargets,
  setSelectedTargets,
  language,
}) {
  const humanPlayer =
    game.players.find((player) => player.id === game.humanPlayerId) ||
    game.players[0];
  const otherPlayers = game.players.filter(
    (player) => player.id !== humanPlayer.id
  );

  const seats =
    game.players.length === 4
      ? {
          top: otherPlayers[1],
          right: otherPlayers[0],
          bottom: humanPlayer,
          left: otherPlayers[2],
        }
      : {
          top: otherPlayers[0],
          bottom: humanPlayer,
        };

  const lastPlayedTableCard = game.discardPile
    .filter((card) => card.type === "action" || card.type === "rent")
    .at(-1);

  function renderSeat(position, player) {
    if (!player) return null;

    const isCurrentPlayer = player.id === currentPlayer.id;
    const isHumanPlayer = player.id === humanPlayer.id;

    return (
      <div className={`table-seat table-seat-${position}`}>
        <PlayerArea
          player={player}
          currentPlayer={currentPlayer}
          game={game}
          dispatch={dispatch}
          isActivePlayer={isCurrentPlayer}
          isHumanPlayer={isHumanPlayer}
          selectedColors={selectedColors}
          setSelectedColors={setSelectedColors}
          selectedTargets={selectedTargets}
          setSelectedTargets={setSelectedTargets}
          language={language}
        />
      </div>
    );
  }

  return (
    <section
      className={`game-table game-table-${game.players.length}`}
      dir="ltr"
    >
      {renderSeat("top", seats.top)}
      {renderSeat("left", seats.left)}

      <div className="table-center">
        <img
          className="table-center-mascot"
          src={monopolyGreenMan}
          alt=""
          aria-hidden="true"
        />

        {lastPlayedTableCard && (
          <div className="table-played-card">
            <CardView card={lastPlayedTableCard} language={language} />
          </div>
        )}
      </div>

      {renderSeat("right", seats.right)}
      {renderSeat("bottom", seats.bottom)}
    </section>
  );
}
