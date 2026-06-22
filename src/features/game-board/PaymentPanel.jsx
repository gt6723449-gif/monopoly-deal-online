import { useState } from "react";
import { PROPERTY_SETS } from "../../game/data/propertySets";
import { t } from "../../i18n/translations";

function formatColorName(color) {
    return PROPERTY_SETS[color]?.label || color;
}

export function PaymentPanel({ game, dispatch, language }) {
    const [selectedCardIds, setSelectedCardIds] = useState([]);

    const pendingPayment = game.pendingPayment;

    if (!pendingPayment) {
        return null;
    }

    const payer = game.players.find(
        (player) => player.id === pendingPayment.fromPlayerId
    );

    const receiver = game.players.find(
        (player) => player.id === pendingPayment.toPlayerId
    );

    if (!payer || !receiver) {
        return null;
    }

    if (payer.id !== game.humanPlayerId) {
        return null;
    }

    const payablePropertyCards = Object.keys(payer.properties).flatMap((group) =>
        payer.properties[group].map((card) => ({
            ...card,
            paymentSource: "property",
            paymentGroup: group,
        }))
    );

    const payableBankCards = payer.bank.map((card) => ({
        ...card,
        paymentSource: "bank",
    }));

    const payableCards = [...payableBankCards, ...payablePropertyCards];

    const selectedCards = payableCards.filter((card) =>
        selectedCardIds.includes(card.instanceId)
    );

    const selectedTotal = selectedCards.reduce((sum, card) => sum + card.value, 0);

    const totalPayableAssets = payableCards.reduce(
        (sum, card) => sum + card.value,
        0
    );

    const minimumRequiredPayment = Math.min(
        pendingPayment.amount,
        totalPayableAssets
    );

    function toggleCard(cardInstanceId) {
        setSelectedCardIds((current) => {
            if (current.includes(cardInstanceId)) {
                return current.filter((id) => id !== cardInstanceId);
            }

            return [...current, cardInstanceId];
        });
    }

    function handlePayAll() {
        setSelectedCardIds(payableCards.map((card) => card.instanceId));
    }

    function handlePayDebt() {
        dispatch({
            type: "PAY_DEBT",
            payload: {
                playerId: payer.id,
                paymentCardIds: selectedCardIds,
            },
        });

        setSelectedCardIds([]);
    }

    return (
        <div className="payment-modal-backdrop">
            <section
                className="payment-panel payment-modal"
                dir={language === "ar" ? "rtl" : "ltr"}
                role="dialog"
                aria-modal="true"
                aria-labelledby="payment-panel-title"
            >
                <h2 id="payment-panel-title">{t(language, "paymentRequired")}</h2>

                <p className="payment-summary">
                    <strong>{payer.name}</strong> {t(language, "owes")}{" "}
                    <strong>${pendingPayment.amount}M</strong> {t(language, "to")}{" "}
                    <strong>{receiver.name}</strong>.
                </p>

                <div className="payment-totals">
                    <span>
                        {t(language, "requiredPayment")}:{" "}
                        <strong>${minimumRequiredPayment}M</strong>
                    </span>
                    <span>
                        {t(language, "selectedPayment")}:{" "}
                        <strong>${selectedTotal}M</strong>
                    </span>
                </div>

                <div className="payment-card-grid">
                    {payableCards.map((card) => {
                        const isSelected = selectedCardIds.includes(card.instanceId);

                        return (
                            <button
                                type="button"
                                key={card.instanceId}
                                className={
                                    isSelected
                                        ? "payment-card selected-payment-card"
                                        : "payment-card"
                                }
                                onClick={() => toggleCard(card.instanceId)}
                            >
                                <strong>{card.name}</strong>
                                <span>${card.value}M</span>
                                <small>
                                    {card.paymentSource === "bank"
                                        ? t(language, "bank")
                                        : `${t(language, "property")}: ${formatColorName(
                                            card.paymentGroup
                                        )}`}
                                </small>
                            </button>
                        );
                    })}
                </div>

                {payableCards.length === 0 && (
                    <p className="notice">
                        {payer.name} {t(language, "noAssetsToPay")}
                    </p>
                )}

                <div className="payment-actions">
                    <button
                        type="button"
                        onClick={handlePayAll}
                        disabled={payableCards.length === 0}
                    >
                        {t(language, "payAll")}
                    </button>

                    <button
                        type="button"
                        onClick={handlePayDebt}
                        disabled={selectedTotal < minimumRequiredPayment}
                    >
                        {t(language, "payDebt")}
                    </button>
                </div>
            </section>
        </div>
    );
}
