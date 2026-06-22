import { t } from "../../i18n/translations";

export function DiscardPanel({ game, currentPlayer, dispatch, language }) {
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
        <div className="discard-modal-backdrop">
            <section
                className="discard-panel discard-modal"
                dir={language === "ar" ? "rtl" : "ltr"}
                role="dialog"
                aria-modal="true"
                aria-labelledby="discard-panel-title"
            >
                <h2 id="discard-panel-title">{t(language, "discardDownTo7")}</h2>

                <p>
                    <strong>{currentPlayer.name}</strong> {t(language, "has")}{" "}
                    {currentPlayer.hand.length} {t(language, "cardPlural")}.
                </p>

                <p>
                    {t(language, "cardsLeftToDiscard")}:{" "}
                    <strong>{cardsToDiscard}</strong>
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
                    {t(language, "finishDiscarding")}
                </button>
            </section>
        </div>
    );
}
