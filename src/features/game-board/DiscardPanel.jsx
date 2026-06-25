import { useEffect } from "react";
import { t } from "../../i18n/translations";

const DISCARD_SECONDS = 30;

function getTranslatedCardName(card, language) {
    return t(language, `cardName.${card.id}`);
}

function getTranslatedCardType(card, language) {
    if (card.type === "property" || card.type === "wild") return t(language, "propertyCard");
    if (card.type === "money") return t(language, "moneyCard");
    if (card.type === "rent") return t(language, "rentCard");
    if (card.type === "action") return t(language, "actionCard");

    return card.type;
}

export function DiscardPanel({ game, currentPlayer, dispatch, language }) {
    const isHumanDiscard =
        game.status === "discarding" &&
        currentPlayer.id === game.humanPlayerId;

    useEffect(() => {
        if (!isHumanDiscard) return undefined;

        const timeoutId = window.setTimeout(() => {
            currentPlayer.hand.slice(7).forEach((card) => {
                dispatch({
                    type: "DISCARD_CARD",
                    payload: {
                        playerId: currentPlayer.id,
                        cardInstanceId: card.instanceId,
                    },
                });
            });

            dispatch({
                type: "FINISH_DISCARDING",
                payload: {
                    playerId: currentPlayer.id,
                },
            });
        }, DISCARD_SECONDS * 1000);

        return () => window.clearTimeout(timeoutId);
    }, [isHumanDiscard, currentPlayer.id, currentPlayer.hand, dispatch]);

    if (game.status !== "discarding") {
        return null;
    }

    if (currentPlayer.id !== game.humanPlayerId) {
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

                <div className="payment-totals">
                    <span>
                        <strong>{currentPlayer.name}</strong> {t(language, "has")}{" "}
                        {currentPlayer.hand.length} {t(language, "cardPlural")}
                    </span>
                    <span>
                        {t(language, "cardsLeftToDiscard")}:{" "}
                        <strong>{cardsToDiscard}</strong>
                    </span>
                </div>

                <div className="payment-card-grid">
                    {currentPlayer.hand.map((card) => (
                        <button
                            type="button"
                            className="payment-card"
                            key={card.instanceId}
                            onClick={() => handleDiscard(card.instanceId)}
                            disabled={currentPlayer.hand.length <= 7}
                        >
                            <strong>{getTranslatedCardName(card, language)}</strong>
                            <span>${card.value}M</span>
                            <small>{getTranslatedCardType(card, language)}</small>
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
