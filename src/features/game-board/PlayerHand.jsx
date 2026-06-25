import { useEffect, useRef, useState } from "react";
import { CardView } from "../../components/CardView/CardView";
import { PROPERTY_SETS } from "../../game/data/propertySets";
import { calculateRentForGroup } from "../../game/engine/rentEngine";
import { t } from "../../i18n/translations";
import {
    getCurrentPlayerProperties,
    getDoubleRentCards,
    getModifierTargets,
    getSelectedTargetId,
    getStealableFullSets,
    getStealableProperties,
    getTargetablePlayers,
} from "./playerHandHelpers";

const PROPERTY_COLORS = {
    brown: "#8b4513",
    lightBlue: "#8ed8f8",
    pink: "#ff5aa5",
    orange: "#f97316",
    red: "#dc2626",
    yellow: "#facc15",
    green: "#16a34a",
    darkBlue: "#1d4ed8",
    railroad: "#111827",
    utility: "#94a3b8",
};

function formatColorName(color) {
    return PROPERTY_SETS[color]?.label || color;
}

function getPlayableRentColors(player, card) {
    return (card.meta.colors || []).filter(
        (color) => calculateRentForGroup(player, color) > 0
    );
}

function getCardColor(card, fallbackGroup) {
    return PROPERTY_COLORS[card.meta?.activeColor] || PROPERTY_COLORS[fallbackGroup] || "#cbd5e1";
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
    const [dragState, setDragState] = useState(null);
    const canAct =
        canUseActions &&
        game.status === "playing" &&
        game.turn.phase === "action" &&
        game.turn.actionsUsed < game.turn.maxActions;

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

    useEffect(() => {
        if (!choiceAction) return undefined;

        function handlePlayerTarget(event) {
            const playerId = event.detail?.playerId;

            if (!playerId || playerId === currentPlayer.id) return;

            if (choiceAction.type === "debtCollector") {
                playDebtCollector(choiceAction.card, playerId);
                return;
            }

            if (choiceAction.type === "rent") {
                if (choiceAction.playableRentColors.length === 1) {
                    playRentCard(choiceAction.card, playerId, choiceAction.playableRentColors[0]);
                    return;
                }

                handleTargetChange(choiceAction.card.instanceId, playerId);
                return;
            }

            if (choiceAction.type === "slyDeal") {
                const targetProperties = choiceAction.stealableProperties.filter(
                    (item) => item.playerId === playerId
                );

                if (targetProperties.length === 1) {
                    playSlyDeal(choiceAction.card, targetProperties[0].card.instanceId);
                    return;
                }

                handleTargetChange(choiceAction.card.instanceId, playerId);
                return;
            }

            if (choiceAction.type === "dealBreaker") {
                const targetSets = choiceAction.stealableFullSets.filter(
                    (item) => item.playerId === playerId
                );

                if (targetSets.length === 1) {
                    playDealBreaker(choiceAction.card, targetSets[0]);
                    return;
                }

                handleTargetChange(choiceAction.card.instanceId, playerId);
                return;
            }

            if (choiceAction.type === "forcedDeal") {
                const targetProperties = choiceAction.forcedDealTargets.filter(
                    (item) => item.playerId === playerId
                );
                const offeredCardId =
                    selectedTargets[`${choiceAction.card.instanceId}_modal_offered`] ||
                    choiceAction.ownProperties[0]?.card.instanceId;

                if (
                    choiceAction.ownProperties.length === 1 &&
                    targetProperties.length === 1 &&
                    offeredCardId
                ) {
                    playForcedDeal(
                        choiceAction.card,
                        offeredCardId,
                        targetProperties[0].card.instanceId
                    );
                    return;
                }

                handleTargetChange(choiceAction.card.instanceId, playerId);
            }
        }

        window.addEventListener("monopoly-deal-player-target", handlePlayerTarget);

        return () => {
            window.removeEventListener("monopoly-deal-player-target", handlePlayerTarget);
        };
    }, [choiceAction, currentPlayer.id, selectedTargets]);

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

    function playRentCard(card, targetOverride, colorOverride) {
        const playableColors = getPlayableRentColors(currentPlayer, card);
        const selectedColor =
            colorOverride || selectedColors[card.instanceId] || playableColors[0];
        const targetPlayerId =
            targetOverride ||
            getSelectedTargetId(
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

    function playDebtCollector(card, targetOverride) {
        const targetPlayerId =
            targetOverride ||
            getSelectedTargetId(
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

    function getChoiceTargetId(action = choiceAction) {
        return selectedTargets[action.card.instanceId] || action.initialTargetId;
    }

    function isWaitingForPlayerTarget(action = choiceAction) {
        if (!action) return false;

        return (
            (action.type === "rent" ||
                action.type === "debtCollector" ||
                action.type === "slyDeal" ||
                action.type === "forcedDeal" ||
                action.type === "dealBreaker") &&
            !getChoiceTargetId(action)
        );
    }

    const isChoosingPlayerTarget = isWaitingForPlayerTarget(choiceAction);

    useEffect(() => {
        document.body.classList.toggle("is-targeting-player", isChoosingPlayerTarget);

        return () => {
            document.body.classList.remove("is-targeting-player");
        };
    }, [isChoosingPlayerTarget]);

    function getTargetedStealableProperties(action = choiceAction) {
        const targetId = getChoiceTargetId(action);

        return action.stealableProperties.filter(
            (item) => !targetId || item.playerId === targetId
        );
    }

    function getTargetedForcedDealCards(action = choiceAction) {
        const targetId = getChoiceTargetId(action);

        return action.forcedDealTargets.filter(
            (item) => !targetId || item.playerId === targetId
        );
    }

    function getTargetedFullSets(action = choiceAction) {
        const targetId = getChoiceTargetId(action);

        return action.stealableFullSets.filter(
            (item) => !targetId || item.playerId === targetId
        );
    }

    function resolveChoiceActionDefault(action = choiceAction) {
        if (!action) return false;

        if (action.type === "property") {
            handlePlayProperty(
                action.card,
                selectedColors[action.card.instanceId] || action.availableColors[0]
            );
            return true;
        }

        if (action.type === "rent") {
            const targetPlayerId =
                getChoiceTargetId(action) || action.targetablePlayers[0]?.id;
            const color =
                selectedColors[action.card.instanceId] ||
                action.playableRentColors[0];

            if (!targetPlayerId || !color) return false;

            handleTargetChange(action.card.instanceId, targetPlayerId);
            playRentCard(action.card, targetPlayerId, color);
            return true;
        }

        if (action.type === "debtCollector") {
            const targetPlayerId =
                getChoiceTargetId(action) || action.targetablePlayers[0]?.id;

            if (!targetPlayerId) return false;

            handleTargetChange(action.card.instanceId, targetPlayerId);
            playDebtCollector(action.card, targetPlayerId);
            return true;
        }

        if (action.type === "slyDeal") {
            const firstTarget = getTargetedStealableProperties(action)[0];

            if (!firstTarget) return false;

            playSlyDeal(action.card, firstTarget.card.instanceId);
            return true;
        }

        if (action.type === "dealBreaker") {
            const firstSet = getTargetedFullSets(action)[0];

            if (!firstSet) return false;

            playDealBreaker(action.card, firstSet);
            return true;
        }

        if (action.type === "forcedDeal") {
            const offeredCardId = action.ownProperties[0]?.card.instanceId;
            const targetCardId = getTargetedForcedDealCards(action)[0]?.card.instanceId;

            if (!offeredCardId || !targetCardId) return false;

            playForcedDeal(action.card, offeredCardId, targetCardId);
            return true;
        }

        return false;
    }

    useEffect(() => {
        if (!choiceAction) return undefined;

        function handleTurnExpire(event) {
            if (event.detail?.playerId !== currentPlayer.id) return;
            if (!resolveChoiceActionDefault(choiceAction)) return;

            event.preventDefault();
        }

        window.addEventListener("monopoly-deal-turn-expire", handleTurnExpire);

        return () => {
            window.removeEventListener("monopoly-deal-turn-expire", handleTurnExpire);
        };
    }, [choiceAction, currentPlayer.id, selectedColors, selectedTargets]);

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

    function getDropZoneFromPoint(clientX, clientY) {
        const target = document.elementFromPoint(clientX, clientY);
        if (!target) return null;

        if (target.closest(".bottom-bank-card, .hand-zone h3")) return "bank";
        if (target.closest(".table-zone")) return "property";
        if (target.closest(".table-center")) return "table";

        return null;
    }

    function playCardFromDrop(card, zone) {
        if (!canAct || !zone) return;

        const isProperty = card.type === "property" || card.type === "wild";
        const propertyColors = card.meta.colors || [];
        const isMultiColorProperty = isProperty && propertyColors.length > 1;
        const targetablePlayers = getTargetablePlayers(game, currentPlayer);
        const requiresTargetSelection = targetablePlayers.length > 1;

        if (zone === "bank") {
            handleBankCard(card.instanceId);
            return;
        }

        if (zone === "property") {
            if (isProperty && !isMultiColorProperty) {
                handlePlayProperty(card);
                return;
            }

            if (isMultiColorProperty) {
                setChoiceAction({
                    type: "property",
                    card,
                    availableColors: propertyColors,
                });
                return;
            }

            if (
                card.type === "action" &&
                (card.meta.actionType === "house" || card.meta.actionType === "hotel")
            ) {
                handlePlaySetModifier(card);
            }

            return;
        }

        if (zone !== "table") return;

        if (card.type === "money") {
            handleBankCard(card.instanceId);
            return;
        }

        if (card.type === "rent") {
            const onlyTarget = targetablePlayers.length === 1 ? targetablePlayers[0] : null;

            setChoiceAction({
                type: "rent",
                card,
                targetablePlayers,
                requiresTargetSelection,
                initialTargetId: onlyTarget?.id,
                playableRentColors: getPlayableRentColors(currentPlayer, card),
            });
            return;
        }

        if (card.type !== "action") return;

        if (
            card.meta.actionType === "birthday" ||
            card.meta.actionType === "passGo"
        ) {
            handlePlayMoneyActionCard(card);
            return;
        }

        if (card.meta.actionType === "debtCollector") {
            const onlyTarget = targetablePlayers.length === 1 ? targetablePlayers[0] : null;

            if (onlyTarget) {
                playDebtCollector(card, onlyTarget.id);
                return;
            }

            setChoiceAction({
                type: "debtCollector",
                card,
                targetablePlayers,
                requiresTargetSelection,
            });
            return;
        }

        if (card.meta.actionType === "slyDeal") {
            const onlyTarget = targetablePlayers.length === 1 ? targetablePlayers[0] : null;

            setChoiceAction({
                type: "slyDeal",
                card,
                initialTargetId: onlyTarget?.id,
                stealableProperties: getStealableProperties(game, currentPlayer),
            });
            return;
        }

        if (card.meta.actionType === "dealBreaker") {
            const onlyTarget = targetablePlayers.length === 1 ? targetablePlayers[0] : null;

            setChoiceAction({
                type: "dealBreaker",
                card,
                initialTargetId: onlyTarget?.id,
                stealableFullSets: getStealableFullSets(game, currentPlayer),
            });
            return;
        }

        if (card.meta.actionType === "forcedDeal") {
            const onlyTarget = targetablePlayers.length === 1 ? targetablePlayers[0] : null;

            setChoiceAction({
                type: "forcedDeal",
                card,
                initialTargetId: onlyTarget?.id,
                ownProperties: getCurrentPlayerProperties(currentPlayer),
                forcedDealTargets: getStealableProperties(game, currentPlayer),
            });
        }
    }

    function handleCardPointerDown(card, event) {
        if (!canAct || player.id !== currentPlayer.id) return;

        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setDragState({
            cardId: card.instanceId,
            startX: event.clientX,
            startY: event.clientY,
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            x: 0,
            y: 0,
            active: false,
        });
    }

    function handleCardPointerMove(card, event) {
        event.preventDefault();
        setDragState((current) => {
            if (!current || current.cardId !== card.instanceId) return current;

            const x = event.clientX - current.startX;
            const y = event.clientY - current.startY;

            return {
                ...current,
                x,
                y,
                active: current.active || Math.abs(x) + Math.abs(y) > 8,
            };
        });
    }

    function handleCardRelease(card, event) {
        const clientX = event.clientX ?? event.changedTouches?.[0]?.clientX;
        const clientY = event.clientY ?? event.changedTouches?.[0]?.clientY;
        const wasDragging =
            dragState?.cardId === card.instanceId && dragState.active;

        setDragState(null);

        if (typeof clientX !== "number" || typeof clientY !== "number") return;
        if (!wasDragging && event.type !== "dragend") return;

        window.requestAnimationFrame(() => {
            playCardFromDrop(card, getDropZoneFromPoint(clientX, clientY));
        });
    }

    useEffect(() => {
        if (!dragState) return undefined;

        const draggingCard = player.hand.find(
            (card) => card.instanceId === dragState.cardId
        );

        function handleWindowPointerMove(event) {
            if (!draggingCard) return;
            handleCardPointerMove(draggingCard, event);
        }

        function handleWindowPointerUp(event) {
            if (!draggingCard) return;
            handleCardRelease(draggingCard, event);
        }

        window.addEventListener("pointermove", handleWindowPointerMove, {
            passive: false,
        });
        window.addEventListener("pointerup", handleWindowPointerUp);
        window.addEventListener("pointercancel", handleWindowPointerUp);

        return () => {
            window.removeEventListener("pointermove", handleWindowPointerMove);
            window.removeEventListener("pointerup", handleWindowPointerUp);
            window.removeEventListener("pointercancel", handleWindowPointerUp);
        };
    }, [dragState, player.hand]);

    if (hideCards) {
        return (
            <section className="hand-zone">
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

    return (
        <section className="hand-zone">
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
                        <div
                            className={[
                                "draggable-card-shell",
                                dragState?.cardId === card.instanceId && dragState.active
                                    ? "is-dragging"
                                    : "",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            draggable={isCurrentPlayer && canAct}
                            key={card.instanceId}
                            style={
                                dragState?.cardId === card.instanceId && dragState.active
                                    ? {
                                        position: "fixed",
                                        left: `${dragState.left}px`,
                                        top: `${dragState.top}px`,
                                        width: `${dragState.width}px`,
                                        height: `${dragState.height}px`,
                                        marginLeft: 0,
                                        zIndex: 300,
                                        "--drag-x": `${dragState.x}px`,
                                        "--drag-y": `${dragState.y}px`,
                                    }
                                    : undefined
                            }
                            onDragEnd={(event) => handleCardRelease(card, event)}
                            onPointerDown={(event) => handleCardPointerDown(card, event)}
                        >
                            <CardView card={card} language={language} />
                        </div>
                    );
                })}
            </div>

            {isChoosingPlayerTarget && <div className="player-target-overlay" />}

            {choiceAction && !isChoosingPlayerTarget && (
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
                                <div className="property-color-choice-grid">
                                    {choiceAction.availableColors.map((color) => (
                                        <button
                                            type="button"
                                            className="property-color-choice"
                                            key={color}
                                            style={{
                                                "--property-choice-color":
                                                    PROPERTY_COLORS[color] || "#cbd5e1",
                                            }}
                                            onClick={() =>
                                                handlePlayProperty(choiceAction.card, color)
                                            }
                                        >
                                            <span>{formatColorName(color)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {choiceAction.type === "debtCollector" && (
                            <div className="action-choice-form">
                                {!getChoiceTargetId(choiceAction) && (
                                    <p className="choice-hint">
                                        {t(language, "target")}: {t(language, "playAction")}
                                    </p>
                                )}

                                {getChoiceTargetId(choiceAction) && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            playDebtCollector(
                                                choiceAction.card,
                                                selectedTargets[choiceAction.card.instanceId]
                                            )
                                        }
                                    >
                                        {t(language, "playAction")}
                                    </button>
                                )}
                            </div>
                        )}

                        {choiceAction.type === "rent" && (
                            <div className="action-choice-form">
                                {!selectedTargets[choiceAction.card.instanceId] && (
                                    <p className="choice-hint">
                                        {t(language, "target")}: {t(language, "playRent")}
                                    </p>
                                )}

                                {selectedTargets[choiceAction.card.instanceId] && (
                                    <div className="property-color-choice-grid">
                                        {choiceAction.playableRentColors.map((color) => (
                                            <button
                                                type="button"
                                                className="property-color-choice"
                                                key={color}
                                                style={{
                                                    "--property-choice-color":
                                                        PROPERTY_COLORS[color] || "#cbd5e1",
                                                }}
                                                onClick={() =>
                                                    playRentCard(
                                                        choiceAction.card,
                                                        getChoiceTargetId(choiceAction),
                                                        color
                                                    )
                                                }
                                            >
                                                <span>{formatColorName(color)}</span>
                                            </button>
                                        ))}
                                    </div>
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

                                {choiceAction.playableRentColors.length === 0 && (
                                    <p className="choice-hint">{t(language, "rent")}: 0</p>
                                )}
                            </div>
                        )}

                        {choiceAction.type === "slyDeal" && (
                            <div className="action-choice-list">
                                {!getChoiceTargetId(choiceAction) && (
                                    <p className="choice-hint">
                                        {t(language, "target")}: {t(language, "playSlyDeal")}
                                    </p>
                                )}

                                {getChoiceTargetId(choiceAction) &&
                                    getTargetedStealableProperties(choiceAction).map((item) => (
                                        <button
                                            type="button"
                                            className="property-pick-card"
                                            key={item.card.instanceId}
                                            style={{
                                                "--property-choice-color": getCardColor(
                                                    item.card,
                                                    item.group
                                                ),
                                            }}
                                            onClick={() =>
                                                playSlyDeal(
                                                    choiceAction.card,
                                                    item.card.instanceId
                                                )
                                            }
                                        >
                                            <strong>{t(language, `cardName.${item.card.id}`)}</strong>
                                        </button>
                                    ))}
                            </div>
                        )}

                        {choiceAction.type === "dealBreaker" && (
                            <div className="action-choice-list">
                                {!getChoiceTargetId(choiceAction) && (
                                    <p className="choice-hint">
                                        {t(language, "target")}: {t(language, "playDealBreaker")}
                                    </p>
                                )}

                                {getChoiceTargetId(choiceAction) &&
                                    getTargetedFullSets(choiceAction).map((item) => (
                                        <button
                                            type="button"
                                            className="property-pick-card"
                                            key={item.label}
                                            style={{
                                                "--property-choice-color":
                                                    PROPERTY_COLORS[item.group] || "#cbd5e1",
                                            }}
                                            onClick={() =>
                                                playDealBreaker(choiceAction.card, item)
                                            }
                                        >
                                            <strong>{formatColorName(item.group)}</strong>
                                            <span>{t(language, "steal")}</span>
                                        </button>
                                    ))}
                            </div>
                        )}

                        {choiceAction.type === "forcedDeal" && (
                            <div className="action-choice-form">
                                <strong>{t(language, "give")}</strong>
                                <div className="action-choice-list">
                                    {choiceAction.ownProperties.map((item) => {
                                        const selectedOfferedId =
                                            selectedTargets[
                                            `${choiceAction.card.instanceId}_modal_offered`
                                            ] || choiceAction.ownProperties[0]?.card.instanceId;

                                        return (
                                            <button
                                                type="button"
                                                className={
                                                    item.card.instanceId === selectedOfferedId
                                                        ? "property-pick-card selected-pick-card"
                                                        : "property-pick-card"
                                                }
                                                key={item.card.instanceId}
                                                style={{
                                                    "--property-choice-color": getCardColor(
                                                        item.card,
                                                        item.group
                                                    ),
                                                }}
                                                onClick={() =>
                                                    handleTargetChange(
                                                        `${choiceAction.card.instanceId}_modal_offered`,
                                                        item.card.instanceId
                                                    )
                                                }
                                            >
                                                <strong>{t(language, `cardName.${item.card.id}`)}</strong>
                                                <span>{t(language, "give")}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {!getChoiceTargetId(choiceAction) && (
                                    <p className="choice-hint">
                                        {t(language, "target")}: {t(language, "playForcedDeal")}
                                    </p>
                                )}

                                {getChoiceTargetId(choiceAction) && (
                                    <>
                                        <strong>{t(language, "take")}</strong>
                                        <div className="action-choice-list">
                                            {getTargetedForcedDealCards(choiceAction).map(
                                                (item) => (
                                                    <button
                                                        type="button"
                                                        className="property-pick-card"
                                                        key={item.card.instanceId}
                                                        style={{
                                                            "--property-choice-color": getCardColor(
                                                                item.card,
                                                                item.group
                                                            ),
                                                        }}
                                                        onClick={() =>
                                                            playForcedDeal(
                                                                choiceAction.card,
                                                                selectedTargets[
                                                                `${choiceAction.card.instanceId}_modal_offered`
                                                                ] ||
                                                                choiceAction.ownProperties[0]?.card
                                                                    .instanceId,
                                                                item.card.instanceId
                                                            )
                                                        }
                                                    >
                                                        <strong>{t(language, `cardName.${item.card.id}`)}</strong>
                                                        <span>{t(language, "take")}</span>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            className="action-choice-cancel"
                            onClick={() => setChoiceAction(null)}
                        >
                            {t(language, "cancel")}
                        </button>
                    </section>
                </div>
            )}
        </section>
    );
}
