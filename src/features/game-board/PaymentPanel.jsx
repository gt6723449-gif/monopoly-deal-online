import { useState } from "react";
import { PROPERTY_SETS } from "../../game/data/propertySets";

function formatColorName(color) {
    return PROPERTY_SETS[color]?.label || color;
}

export function PaymentPanel({ game, dispatch }) {
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
        <section className="payment-panel">
            <h2>Payment Required</h2>

            <p>
                <strong>{payer.name}</strong> owes <strong>${pendingPayment.amount}M</strong>{" "}
                to <strong>{receiver.name}</strong>.
            </p>

            <p>
                Reason: <strong>{pendingPayment.reason}</strong>
            </p>

            <p>
                Selected payment: <strong>${selectedTotal}M</strong>
            </p>

            <p>
                Available assets: <strong>${totalPayableAssets}M</strong>
            </p>

            <p>
                Required payment: <strong>${minimumRequiredPayment}M</strong>
            </p>

            <p className="small-note">
                You can only pay with bank cards or properties already on the table.
                Cards in hand cannot be used.
            </p>

            <div className="payment-card-grid">
                {payableCards.map((card) => {
                    const isSelected = selectedCardIds.includes(card.instanceId);

                    return (
                        <button
                            type="button"
                            key={card.instanceId}
                            className={isSelected ? "payment-card selected-payment-card" : "payment-card"}
                            onClick={() => toggleCard(card.instanceId)}
                        >
                            <strong>{card.name}</strong>
                            <span>${card.value}M</span>
                            <small>
                                {card.paymentSource === "bank"
                                    ? "Bank"
                                    : `Property: ${formatColorName(card.paymentGroup)}`}
                            </small>
                        </button>
                    );
                })}
            </div>

            {payableCards.length === 0 && (
                <p className="notice">
                    {payer.name} has no bank cards or properties to pay with.
                </p>
            )}

            <div className="payment-actions">
                <button
                    type="button"
                    onClick={handlePayAll}
                    disabled={payableCards.length === 0}
                >
                    Pay All
                </button>

                <button
                    type="button"
                    onClick={handlePayDebt}
                    disabled={selectedTotal < minimumRequiredPayment}
                >
                    Pay Debt
                </button>
            </div>
        </section>
    );
}