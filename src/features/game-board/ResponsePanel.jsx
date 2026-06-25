import { useEffect } from "react";
import { CardView } from "../../components/CardView/CardView";
import { t } from "../../i18n/translations";

const RESPONSE_SECONDS = 30;

export function ResponsePanel({ game, dispatch, language }) {
    const pendingAction = game.pendingAction;
    const respondingPlayerId = pendingAction?.responsePlayerIds[0];

    const respondingPlayer = game.players.find(
        (player) => player.id === respondingPlayerId
    );

    const justSayNoCard = respondingPlayer?.hand.find(
        (card) => card.type === "action" && card.meta.actionType === "justSayNo"
    );
    const actionPlayer = game.players.find(
        (player) => player.id === pendingAction?.actionPlayerId
    );

    function handleDecline() {
        if (!respondingPlayer) return;

        dispatch({
            type: "DECLINE_JUST_SAY_NO",
            payload: {
                playerId: respondingPlayer.id,
            },
        });
    }

    function handlePlayJustSayNo() {
        if (!respondingPlayer) return;
        if (!justSayNoCard) return;

        dispatch({
            type: "PLAY_JUST_SAY_NO",
            payload: {
                playerId: respondingPlayer.id,
                cardInstanceId: justSayNoCard.instanceId,
            },
        });
    }

    useEffect(() => {
        if (!pendingAction || !respondingPlayer) return undefined;
        if (respondingPlayer.id !== game.humanPlayerId) return undefined;

        const timeoutId = window.setTimeout(handleDecline, RESPONSE_SECONDS * 1000);

        return () => window.clearTimeout(timeoutId);
    }, [pendingAction?.id, respondingPlayer?.id, game.humanPlayerId]);

    if (!pendingAction || !respondingPlayer) {
        return null;
    }

    if (respondingPlayer.id !== game.humanPlayerId) {
        return null;
    }

    return (
        <div className="response-modal-backdrop">
            <section
                className="response-panel response-modal"
                dir={language === "ar" ? "rtl" : "ltr"}
                role="dialog"
                aria-modal="true"
                aria-labelledby="response-panel-title"
            >
                <h2 id="response-panel-title">
                    {(actionPlayer?.name || t(language, "playerName"))}{" "}
                    {t(language, "played")}{" "}
                    {t(language, `cardName.${pendingAction.sourceCard.id}`)}{" "}
                    {t(language, "onYou")}
                </h2>

                {justSayNoCard ? (
                    <>
                        <p className="response-have-card">{t(language, "youHave")}:</p>
                        <div className="response-just-say-no-card">
                            <CardView card={justSayNoCard} language={language} />
                        </div>
                    </>
                ) : (
                    <p>{t(language, "noJustSayNo")}</p>
                )}

                <div className="response-actions">
                    {justSayNoCard && (
                        <button type="button" onClick={handlePlayJustSayNo}>
                            {t(language, "playJustSayNo")}
                        </button>
                    )}

                    <button type="button" onClick={handleDecline}>
                        {t(language, "doNotBlock")}
                    </button>
                </div>
            </section>
        </div>
    );
}
