export function ResponsePanel({ game, dispatch }) {
    const pendingAction = game.pendingAction;

    if (!pendingAction) {
        return null;
    }

    const respondingPlayerId = pendingAction.responsePlayerIds[0];

    const respondingPlayer = game.players.find(
        (player) => player.id === respondingPlayerId
    );

    if (!respondingPlayer) {
        return null;
    }

    const justSayNoCard = respondingPlayer.hand.find(
        (card) =>
            card.type === "action" && card.meta.actionType === "justSayNo"
    );

    function handleDecline() {
        dispatch({
            type: "DECLINE_JUST_SAY_NO",
            payload: {
                playerId: respondingPlayer.id,
            },
        });
    }

    function handlePlayJustSayNo() {
        if (!justSayNoCard) return;

        dispatch({
            type: "PLAY_JUST_SAY_NO",
            payload: {
                playerId: respondingPlayer.id,
                cardInstanceId: justSayNoCard.instanceId,
            },
        });
    }

    return (
        <section className="response-panel">
            <h2>Response Needed</h2>

            <p>
                <strong>{respondingPlayer.name}</strong> can respond to{" "}
                <strong>{pendingAction.sourceCard.name}</strong>.
            </p>

            {justSayNoCard ? (
                <button type="button" onClick={handlePlayJustSayNo}>
                    Play Just Say No
                </button>
            ) : (
                <p>This player has no Just Say No card.</p>
            )}

            <button type="button" onClick={handleDecline}>
                Do Not Block
            </button>
        </section>
    );
}