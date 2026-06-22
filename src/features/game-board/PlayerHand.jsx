import { useEffect, useRef, useState } from "react";
import { CardView } from "../../components/CardView/CardView";
import { PROPERTY_SETS } from "../../game/data/propertySets";
import { calculateRentForGroup } from "../../game/engine/rentEngine";
import { t } from "../../i18n/translations";
import { PropertyCardActions } from "./hand-actions/PropertyCardActions";
import { MoneyActionCardActions } from "./hand-actions/MoneyActionCardActions";
import { SetModifierActions } from "./hand-actions/SetModifierActions";
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

function getPlayableRentColors(player, card) {
    return (card.meta.colors || []).filter(
        (color) => calculateRentForGroup(player, color) > 0
    );
}

function useFittedHandRow(cardCount) {
    const rowRef = useRef(null);

    useEffect(() => {
        const row = rowRef.current;
        if (!row) return undefined;

        function fitCardsToRow() {
            const firstCard = row.querySelector(".deal-card, .small-card-back");
            if (!firstCard || cardCount <= 1) {
                row.style.removeProperty("--hand-card-overlap");
                return;
            }

            const rowWidth = row.clientWidth;
            const cardWidth = firstCard.getBoundingClientRect().width;
            const styles = getComputedStyle(row);
            const defaultOverlap = Number.parseFloat(
                styles.getPropertyValue("--default-card-overlap")
            );
            const visibleCardWidth = Number.parseFloat(
                styles.getPropertyValue("--min-visible-card-width")
            );
            const maxOverlap = Math.max(0, cardWidth - visibleCardWidth);
            const neededOverlap = Math.max(
                defaultOverlap,
                (cardWidth * cardCount - rowWidth) / (cardCount - 1)
            );

            row.style.setProperty(
                "--hand-card-overlap",
                `${Math.min(maxOverlap, Math.max(0, neededOverlap))}px`
            );
        }

        fitCardsToRow();

        const resizeObserver = new ResizeObserver(fitCardsToRow);
        resizeObserver.observe(row);

        return () => resizeObserver.disconnect();
    }, [cardCount]);

    return rowRef;
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
    language,
    canUseActions = true,
}) {
    const handRowRef = useFittedHandRow(player.hand.length);
    const [choiceAction, setChoiceAction] = useState(null);
    const canAct =
        canUseActions &&
        game.status === "playing" &&
        game.turn.phase === "action" &&
        game.turn.actionsUsed < game.turn.maxActions;

    if (hideCards) {
        return (
            <section className="hand-zone">
                <h3>
                    {t(language, "bank")}: $
                    {player.bank.reduce((sum, card) => sum + card.value, 0)}M
                </h3>

                <div className="table-hand-row hidden-hand-row" ref={handRowRef}>
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

    function handlePlayProperty(card, colorOverride) {
        const availableColors = card.meta.colors || [];
        const selectedColor =
            colorOverride || selectedColors[card.instanceId] || availableColors[0];

        dispatch({
            type: "PLAY_PROPERTY",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId: card.instanceId,
                color: selectedColor,
            },
        });
        setChoiceAction(null);
    }

    function playRentCard(card) {
        const playableColors = getPlayableRentColors(currentPlayer, card);
        const selectedColor = selectedColors[card.instanceId] || playableColors[0];
        const targetPlayerId = getSelectedTargetId(
            game,
            currentPlayer,
            selectedTargets,
            card.instanceId
        );

        if (!targetPlayerId || !selectedColor) return;

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
        setChoiceAction(null);
    }

    function handlePlayMoneyActionCard(card) {
        const isBirthday = card.meta.actionType === "birthday";
        const isPassGo = card.meta.actionType === "passGo";
        const targetPlayerId = isBirthday || isPassGo
            ? undefined
            : getSelectedTargetId(
                game,
                currentPlayer,
                selectedTargets,
                card.instanceId
            );

        if (!isBirthday && !isPassGo && !targetPlayerId) return;

        dispatch({
            type: "PLAY_MONEY_ACTION_CARD",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId: card.instanceId,
                targetPlayerId,
            },
        });
    }

    function playDebtCollector(card) {
        const targetPlayerId = getSelectedTargetId(
            game,
            currentPlayer,
            selectedTargets,
            card.instanceId
        );

        if (!targetPlayerId) return;

        dispatch({
            type: "PLAY_MONEY_ACTION_CARD",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId: card.instanceId,
                targetPlayerId,
            },
        });
        setChoiceAction(null);
    }

    function playSlyDeal(card, targetPropertyCardId) {
        dispatch({
            type: "PLAY_SLY_DEAL",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId: card.instanceId,
                targetPropertyCardId,
            },
        });
        setChoiceAction(null);
    }

    function playDealBreaker(card, selectedSet) {
        dispatch({
            type: "PLAY_DEAL_BREAKER",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId: card.instanceId,
                targetPlayerId: selectedSet.playerId,
                targetGroup: selectedSet.group,
            },
        });
        setChoiceAction(null);
    }

    function playForcedDeal(card, offeredPropertyCardId, targetPropertyCardId) {
        dispatch({
            type: "PLAY_FORCED_DEAL",
            payload: {
                playerId: currentPlayer.id,
                cardInstanceId: card.instanceId,
                offeredPropertyCardId,
                targetPropertyCardId,
            },
        });
        setChoiceAction(null);
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
                {t(language, "bank")}: $
                {player.bank.reduce((sum, card) => sum + card.value, 0)}M
            </h3>

            <div className="table-hand-row" ref={handRowRef}>
                {player.hand.map((card) => {
                    const isCurrentPlayer = player.id === currentPlayer.id;
                    const isProperty = card.type === "property" || card.type === "wild";
                    const propertyColors = card.meta.colors || [];
                    const isMultiColorProperty = isProperty && propertyColors.length > 1;
                    const isRent = card.type === "rent";

                    const isDebtCollector =
                        card.type === "action" &&
                        card.meta.actionType === "debtCollector";

                    const isMoneyAction =
                        card.type === "action" &&
                        (card.meta.actionType === "birthday" ||
                            card.meta.actionType === "passGo");

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

                    const targetablePlayers = getTargetablePlayers(game, currentPlayer);
                    const requiresTargetSelection = targetablePlayers.length > 1;

                    const selectedTargetId = getSelectedTargetId(
                        game,
                        currentPlayer,
                        selectedTargets,
                        card.instanceId
                    );

                    const stealableProperties = getStealableProperties(
                        game,
                        currentPlayer
                    );

                    const stealableFullSets = getStealableFullSets(game, currentPlayer);
                    const ownProperties = getCurrentPlayerProperties(currentPlayer);
                    const forcedDealTargets = getStealableProperties(game, currentPlayer);
                    const modifierTargets = getModifierTargets(currentPlayer, card);
                    const playableRentColors = isRent
                        ? getPlayableRentColors(currentPlayer, card)
                        : [];

                    return (
                        <CardView card={card} key={card.instanceId} language={language}>
                            {isCurrentPlayer && (
                                <div className="card-actions">
                                    <button
                                        type="button"
                                        onClick={() => handleBankCard(card.instanceId)}
                                        disabled={!canAct}
                                    >
                                        {t(language, "bankCard")}
                                    </button>

                                    {isProperty && !isMultiColorProperty && (
                                        <PropertyCardActions
                                            card={card}
                                            canAct={canAct}
                                            selectedColors={selectedColors}
                                            onColorChange={handleColorChange}
                                            onPlayProperty={handlePlayProperty}
                                            language={language}
                                        />
                                    )}

                                    {isMultiColorProperty && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setChoiceAction({
                                                    type: "property",
                                                    card,
                                                    availableColors: propertyColors,
                                                })
                                            }
                                            disabled={!canAct}
                                        >
                                            {t(language, "playProperty")}
                                        </button>
                                    )}

                                    {isRent && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setChoiceAction({
                                                    type: "rent",
                                                    card,
                                                    targetablePlayers,
                                                    requiresTargetSelection,
                                                    playableRentColors,
                                                })
                                            }
                                            disabled={!canAct || playableRentColors.length === 0}
                                        >
                                            {t(language, "playRent")}
                                        </button>
                                    )}

                                    {isDebtCollector && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setChoiceAction({
                                                    type: "debtCollector",
                                                    card,
                                                    targetablePlayers,
                                                    requiresTargetSelection,
                                                })
                                            }
                                            disabled={!canAct || targetablePlayers.length === 0}
                                        >
                                            {t(language, "playAction")}
                                        </button>
                                    )}

                                    {isMoneyAction && (
                                        <MoneyActionCardActions
                                            card={card}
                                            canAct={canAct}
                                            requiresTargetSelection={false}
                                            targetablePlayers={targetablePlayers}
                                            selectedTargetId={selectedTargetId}
                                            onTargetChange={handleTargetChange}
                                            onPlayMoneyAction={handlePlayMoneyActionCard}
                                            language={language}
                                        />
                                    )}

                                    {isSlyDeal && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setChoiceAction({
                                                    type: "slyDeal",
                                                    card,
                                                    stealableProperties,
                                                })
                                            }
                                            disabled={!canAct || stealableProperties.length === 0}
                                        >
                                            {t(language, "playSlyDeal")}
                                        </button>
                                    )}

                                    {isDealBreaker && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setChoiceAction({
                                                    type: "dealBreaker",
                                                    card,
                                                    stealableFullSets,
                                                })
                                            }
                                            disabled={!canAct || stealableFullSets.length === 0}
                                        >
                                            {t(language, "playDealBreaker")}
                                        </button>
                                    )}

                                    {isForcedDeal && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setChoiceAction({
                                                    type: "forcedDeal",
                                                    card,
                                                    ownProperties,
                                                    forcedDealTargets,
                                                })
                                            }
                                            disabled={
                                                !canAct ||
                                                ownProperties.length === 0 ||
                                                forcedDealTargets.length === 0
                                            }
                                        >
                                            {t(language, "playForcedDeal")}
                                        </button>
                                    )}

                                    {isSetModifier && (
                                        <SetModifierActions
                                            card={card}
                                            canAct={canAct}
                                            modifierTargets={modifierTargets}
                                            selectedTargets={selectedTargets}
                                            onTargetChange={handleTargetChange}
                                            onPlaySetModifier={handlePlaySetModifier}
                                            language={language}
                                        />
                                    )}
                                </div>
                            )}
                        </CardView>
                    );
                })}
            </div>

            {choiceAction && (
                <div className="action-choice-backdrop">
                    <section
                        className="action-choice-modal"
                        dir={language === "ar" ? "rtl" : "ltr"}
                        role="dialog"
                        aria-modal="true"
                    >
                        <h2>{choiceAction.card.name}</h2>

                        {choiceAction.type === "property" && (
                            <div className="action-choice-form">
                                <label>
                                    {t(language, "property")}
                                    <select
                                        value={
                                            selectedColors[
                                                choiceAction.card.instanceId
                                            ] || choiceAction.availableColors[0]
                                        }
                                        onChange={(event) =>
                                            handleColorChange(
                                                choiceAction.card.instanceId,
                                                event.target.value
                                            )
                                        }
                                    >
                                        {choiceAction.availableColors.map((color) => (
                                            <option value={color} key={color}>
                                                {formatColorName(color)}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handlePlayProperty(
                                            choiceAction.card,
                                            selectedColors[
                                                choiceAction.card.instanceId
                                            ] || choiceAction.availableColors[0]
                                        )
                                    }
                                >
                                    {t(language, "playProperty")}
                                </button>
                            </div>
                        )}

                        {choiceAction.type === "debtCollector" && (
                            <div className="action-choice-form">
                                {choiceAction.requiresTargetSelection && (
                                    <label>
                                        {t(language, "target")}
                                        <select
                                            value={getSelectedTargetId(
                                                game,
                                                currentPlayer,
                                                selectedTargets,
                                                choiceAction.card.instanceId
                                            )}
                                            onChange={(event) =>
                                                handleTargetChange(
                                                    choiceAction.card.instanceId,
                                                    event.target.value
                                                )
                                            }
                                        >
                                            {choiceAction.targetablePlayers.map(
                                                (targetPlayer) => (
                                                    <option
                                                        value={targetPlayer.id}
                                                        key={targetPlayer.id}
                                                    >
                                                        {targetPlayer.name}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>
                                )}

                                <button
                                    type="button"
                                    onClick={() => playDebtCollector(choiceAction.card)}
                                >
                                    {t(language, "playAction")}
                                </button>
                            </div>
                        )}

                        {choiceAction.type === "rent" && (
                            <div className="action-choice-form">
                                {choiceAction.requiresTargetSelection && (
                                    <label>
                                        {t(language, "target")}
                                        <select
                                            value={getSelectedTargetId(
                                                game,
                                                currentPlayer,
                                                selectedTargets,
                                                choiceAction.card.instanceId
                                            )}
                                            onChange={(event) =>
                                                handleTargetChange(
                                                    choiceAction.card.instanceId,
                                                    event.target.value
                                                )
                                            }
                                        >
                                            {choiceAction.targetablePlayers.map(
                                                (targetPlayer) => (
                                                    <option
                                                        value={targetPlayer.id}
                                                        key={targetPlayer.id}
                                                    >
                                                        {targetPlayer.name}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>
                                )}

                                {choiceAction.playableRentColors.length > 1 && (
                                    <label>
                                        {t(language, "rent")}
                                        <select
                                            value={
                                                selectedColors[
                                                    choiceAction.card.instanceId
                                                ] || choiceAction.playableRentColors[0]
                                            }
                                            onChange={(event) =>
                                                handleColorChange(
                                                    choiceAction.card.instanceId,
                                                    event.target.value
                                                )
                                            }
                                        >
                                            {choiceAction.playableRentColors.map(
                                                (color) => (
                                                    <option value={color} key={color}>
                                                        {formatColorName(color)}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>
                                )}

                                {getDoubleRentCards(currentPlayer).map(
                                    (doubleRentCard) => (
                                        <label
                                            className="checkbox-row"
                                            key={doubleRentCard.instanceId}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={Boolean(
                                                    selectedTargets[
                                                        `${choiceAction.card.instanceId}_double_${doubleRentCard.instanceId}`
                                                    ]
                                                )}
                                                onChange={(event) =>
                                                    handleTargetChange(
                                                        `${choiceAction.card.instanceId}_double_${doubleRentCard.instanceId}`,
                                                        event.target.checked
                                                    )
                                                }
                                            />
                                            {t(language, "use")} {doubleRentCard.name}
                                        </label>
                                    )
                                )}

                                <button
                                    type="button"
                                    onClick={() => playRentCard(choiceAction.card)}
                                    disabled={
                                        choiceAction.playableRentColors.length === 0
                                    }
                                >
                                    {t(language, "playRent")}
                                </button>
                            </div>
                        )}

                        {choiceAction.type === "slyDeal" && (
                            <div className="action-choice-list">
                                {choiceAction.stealableProperties.map((item) => (
                                    <button
                                        type="button"
                                        key={item.card.instanceId}
                                        onClick={() =>
                                            playSlyDeal(
                                                choiceAction.card,
                                                item.card.instanceId
                                            )
                                        }
                                    >
                                        {t(language, "steal")} {item.card.name}{" "}
                                        {t(language, "from")} {item.playerName}
                                    </button>
                                ))}
                            </div>
                        )}

                        {choiceAction.type === "dealBreaker" && (
                            <div className="action-choice-list">
                                {choiceAction.stealableFullSets.map((item) => (
                                    <button
                                        type="button"
                                        key={item.label}
                                        onClick={() =>
                                            playDealBreaker(choiceAction.card, item)
                                        }
                                    >
                                        {t(language, "steal")} {item.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {choiceAction.type === "forcedDeal" && (
                            <div className="action-choice-form">
                                <label>
                                    {t(language, "give")}
                                    <select
                                        value={
                                            selectedTargets[
                                                `${choiceAction.card.instanceId}_modal_offered`
                                            ] || choiceAction.ownProperties[0]?.card.instanceId
                                        }
                                        onChange={(event) =>
                                            handleTargetChange(
                                                `${choiceAction.card.instanceId}_modal_offered`,
                                                event.target.value
                                            )
                                        }
                                    >
                                        {choiceAction.ownProperties.map((item) => (
                                            <option
                                                value={item.card.instanceId}
                                                key={item.card.instanceId}
                                            >
                                                {item.card.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    {t(language, "take")}
                                    <select
                                        value={
                                            selectedTargets[
                                                `${choiceAction.card.instanceId}_modal_target`
                                            ] || choiceAction.forcedDealTargets[0]?.card.instanceId
                                        }
                                        onChange={(event) =>
                                            handleTargetChange(
                                                `${choiceAction.card.instanceId}_modal_target`,
                                                event.target.value
                                            )
                                        }
                                    >
                                        {choiceAction.forcedDealTargets.map((item) => (
                                            <option
                                                value={item.card.instanceId}
                                                key={item.card.instanceId}
                                            >
                                                {item.card.name} {t(language, "from")}{" "}
                                                {item.playerName}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <button
                                    type="button"
                                    onClick={() =>
                                        playForcedDeal(
                                            choiceAction.card,
                                            selectedTargets[
                                                `${choiceAction.card.instanceId}_modal_offered`
                                            ] || choiceAction.ownProperties[0]?.card.instanceId,
                                            selectedTargets[
                                                `${choiceAction.card.instanceId}_modal_target`
                                            ] ||
                                                choiceAction.forcedDealTargets[0]?.card
                                                    .instanceId
                                        )
                                    }
                                >
                                    {t(language, "playForcedDeal")}
                                </button>
                            </div>
                        )}

                        <button
                            type="button"
                            className="action-choice-cancel"
                            onClick={() => setChoiceAction(null)}
                        >
                            Cancel
                        </button>
                    </section>
                </div>
            )}
        </section>
    );
}
