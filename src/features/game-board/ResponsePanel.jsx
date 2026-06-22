import { t } from "../../i18n/translations";

export function ResponsePanel({ game, dispatch, language }) {
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
        (card) => card.type === "action" && card.meta.actionType === "justSayNo"
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
        <section className="response-panel" dir={language === "ar" ? "rtl" : "ltr"}>
            <h2>{t(language, "responseNeeded")}</h2>

            <p>
                <strong>{respondingPlayer.name}</strong> {t(language, "canRespondTo")}{" "}
                <strong>{pendingAction.sourceCard.name}</strong>.
            </p>

            {justSayNoCard ? (
                <button type="button" onClick={handlePlayJustSayNo}>
                    {t(language, "playJustSayNo")}
                </button>
            ) : (
                <p>{t(language, "noJustSayNo")}</p>
            )}

            <button type="button" onClick={handleDecline}>
                {t(language, "doNotBlock")}
            </button>
        </section>
    );
}