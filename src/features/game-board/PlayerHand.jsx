import { CardView } from "../../components/CardView/CardView";
import { PROPERTY_SETS } from "../../game/data/propertySets";
import { PropertyCardActions } from "./hand-actions/PropertyCardActions";
import { RentCardActions } from "./hand-actions/RentCardActions";
import { DealBreakerActions } from "./hand-actions/DealBreakerActions";
import { ForcedDealActions } from "./hand-actions/ForcedDealActions";
import { MoneyActionCardActions } from "./hand-actions/MoneyActionCardActions";
import { SetModifierActions } from "./hand-actions/SetModifierActions";
import { SlyDealActions } from "./hand-actions/SlyDealActions";
import {
    getCurrentPlayerProperties,
    getDoubleRentCards,
    getModifierTargets,
    getSelectedTargetId,
    getStealableFullSets,
    getStealableProperties,
    getTargetablePlayers,
} from "./playerHandHelpers";

function formatColorName(color) {
    return PROPERTY_SETS[color]?.label || color;
}

export function PlayerHand({
    player,
    currentPlayer,
    game,
    dispatch,
    hideCards = false,
    selectedColors,
    setSelectedColors,
    selectedTargets,
    setSelectedTargets,
}) {
    const canAct =
        game.status === "playing" &&
        game.turn.phase === "action" &&
        game.turn.actionsUsed < game.turn.maxActions;

    if (hideCards) {
        return (
            <section className="hand-zone">
                <h3>
                    Bank: ${player.bank.reduce((sum, card) => sum + card.value, 0)}M
                </h3>

                <div className="table-hand-row">
                    {player.hand.map((card) => (
                        <div className="card-back small-card-back" key={card.instanceId}>
                            DEAL
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    function handleColorChange(cardInstanceId, color) {
        setSelectedColors((current) => ({
            ...current,
            [cardInstanceId]: color,
        }));
    }

    function handleTargetChange(cardInstanceId, value) {
        setSelectedTargets((current) => ({
            ...current,
            [cardInstanceId]: value,
        }));
    }

    function handleBankCard(cardInstanceId) {
        dispatch({
            type: "BANK_CARD",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId,
            },
        });
    }

    function handlePlayProperty(card) {
        const availableColors = card.meta.colors || [];
        const selectedColor = selectedColors[card.instanceId] || availableColors[0];

        dispatch({
            type: "PLAY_PROPERTY",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId: card.instanceId,
                color: selectedColor,
            },
        });
    }

    function handlePlayRentCard(card) {
        const availableColors = card.meta.colors || [];
        const selectedColor = selectedColors[card.instanceId] || availableColors[0];
        const targetPlayerId = getSelectedTargetId(game, currentPlayer, selectedTargets, card.instanceId)

        if (!targetPlayerId) return;

        const doubleRentCardIds = currentPlayer.hand
            .filter(
                (handCard) =>
                    handCard.type === "action" &&
                    handCard.meta.actionType === "doubleRent" &&
                    selectedTargets[`${card.instanceId}_double_${handCard.instanceId}`]
            )
            .map((handCard) => handCard.instanceId)
            .slice(0, 2);

        dispatch({
            type: "PLAY_RENT_CARD",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId: card.instanceId,
                targetPlayerId,
                color: selectedColor,
                doubleRentCardIds,
            },
        });
    }

    function handlePlayMoneyActionCard(card) {
        const targetPlayerId = getSelectedTargetId(game, currentPlayer, selectedTargets, card.instanceId)

        if (!targetPlayerId) return;

        dispatch({
            type: "PLAY_MONEY_ACTION_CARD",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId: card.instanceId,
                targetPlayerId,
            },
        });
    }


    function handlePlaySlyDeal(card) {
        const stealableProperties = getStealableProperties(game, currentPlayer);
        const targetPropertyCardId =
            selectedTargets[card.instanceId] || stealableProperties[0]?.card.instanceId;

        if (!targetPropertyCardId) return;

        dispatch({
            type: "PLAY_SLY_DEAL",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId: card.instanceId,
                targetPropertyCardId,
            },
        });
    }


    function handlePlayDealBreaker(card) {
        const stealableSets = getStealableFullSets(game, currentPlayer);
        const selectedValue =
            selectedTargets[card.instanceId] || stealableSets[0]?.label;

        const selectedSet = stealableSets.find(
            (item) => item.label === selectedValue
        );

        if (!selectedSet) return;

        dispatch({
            type: "PLAY_DEAL_BREAKER",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId: card.instanceId,
                targetPlayerId: selectedSet.playerId,
                targetGroup: selectedSet.group,
            },
        });
    }

    function handlePlayForcedDeal(card) {
        const ownProperties = getCurrentPlayerProperties(currentPlayer);
        const targetProperties = getStealableProperties(game, currentPlayer);

        const offeredPropertyCardId =
            selectedTargets[`${card.instanceId}_offered`] ||
            ownProperties[0]?.card.instanceId;

        const targetPropertyCardId =
            selectedTargets[`${card.instanceId}_target`] ||
            targetProperties[0]?.card.instanceId;

        if (!offeredPropertyCardId || !targetPropertyCardId) return;

        dispatch({
            type: "PLAY_FORCED_DEAL",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId: card.instanceId,
                offeredPropertyCardId,
                targetPropertyCardId,
            },
        });
    }

    function handlePlaySetModifier(card) {
        const targets = getModifierTargets(currentPlayer, card);
        const selectedGroup = selectedTargets[card.instanceId] || targets[0]?.group;

        if (!selectedGroup) return;

        dispatch({
            type: "PLAY_SET_MODIFIER",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId: card.instanceId,
                targetGroup: selectedGroup,
            },
        });
    }

    return (
        <section className="hand-zone">
            <h3>
                Bank: ${player.bank.reduce((sum, card) => sum + card.value, 0)}M
            </h3>

            <div className="table-hand-row">
                {player.hand.map((card) => {
                    const isCurrentPlayer = player.id === currentPlayer.id;
                    const isProperty = card.type === "property" || card.type === "wild";
                    const isRent = card.type === "rent";

                    const isMoneyAction =
                        card.type === "action" &&
                        (card.meta.actionType === "debtCollector" ||
                            card.meta.actionType === "birthday");

                    const isSlyDeal =
                        card.type === "action" && card.meta.actionType === "slyDeal";

                    const isDealBreaker =
                        card.type === "action" && card.meta.actionType === "dealBreaker";

                    const isForcedDeal =
                        card.type === "action" && card.meta.actionType === "forcedDeal";

                    const isSetModifier =
                        card.type === "action" &&
                        (card.meta.actionType === "house" ||
                            card.meta.actionType === "hotel");

                    const availableColors = card.meta.colors || [];
                    const selectedColor =
                        selectedColors[card.instanceId] || availableColors[0];

                    const targetablePlayers = getTargetablePlayers(game, currentPlayer);

                    const requiresTargetSelection = targetablePlayers.length > 1;
                    const selectedTargetId = getSelectedTargetId(game, currentPlayer, selectedTargets, card.instanceId)
                    const stealableProperties = getStealableProperties(game, currentPlayer);
                    const stealableFullSets = getStealableFullSets(game, currentPlayer);
                    const ownProperties = getCurrentPlayerProperties(currentPlayer);
                    const forcedDealTargets = getStealableProperties(game, currentPlayer);
                    const modifierTargets = getModifierTargets(currentPlayer, card);

                    return (
                        <CardView card={card} key={card.instanceId}>
                            {isCurrentPlayer && (
                                <div className="card-actions">
                                    <button
                                        type="button"
                                        onClick={() => handleBankCard(card.instanceId)}
                                        disabled={!canAct}
                                    >
                                        Bank
                                    </button>

                                    {isProperty && (
                                        <PropertyCardActions
                                            card={card}
                                            canAct={canAct}
                                            selectedColors={selectedColors}
                                            onColorChange={handleColorChange}
                                            onPlayProperty={handlePlayProperty}
                                        />
                                    )}

                                    {isRent && (
                                        <RentCardActions
                                            card={card}
                                            canAct={canAct}
                                            currentPlayer={currentPlayer}
                                            targetablePlayers={targetablePlayers}
                                            requiresTargetSelection={requiresTargetSelection}
                                            selectedColors={selectedColors}
                                            selectedTargets={selectedTargets}
                                            selectedTargetId={selectedTargetId}
                                            onColorChange={handleColorChange}
                                            onTargetChange={handleTargetChange}
                                            onPlayRent={handlePlayRentCard}
                                        />
                                    )}

                                    {isMoneyAction && (
                                        <MoneyActionCardActions
                                            card={card}
                                            canAct={canAct}
                                            requiresTargetSelection={requiresTargetSelection}
                                            targetablePlayers={targetablePlayers}
                                            selectedTargetId={selectedTargetId}
                                            onTargetChange={handleTargetChange}
                                            onPlayMoneyAction={handlePlayMoneyActionCard}
                                        />
                                    )}

                                    {isSlyDeal && (
                                        <SlyDealActions
                                            card={card}
                                            canAct={canAct}
                                            stealableProperties={stealableProperties}
                                            selectedTargets={selectedTargets}
                                            onTargetChange={handleTargetChange}
                                            onPlaySlyDeal={handlePlaySlyDeal}
                                        />
                                    )}

                                    {isDealBreaker && (
                                        <DealBreakerActions
                                            card={card}
                                            canAct={canAct}
                                            stealableFullSets={stealableFullSets}
                                            selectedTargets={selectedTargets}
                                            onTargetChange={handleTargetChange}
                                            onPlayDealBreaker={handlePlayDealBreaker}
                                        />
                                    )}

                                    {isForcedDeal && (
                                        <ForcedDealActions
                                            card={card}
                                            canAct={canAct}
                                            ownProperties={ownProperties}
                                            forcedDealTargets={forcedDealTargets}
                                            selectedTargets={selectedTargets}
                                            onTargetChange={handleTargetChange}
                                            onPlayForcedDeal={handlePlayForcedDeal}
                                        />
                                    )}

                                    {isSetModifier && (
                                        <SetModifierActions
                                            card={card}
                                            canAct={canAct}
                                            modifierTargets={modifierTargets}
                                            selectedTargets={selectedTargets}
                                            onTargetChange={handleTargetChange}
                                            onPlaySetModifier={handlePlaySetModifier}
                                        />
                                    )}
                                </div>
                            )}
                        </CardView>
                    );
                })}
            </div>
        </section>
    );
}