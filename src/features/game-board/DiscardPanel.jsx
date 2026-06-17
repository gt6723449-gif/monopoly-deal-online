export function DiscardPanel({ game, currentPlayer, dispatch }) {
    if (game.status !== "discarding") {
        return null;
    }

    const cardsToDiscard = Math.max(0, currentPlayer.hand.length - 7);

    function handleDiscard(cardInstanceId) {
        dispatch({
            type: "DISCARD_CARD",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId,
            },
        });
    }

    function handleFinishDiscarding() {
        dispatch({
            type: "FINISH_DISCARDING",
            payload: {
                playerId: currentPlayer.id,
            },
        });
    }

    return (
        <section className="discard-panel">
            <h2>Discard Down to 7</h2>

            <p>
                <strong>{currentPlayer.name}</strong> has {currentPlayer.hand.length}{" "}
                cards.
            </p>

            <p>
                Cards left to discard: <strong>{cardsToDiscard}</strong>
            </p>

            <div className="payment-card-grid">
                {currentPlayer.hand.map((card) => (
                    <button
                        type="button"
                        className="payment-card"
                        key={card.instanceId}
                        onClick={() => handleDiscard(card.instanceId)}
                        disabled={currentPlayer.hand.length <= 7}
                    >
                        <strong>{card.name}</strong>
                        <span>${card.value}M</span>
                        <small>{card.type}</small>
                    </button>
                ))}
            </div>

            <button
                type="button"
                onClick={handleFinishDiscarding}
                disabled={currentPlayer.hand.length > 7}
            >
                Finish Discarding
            </button>
        </section>
    );
}