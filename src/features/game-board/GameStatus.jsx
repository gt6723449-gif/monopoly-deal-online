export function GameStatus({ game, currentPlayer }) {
  return (
    <div className="game-status">
      <p>
        <strong>Status:</strong> {game.status}
      </p>
      <p>
        <strong>Current Player:</strong> {currentPlayer.name}
      </p>
      <p>
        <strong>Turn:</strong> {game.turn.number}
      </p>
      <p>
        <strong>Phase:</strong> {game.turn.phase}
      </p>
      <p>
        <strong>Actions Used:</strong> {game.turn.actionsUsed}/
        {game.turn.maxActions}
      </p>
      <p>
        <strong>Deck Cards:</strong> {game.deck.length}
      </p>
      <p>
        <strong>Discard Pile:</strong> {game.discardPile.length}
      </p>
    </div>
  );
}