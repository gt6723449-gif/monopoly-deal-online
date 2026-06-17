import { drawCardsWithReshuffle } from "./deckEngine";
import { getWinningPlayer, isPropertySetComplete } from "./winEngine";
import { PROPERTY_SETS } from "../data/propertySets";
import { calculateRentForGroup } from "./rentEngine";
import { createInitialGame } from "./createInitialGame";

function findPropertyCardOwner(players, cardInstanceId) {
    for (const player of players) {
        for (const group of Object.keys(player.properties)) {
            const card = player.properties[group].find(
                (item) => item.instanceId === cardInstanceId
            );

            if (card) {
                return {
                    player,
                    group,
                    card,
                };
            }
        }
    }

    return null;
}

function createPayment({ fromPlayerId, toPlayerId, amount, reason, sourceCardInstanceId }) {
    return {
        id: `payment_${crypto.randomUUID()}`,
        fromPlayerId,
        toPlayerId,
        amount,
        reason,
        sourceCardInstanceId,
    };
}

function playerHasJustSayNo(player) {
    return player.hand.some(
        (card) =>
            card.type === "action" && card.meta.actionType === "justSayNo"
    );
}

function createPendingAction({ actionPlayerId, targetPlayerIds, sourceCard, payments }) {
    return {
        id: `action_${crypto.randomUUID()}`,
        actionPlayerId,
        targetPlayerIds,
        sourceCard,
        payments,
        responsePlayerIds: targetPlayerIds,
    };
}

function getPlayerById(players, playerId) {
    return players.find((player) => player.id === playerId);
}

function getPlayersWhoCanRespond(players, payments) {
    return payments
        .map((payment) => payment.fromPlayerId)
        .filter((playerId) => {
            const player = getPlayerById(players, playerId);
            return player && playerHasJustSayNo(player);
        });
}

function shouldWaitForResponse(players, payments) {
    return getPlayersWhoCanRespond(players, payments).length > 0;
}

function createActionResolutionState({
    state,
    actionPlayerId,
    sourceCard,
    payments,
}) {
    const responsePlayerIds = getPlayersWhoCanRespond(state.players, payments);
    const needsResponse = responsePlayerIds.length > 0;

    if (needsResponse) {
        return {
            status: "waiting_for_response",
            pendingAction: createPendingAction({
                actionPlayerId,
                targetPlayerIds: responsePlayerIds,
                sourceCard,
                payments,
            }),
            pendingPayment: null,
            paymentQueue: [],
            phase: "response",
        };
    }

    return {
        status: "waiting_for_payment",
        pendingAction: null,
        pendingPayment: payments[0],
        paymentQueue: payments.slice(1),
        phase: "payment",
    };
}

function removeCardFromHand(player, cardInstanceId) {
    const card = player.hand.find((item) => item.instanceId === cardInstanceId);

    if (!card) {
        return {
            card: null,
            updatedHand: player.hand,
        };
    }

    return {
        card,
        updatedHand: player.hand.filter(
            (item) => item.instanceId !== cardInstanceId
        ),
    };
}

function removeCardsByInstanceIds(cards, cardInstanceIds) {
    return cards.filter((card) => !cardInstanceIds.includes(card.instanceId));
}

function getCardsByInstanceIds(cards, cardInstanceIds) {
    return cards.filter((card) => cardInstanceIds.includes(card.instanceId));
}

function canUseAction(state, playerId) {
    return (
        state.status === "playing" &&
        state.currentPlayerId === playerId &&
        state.turn.phase === "action" &&
        state.turn.actionsUsed < state.turn.maxActions
    );
}

function incrementActionCount(state) {
    return {
        ...state.turn,
        actionsUsed: state.turn.actionsUsed + 1,
    };
}

function applyWinCondition(state) {
    const winningPlayer = getWinningPlayer(state.players);

    if (!winningPlayer) {
        return state;
    }

    return {
        ...state,
        status: "finished",
        winnerId: winningPlayer.id,
        turn: {
            ...state.turn,
            phase: "gameOver",
        },
        log: [
            ...state.log,
            {
                id: `log_${state.log.length + 1}`,
                message: `${winningPlayer.name} wins with 3 full property sets!`,
            },
        ],
    };
}

export function gameReducer(state, action) {
    switch (action.type) {
        case "START_NEW_GAME": {
            return createInitialGame({
                playerNames: action.payload.playerNames,
            });
        }
        case "DRAW_CARDS": {
            const { playerId, count } = action.payload;

            if (state.status !== "playing") return state;
            if (state.turn.hasDrawn) return state;
            if (state.currentPlayerId !== playerId) return state;

            const playerIndex = state.players.findIndex(
                (player) => player.id === playerId
            );

            if (playerIndex === -1) return state;

            const result = drawCardsWithReshuffle({
                deck: state.deck,
                discardPile: state.discardPile,
                count,
            });

            const updatedPlayers = [...state.players];
            updatedPlayers[playerIndex] = {
                ...updatedPlayers[playerIndex],
                hand: [...updatedPlayers[playerIndex].hand, ...result.drawnCards],
            };

            return {
                ...state,
                players: updatedPlayers,
                deck: result.remainingDeck,
                discardPile: result.remainingDiscardPile,
                turn: {
                    ...state.turn,
                    hasDrawn: true,
                    phase: "action",
                },
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `${updatedPlayers[playerIndex].name} drew ${result.drawnCards.length} card(s).`,
                    },
                ],
            };
        }

        case "BANK_CARD": {
            const { playerId, cardInstanceId } = action.payload;

            if (!canUseAction(state, playerId)) return state;

            const playerIndex = state.players.findIndex(
                (player) => player.id === playerId
            );

            if (playerIndex === -1) return state;

            const player = state.players[playerIndex];
            const { card, updatedHand } = removeCardFromHand(player, cardInstanceId);

            if (!card) return state;

            const bankedCard = {
                ...card,
                bankedAsMoney: true,
            };

            const updatedPlayers = [...state.players];
            updatedPlayers[playerIndex] = {
                ...player,
                hand: updatedHand,
                bank: [...player.bank, bankedCard],
            };

            return {
                ...state,
                players: updatedPlayers,
                turn: incrementActionCount(state),
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `${player.name} banked ${card.name}.`,
                    },
                ],
            };
        }

        case "PLAY_PROPERTY": {
            const { playerId, cardInstanceId, color } = action.payload;

            if (!canUseAction(state, playerId)) return state;

            const playerIndex = state.players.findIndex(
                (player) => player.id === playerId
            );

            if (playerIndex === -1) return state;

            const player = state.players[playerIndex];
            const { card, updatedHand } = removeCardFromHand(player, cardInstanceId);

            if (!card) return state;
            if (card.type !== "property" && card.type !== "wild") return state;

            const allowedColors = card.meta.colors || [];

            if (!allowedColors.includes(color)) return state;

            const playedCard = {
                ...card,
                meta: {
                    ...card.meta,
                    activeColor: color,
                },
            };

            const updatedPlayers = [...state.players];
            updatedPlayers[playerIndex] = {
                ...player,
                hand: updatedHand,
                properties: {
                    ...player.properties,
                    [color]: [...player.properties[color], playedCard],
                },
            };

            const nextState = {
                ...state,
                players: updatedPlayers,
                turn: incrementActionCount(state),
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `${player.name} played ${card.name} as ${color}.`,
                    },
                ],
            };

            return applyWinCondition(nextState);
        }

        case "PLAY_SET_MODIFIER": {
            const { playerId, cardInstanceId, targetGroup } = action.payload;

            if (!canUseAction(state, playerId)) return state;

            const playerIndex = state.players.findIndex(
                (player) => player.id === playerId
            );

            if (playerIndex === -1) return state;

            const player = state.players[playerIndex];
            const { card, updatedHand } = removeCardFromHand(player, cardInstanceId);

            if (!card) return state;
            if (card.type !== "action") return state;

            const actionType = card.meta.actionType;

            if (actionType !== "house" && actionType !== "hotel") return state;

            const setDefinition = PROPERTY_SETS[targetGroup];

            if (!setDefinition) return state;
            if (!setDefinition.allowsHouse) return state;
            if (!setDefinition.allowsHotel) return state;
            if (!isPropertySetComplete(player, targetGroup)) return state;

            const currentModifiers = player.propertySetModifiers[targetGroup] || {};

            if (actionType === "house" && currentModifiers.house) return state;
            if (actionType === "hotel" && currentModifiers.hotel) return state;
            if (actionType === "hotel" && !currentModifiers.house) return state;

            const updatedPlayers = [...state.players];

            updatedPlayers[playerIndex] = {
                ...player,
                hand: updatedHand,
                propertySetModifiers: {
                    ...player.propertySetModifiers,
                    [targetGroup]: {
                        ...currentModifiers,
                        [actionType]: card,
                    },
                },
            };

            return {
                ...state,
                players: updatedPlayers,
                discardPile: [...state.discardPile],
                turn: incrementActionCount(state),
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `${player.name} added ${card.name} to ${targetGroup}.`,
                    },
                ],
            };
        }

        case "PLAY_FORCED_DEAL": {
            const {
                playerId,
                cardInstanceId,
                offeredPropertyCardId,
                targetPropertyCardId,
            } = action.payload;

            if (!canUseAction(state, playerId)) return state;

            const playerIndex = state.players.findIndex(
                (player) => player.id === playerId
            );

            if (playerIndex === -1) return state;

            const player = state.players[playerIndex];
            const { card, updatedHand } = removeCardFromHand(player, cardInstanceId);

            if (!card) return state;
            if (card.type !== "action") return state;
            if (card.meta.actionType !== "forcedDeal") return state;

            const offeredInfo = findPropertyCardOwner(state.players, offeredPropertyCardId);
            const targetInfo = findPropertyCardOwner(state.players, targetPropertyCardId);

            if (!offeredInfo || !targetInfo) return state;
            if (offeredInfo.player.id !== playerId) return state;
            if (targetInfo.player.id === playerId) return state;

            if (isPropertySetComplete(targetInfo.player, targetInfo.group)) {
                return state;
            }

            const targetPlayer = targetInfo.player;

            const resolution = createActionResolutionState({
                state,
                actionPlayerId: playerId,
                sourceCard: card,
                payments: [
                    createPayment({
                        fromPlayerId: targetPlayer.id,
                        toPlayerId: player.id,
                        amount: 0,
                        reason: card.name,
                        sourceCardInstanceId: card.instanceId,
                    }),
                ],
            });

            const updatedPlayers = [...state.players];

            updatedPlayers[playerIndex] = {
                ...player,
                hand: updatedHand,
            };

            const pendingForcedDeal = {
                actionType: "forcedDeal",
                actionPlayerId: playerId,
                targetPlayerId: targetPlayer.id,
                offeredPropertyCardId,
                targetPropertyCardId,
                sourceCard: card,
            };

            if (resolution.status === "waiting_for_response") {
                return {
                    ...state,
                    status: "waiting_for_response",
                    players: updatedPlayers,
                    discardPile: [...state.discardPile, card],
                    pendingAction: {
                        ...resolution.pendingAction,
                        effect: pendingForcedDeal,
                    },
                    pendingPayment: null,
                    paymentQueue: [],
                    turn: {
                        ...incrementActionCount(state),
                        phase: "response",
                    },
                    log: [
                        ...state.log,
                        {
                            id: `log_${state.log.length + 1}`,
                            message: `${player.name} played Forced Deal.`,
                        },
                    ],
                };
            }

            const currentOfferedInfo = findPropertyCardOwner(
                updatedPlayers,
                offeredPropertyCardId
            );
            const currentTargetInfo = findPropertyCardOwner(
                updatedPlayers,
                targetPropertyCardId
            );

            if (!currentOfferedInfo || !currentTargetInfo) return state;

            const playerOwnerIndex = updatedPlayers.findIndex(
                (item) => item.id === currentOfferedInfo.player.id
            );
            const targetOwnerIndex = updatedPlayers.findIndex(
                (item) => item.id === currentTargetInfo.player.id
            );

            const offeredCard = currentOfferedInfo.card;
            const targetCard = currentTargetInfo.card;

            updatedPlayers[playerOwnerIndex] = {
                ...updatedPlayers[playerOwnerIndex],
                properties: {
                    ...updatedPlayers[playerOwnerIndex].properties,
                    [currentOfferedInfo.group]: updatedPlayers[playerOwnerIndex].properties[
                        currentOfferedInfo.group
                    ].filter((item) => item.instanceId !== offeredPropertyCardId),
                    [targetCard.meta.activeColor]: [
                        ...updatedPlayers[playerOwnerIndex].properties[targetCard.meta.activeColor],
                        targetCard,
                    ],
                },
            };

            updatedPlayers[targetOwnerIndex] = {
                ...updatedPlayers[targetOwnerIndex],
                properties: {
                    ...updatedPlayers[targetOwnerIndex].properties,
                    [currentTargetInfo.group]: updatedPlayers[targetOwnerIndex].properties[
                        currentTargetInfo.group
                    ].filter((item) => item.instanceId !== targetPropertyCardId),
                    [offeredCard.meta.activeColor]: [
                        ...updatedPlayers[targetOwnerIndex].properties[
                        offeredCard.meta.activeColor
                        ],
                        offeredCard,
                    ],
                },
            };

            const nextState = {
                ...state,
                players: updatedPlayers,
                discardPile: [...state.discardPile, card],
                turn: incrementActionCount(state),
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `${player.name} swapped ${offeredCard.name} for ${targetCard.name}.`,
                    },
                ],
            };

            return applyWinCondition(nextState);
        }

        case "PLAY_DEAL_BREAKER": {
            const { playerId, cardInstanceId, targetPlayerId, targetGroup } = action.payload;

            if (!canUseAction(state, playerId)) return state;

            const playerIndex = state.players.findIndex((player) => player.id === playerId);
            const targetPlayerIndex = state.players.findIndex(
                (player) => player.id === targetPlayerId
            );

            if (playerIndex === -1 || targetPlayerIndex === -1) return state;

            const player = state.players[playerIndex];
            const targetPlayer = state.players[targetPlayerIndex];

            const { card, updatedHand } = removeCardFromHand(player, cardInstanceId);

            if (!card) return state;
            if (card.type !== "action") return state;
            if (card.meta.actionType !== "dealBreaker") return state;
            if (targetPlayer.id === playerId) return state;
            if (!isPropertySetComplete(targetPlayer, targetGroup)) return state;

            const resolution = createActionResolutionState({
                state,
                actionPlayerId: playerId,
                sourceCard: card,
                payments: [
                    createPayment({
                        fromPlayerId: targetPlayer.id,
                        toPlayerId: player.id,
                        amount: 0,
                        reason: card.name,
                        sourceCardInstanceId: card.instanceId,
                    }),
                ],
            });

            const updatedPlayers = [...state.players];

            updatedPlayers[playerIndex] = {
                ...player,
                hand: updatedHand,
            };

            const pendingDealBreaker = {
                actionType: "dealBreaker",
                actionPlayerId: playerId,
                targetPlayerId: targetPlayer.id,
                targetGroup,
                sourceCard: card,
            };

            if (resolution.status === "waiting_for_response") {
                return {
                    ...state,
                    status: "waiting_for_response",
                    players: updatedPlayers,
                    discardPile: [...state.discardPile, card],
                    pendingAction: {
                        ...resolution.pendingAction,
                        effect: pendingDealBreaker,
                    },
                    pendingPayment: null,
                    paymentQueue: [],
                    turn: {
                        ...incrementActionCount(state),
                        phase: "response",
                    },
                    log: [
                        ...state.log,
                        {
                            id: `log_${state.log.length + 1}`,
                            message: `${player.name} played Deal Breaker targeting ${targetPlayer.name}'s ${targetGroup} set.`,
                        },
                    ],
                };
            }

            const stolenSetCards = targetPlayer.properties[targetGroup];

            updatedPlayers[targetPlayerIndex] = {
                ...targetPlayer,
                properties: {
                    ...targetPlayer.properties,
                    [targetGroup]: [],
                },
            };

            updatedPlayers[playerIndex] = {
                ...updatedPlayers[playerIndex],
                properties: {
                    ...updatedPlayers[playerIndex].properties,
                    [targetGroup]: [
                        ...updatedPlayers[playerIndex].properties[targetGroup],
                        ...stolenSetCards,
                    ],
                },
            };

            const nextState = {
                ...state,
                players: updatedPlayers,
                discardPile: [...state.discardPile, card],
                turn: incrementActionCount(state),
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `${player.name} stole ${targetPlayer.name}'s ${targetGroup} set with Deal Breaker.`,
                    },
                ],
            };

            return applyWinCondition(nextState);
        }

        case "PLAY_SLY_DEAL": {
            const { playerId, cardInstanceId, targetPropertyCardId } = action.payload;

            if (!canUseAction(state, playerId)) return state;

            const playerIndex = state.players.findIndex(
                (player) => player.id === playerId
            );

            if (playerIndex === -1) return state;

            const player = state.players[playerIndex];
            const { card, updatedHand } = removeCardFromHand(player, cardInstanceId);

            if (!card) return state;
            if (card.type !== "action") return state;
            if (card.meta.actionType !== "slyDeal") return state;

            const targetInfo = findPropertyCardOwner(
                state.players,
                targetPropertyCardId
            );

            if (!targetInfo) return state;
            if (targetInfo.player.id === playerId) return state;

            if (isPropertySetComplete(targetInfo.player, targetInfo.group)) {
                return state;
            }

            const targetPlayer = targetInfo.player;

            const paymentLikeResolution = createActionResolutionState({
                state,
                actionPlayerId: playerId,
                sourceCard: card,
                payments: [
                    createPayment({
                        fromPlayerId: targetPlayer.id,
                        toPlayerId: playerId,
                        amount: 0,
                        reason: card.name,
                        sourceCardInstanceId: card.instanceId,
                    }),
                ],
            });

            const updatedPlayers = [...state.players];

            updatedPlayers[playerIndex] = {
                ...player,
                hand: updatedHand,
            };

            const pendingSlyDeal = {
                actionType: "slyDeal",
                actionPlayerId: playerId,
                targetPlayerId: targetPlayer.id,
                targetPropertyCardId,
                sourceCard: card,
            };

            if (paymentLikeResolution.status === "waiting_for_response") {
                return {
                    ...state,
                    status: "waiting_for_response",
                    players: updatedPlayers,
                    discardPile: [...state.discardPile, card],
                    pendingAction: {
                        ...paymentLikeResolution.pendingAction,
                        effect: pendingSlyDeal,
                    },
                    pendingPayment: null,
                    paymentQueue: [],
                    turn: {
                        ...incrementActionCount(state),
                        phase: "response",
                    },
                    log: [
                        ...state.log,
                        {
                            id: `log_${state.log.length + 1}`,
                            message: `${player.name} played Sly Deal targeting ${targetInfo.card.name}.`,
                        },
                    ],
                };
            }

            const receiverIndex = playerIndex;
            const targetPlayerIndex = state.players.findIndex(
                (item) => item.id === targetPlayer.id
            );

            if (targetPlayerIndex === -1) return state;

            const stolenCard = {
                ...targetInfo.card,
            };

            updatedPlayers[targetPlayerIndex] = {
                ...targetPlayer,
                properties: {
                    ...targetPlayer.properties,
                    [targetInfo.group]: targetPlayer.properties[targetInfo.group].filter(
                        (item) => item.instanceId !== targetPropertyCardId
                    ),
                },
            };

            updatedPlayers[receiverIndex] = {
                ...updatedPlayers[receiverIndex],
                properties: {
                    ...updatedPlayers[receiverIndex].properties,
                    [stolenCard.meta.activeColor]: [
                        ...updatedPlayers[receiverIndex].properties[stolenCard.meta.activeColor],
                        stolenCard,
                    ],
                },
            };

            const nextState = {
                ...state,
                players: updatedPlayers,
                discardPile: [...state.discardPile, card],
                turn: incrementActionCount(state),
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `${player.name} stole ${stolenCard.name} with Sly Deal.`,
                    },
                ],
            };

            return applyWinCondition(nextState);
        }

        case "PLAY_MONEY_ACTION_CARD": {
            const { playerId, cardInstanceId, targetPlayerId } = action.payload;

            if (!canUseAction(state, playerId)) return state;

            const playerIndex = state.players.findIndex(
                (player) => player.id === playerId
            );

            if (playerIndex === -1) return state;

            const player = state.players[playerIndex];
            const { card, updatedHand } = removeCardFromHand(player, cardInstanceId);

            if (!card) return state;
            if (card.type !== "action") return state;

            const actionType = card.meta.actionType;

            if (actionType !== "debtCollector" && actionType !== "birthday") {
                return state;
            }

            let payments = [];

            if (actionType === "debtCollector") {
                const payer = state.players.find((item) => item.id === targetPlayerId);

                if (!payer) return state;

                payments = [
                    createPayment({
                        fromPlayerId: payer.id,
                        toPlayerId: player.id,
                        amount: card.meta.amount,
                        reason: card.name,
                        sourceCardInstanceId: card.instanceId,
                    }),
                ];
            }

            if (actionType === "birthday") {
                payments = state.players
                    .filter((item) => item.id !== playerId)
                    .map((payer) =>
                        createPayment({
                            fromPlayerId: payer.id,
                            toPlayerId: player.id,
                            amount: card.meta.amount,
                            reason: card.name,
                            sourceCardInstanceId: card.instanceId,
                        })
                    );
            }

            if (payments.length === 0) return state;

            const resolution = createActionResolutionState({
                state,
                actionPlayerId: playerId,
                sourceCard: card,
                payments,
            });

            const updatedPlayers = [...state.players];

            updatedPlayers[playerIndex] = {
                ...player,
                hand: updatedHand,
            };

            return {
                ...state,
                status: resolution.status,
                players: updatedPlayers,
                discardPile: [...state.discardPile, card],
                turn: {
                    ...incrementActionCount(state),
                    phase: resolution.phase,
                },
                pendingAction: resolution.pendingAction,
                pendingPayment: resolution.pendingPayment,
                paymentQueue: resolution.paymentQueue,
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `${player.name} played ${card.name}. ${payments.length} payment(s) created.`,
                    },
                ],
            };
        }

        case "PLAY_RENT_CARD": {
            const { playerId, cardInstanceId, targetPlayerId, color, doubleRentCardIds = [] } = action.payload;

            if (!canUseAction(state, playerId)) return state;

            const playerIndex = state.players.findIndex(
                (player) => player.id === playerId
            );

            const targetPlayer = state.players.find(
                (player) => player.id === targetPlayerId
            );

            if (playerIndex === -1 || !targetPlayer) return state;

            const player = state.players[playerIndex];
            const { card, updatedHand } = removeCardFromHand(player, cardInstanceId);

            if (!card) return state;
            if (card.type !== "rent") return state;

            const allowedColors = card.meta.colors || [];

            if (!allowedColors.includes(color)) return state;

            const doubleRentCards = player.hand.filter(
                (handCard) =>
                    doubleRentCardIds.includes(handCard.instanceId) &&
                    handCard.type === "action" &&
                    handCard.meta.actionType === "doubleRent"
            );

            if (doubleRentCards.length !== doubleRentCardIds.length) return state;
            if (doubleRentCards.length > 2) return state;

            const baseRentAmount = calculateRentForGroup(player, color);
            const rentAmount = baseRentAmount * 2 ** doubleRentCards.length;

            if (rentAmount <= 0) return state;

            const updatedPlayers = [...state.players];
            updatedPlayers[playerIndex] = {
                ...player,
                hand: updatedHand.filter(
                    (handCard) => !doubleRentCardIds.includes(handCard.instanceId)
                ),
            };

            const resolution = createActionResolutionState({
                state,
                actionPlayerId: playerId,
                sourceCard: card,
                payments: [
                    createPayment({
                        fromPlayerId: targetPlayerId,
                        toPlayerId: playerId,
                        amount: rentAmount,
                        reason: `${card.name} on ${color}${doubleRentCards.length > 0 ? ` with ${doubleRentCards.length} Double Rent` : ""
                            }`,
                        sourceCardInstanceId: card.instanceId,
                    }),
                ],
            });

            return {
                ...state,
                status: resolution.status,
                players: updatedPlayers,
                discardPile: [...state.discardPile, card, ...doubleRentCards],
                turn: {
                    ...incrementActionCount(state),
                    phase: resolution.phase,
                },
                pendingAction: resolution.pendingAction,
                pendingPayment: resolution.pendingPayment,
                paymentQueue: resolution.paymentQueue,
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `${player.name} charged ${targetPlayer.name} $${rentAmount}M rent for ${color}.`,
                    },
                ],
            };
        }

        case "CHANGE_WILD_COLOR": {
            const { playerId, cardInstanceId, newColor } = action.payload;

            if (state.status !== "playing") return state;
            if (state.currentPlayerId !== playerId) return state;
            if (state.turn.phase !== "action") return state;

            const playerIndex = state.players.findIndex(
                (player) => player.id === playerId
            );

            if (playerIndex === -1) return state;

            const player = state.players[playerIndex];

            let foundCard = null;
            let oldColor = null;

            for (const group of Object.keys(player.properties)) {
                const card = player.properties[group].find(
                    (item) => item.instanceId === cardInstanceId
                );

                if (card) {
                    foundCard = card;
                    oldColor = group;
                    break;
                }
            }

            if (!foundCard) return state;
            if (foundCard.type !== "wild") return state;

            const allowedColors = foundCard.meta.colors || [];

            if (!allowedColors.includes(newColor)) return state;
            if (oldColor === newColor) return state;

            const movedCard = {
                ...foundCard,
                meta: {
                    ...foundCard.meta,
                    activeColor: newColor,
                },
            };

            const updatedProperties = {
                ...player.properties,
                [oldColor]: player.properties[oldColor].filter(
                    (item) => item.instanceId !== cardInstanceId
                ),
                [newColor]: [...player.properties[newColor], movedCard],
            };

            const updatedPlayers = [...state.players];
            updatedPlayers[playerIndex] = {
                ...player,
                properties: updatedProperties,
            };

            return {
                ...state,
                players: updatedPlayers,
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `${player.name} moved ${foundCard.name} from ${oldColor} to ${newColor}.`,
                    },
                ],
            };
        }

        case "DECLINE_JUST_SAY_NO": {
            const { playerId } = action.payload;

            if (state.status !== "waiting_for_response") return state;
            if (!state.pendingAction) return state;
            if (!state.pendingAction.responsePlayerIds.includes(playerId)) return state;

            const remainingResponsePlayerIds =
                state.pendingAction.responsePlayerIds.filter((id) => id !== playerId);

            if (remainingResponsePlayerIds.length > 0) {
                return {
                    ...state,
                    pendingAction: {
                        ...state.pendingAction,
                        responsePlayerIds: remainingResponsePlayerIds,
                    },
                    log: [
                        ...state.log,
                        {
                            id: `log_${state.log.length + 1}`,
                            message: `${playerId} did not use Just Say No.`,
                        },
                    ],
                };
            }

            if (state.pendingAction.effect?.actionType === "forcedDeal") {
                const effect = state.pendingAction.effect;

                const offeredInfo = findPropertyCardOwner(
                    state.players,
                    effect.offeredPropertyCardId
                );

                const targetInfo = findPropertyCardOwner(
                    state.players,
                    effect.targetPropertyCardId
                );

                if (!offeredInfo || !targetInfo) return state;

                if (isPropertySetComplete(targetInfo.player, targetInfo.group)) {
                    return state;
                }

                const updatedPlayers = [...state.players];

                const playerOwnerIndex = updatedPlayers.findIndex(
                    (player) => player.id === offeredInfo.player.id
                );

                const targetOwnerIndex = updatedPlayers.findIndex(
                    (player) => player.id === targetInfo.player.id
                );

                if (playerOwnerIndex === -1 || targetOwnerIndex === -1) return state;

                const offeredCard = offeredInfo.card;
                const targetCard = targetInfo.card;

                updatedPlayers[playerOwnerIndex] = {
                    ...updatedPlayers[playerOwnerIndex],
                    properties: {
                        ...updatedPlayers[playerOwnerIndex].properties,
                        [offeredInfo.group]: updatedPlayers[playerOwnerIndex].properties[
                            offeredInfo.group
                        ].filter((card) => card.instanceId !== effect.offeredPropertyCardId),
                        [targetCard.meta.activeColor]: [
                            ...updatedPlayers[playerOwnerIndex].properties[targetCard.meta.activeColor],
                            targetCard,
                        ],
                    },
                };

                updatedPlayers[targetOwnerIndex] = {
                    ...updatedPlayers[targetOwnerIndex],
                    properties: {
                        ...updatedPlayers[targetOwnerIndex].properties,
                        [targetInfo.group]: updatedPlayers[targetOwnerIndex].properties[
                            targetInfo.group
                        ].filter((card) => card.instanceId !== effect.targetPropertyCardId),
                        [offeredCard.meta.activeColor]: [
                            ...updatedPlayers[targetOwnerIndex].properties[
                            offeredCard.meta.activeColor
                            ],
                            offeredCard,
                        ],
                    },
                };

                const nextState = {
                    ...state,
                    status: "playing",
                    players: updatedPlayers,
                    pendingAction: null,
                    pendingPayment: null,
                    paymentQueue: [],
                    turn: {
                        ...state.turn,
                        phase: "action",
                    },
                    log: [
                        ...state.log,
                        {
                            id: `log_${state.log.length + 1}`,
                            message: `Forced Deal was not blocked. Properties were swapped.`,
                        },
                    ],
                };

                return applyWinCondition(nextState);
            }

            if (state.pendingAction.effect?.actionType === "dealBreaker") {
                const effect = state.pendingAction.effect;

                const receiverIndex = state.players.findIndex(
                    (player) => player.id === effect.actionPlayerId
                );

                const targetPlayerIndex = state.players.findIndex(
                    (player) => player.id === effect.targetPlayerId
                );

                if (receiverIndex === -1 || targetPlayerIndex === -1) return state;

                const targetPlayer = state.players[targetPlayerIndex];

                if (!isPropertySetComplete(targetPlayer, effect.targetGroup)) {
                    return state;
                }

                const stolenSetCards = targetPlayer.properties[effect.targetGroup];

                const updatedPlayers = [...state.players];

                updatedPlayers[targetPlayerIndex] = {
                    ...targetPlayer,
                    properties: {
                        ...targetPlayer.properties,
                        [effect.targetGroup]: [],
                    },
                };

                updatedPlayers[receiverIndex] = {
                    ...updatedPlayers[receiverIndex],
                    properties: {
                        ...updatedPlayers[receiverIndex].properties,
                        [effect.targetGroup]: [
                            ...updatedPlayers[receiverIndex].properties[effect.targetGroup],
                            ...stolenSetCards,
                        ],
                    },
                };

                const nextState = {
                    ...state,
                    status: "playing",
                    players: updatedPlayers,
                    pendingAction: null,
                    pendingPayment: null,
                    paymentQueue: [],
                    turn: {
                        ...state.turn,
                        phase: "action",
                    },
                    log: [
                        ...state.log,
                        {
                            id: `log_${state.log.length + 1}`,
                            message: `Deal Breaker was not blocked. Full set was stolen.`,
                        },
                    ],
                };

                return applyWinCondition(nextState);
            }

            if (state.pendingAction.effect?.actionType === "slyDeal") {
                const effect = state.pendingAction.effect;

                const targetInfo = findPropertyCardOwner(
                    state.players,
                    effect.targetPropertyCardId
                );

                if (!targetInfo) return state;

                const receiverIndex = state.players.findIndex(
                    (player) => player.id === effect.actionPlayerId
                );

                const targetPlayerIndex = state.players.findIndex(
                    (player) => player.id === effect.targetPlayerId
                );

                if (receiverIndex === -1 || targetPlayerIndex === -1) return state;

                const updatedPlayers = [...state.players];

                updatedPlayers[targetPlayerIndex] = {
                    ...updatedPlayers[targetPlayerIndex],
                    properties: {
                        ...updatedPlayers[targetPlayerIndex].properties,
                        [targetInfo.group]: updatedPlayers[targetPlayerIndex].properties[
                            targetInfo.group
                        ].filter((card) => card.instanceId !== effect.targetPropertyCardId),
                    },
                };

                updatedPlayers[receiverIndex] = {
                    ...updatedPlayers[receiverIndex],
                    properties: {
                        ...updatedPlayers[receiverIndex].properties,
                        [targetInfo.card.meta.activeColor]: [
                            ...updatedPlayers[receiverIndex].properties[
                            targetInfo.card.meta.activeColor
                            ],
                            targetInfo.card,
                        ],
                    },
                };

                const nextState = {
                    ...state,
                    status: "playing",
                    players: updatedPlayers,
                    pendingAction: null,
                    pendingPayment: null,
                    paymentQueue: [],
                    turn: {
                        ...state.turn,
                        phase: "action",
                    },
                    log: [
                        ...state.log,
                        {
                            id: `log_${state.log.length + 1}`,
                            message: `Sly Deal was not blocked. Property was stolen.`,
                        },
                    ],
                };

                return applyWinCondition(nextState);
            }

            return {
                ...state,
                status: "waiting_for_payment",
                pendingPayment: state.pendingAction.payments[0],
                paymentQueue: state.pendingAction.payments.slice(1),
                pendingAction: null,
                turn: {
                    ...state.turn,
                    phase: "payment",
                },
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `Action was not blocked. Payment begins.`,
                    },
                ],
            };
        }

        case "PLAY_JUST_SAY_NO": {
            const { playerId, cardInstanceId } = action.payload;

            if (state.status !== "waiting_for_response") return state;
            if (!state.pendingAction) return state;
            if (!state.pendingAction.responsePlayerIds.includes(playerId)) return state;

            const playerIndex = state.players.findIndex(
                (player) => player.id === playerId
            );

            if (playerIndex === -1) return state;

            const player = state.players[playerIndex];
            const { card, updatedHand } = removeCardFromHand(player, cardInstanceId);

            if (!card) return state;
            if (card.type !== "action") return state;
            if (card.meta.actionType !== "justSayNo") return state;

            const updatedPlayers = [...state.players];

            updatedPlayers[playerIndex] = {
                ...player,
                hand: updatedHand,
            };

            return {
                ...state,
                status: "playing",
                players: updatedPlayers,
                discardPile: [...state.discardPile, card],
                pendingAction: null,
                pendingPayment: null,
                paymentQueue: [],
                turn: {
                    ...state.turn,
                    phase: "action",
                },
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `${player.name} played Just Say No. The action was blocked.`,
                    },
                ],
            };
        }

        case "PAY_DEBT": {
            const { playerId, paymentCardIds } = action.payload;

            if (state.status !== "waiting_for_payment") return state;
            if (!state.pendingPayment) return state;
            if (state.pendingPayment.fromPlayerId !== playerId) return state;

            const payerIndex = state.players.findIndex(
                (player) => player.id === playerId
            );

            const receiverIndex = state.players.findIndex(
                (player) => player.id === state.pendingPayment.toPlayerId
            );

            if (payerIndex === -1 || receiverIndex === -1) return state;

            const payer = state.players[payerIndex];
            const receiver = state.players[receiverIndex];

            const selectedBankCards = getCardsByInstanceIds(
                payer.bank,
                paymentCardIds
            );

            const selectedPropertyCards = [];

            const updatedPayerProperties = { ...payer.properties };

            for (const group of Object.keys(payer.properties)) {
                const cardsFromGroup = getCardsByInstanceIds(
                    payer.properties[group],
                    paymentCardIds
                );

                selectedPropertyCards.push(
                    ...cardsFromGroup.map((card) => ({
                        ...card,
                        paidFromPropertyGroup: group,
                    }))
                );

                updatedPayerProperties[group] = removeCardsByInstanceIds(
                    payer.properties[group],
                    paymentCardIds
                );
            }

            const selectedCards = [...selectedBankCards, ...selectedPropertyCards];

            const paymentTotal = selectedCards.reduce(
                (sum, card) => sum + card.value,
                0
            );

            const payerTotalAssets =
                payer.bank.reduce((sum, card) => sum + card.value, 0) +
                Object.keys(payer.properties).reduce((sum, group) => {
                    return (
                        sum +
                        payer.properties[group].reduce(
                            (groupSum, card) => groupSum + card.value,
                            0
                        )
                    );
                }, 0);

            if (
                paymentTotal < state.pendingPayment.amount &&
                paymentTotal < payerTotalAssets
            ) {
                return state;
            }

            const updatedPlayers = [...state.players];

            updatedPlayers[payerIndex] = {
                ...payer,
                bank: removeCardsByInstanceIds(payer.bank, paymentCardIds),
                properties: updatedPayerProperties,
            };

            updatedPlayers[receiverIndex] = {
                ...receiver,
                bank: [...receiver.bank, ...selectedBankCards],
                properties: selectedPropertyCards.reduce(
                    (properties, card) => {
                        const group = card.meta.activeColor;

                        return {
                            ...properties,
                            [group]: [
                                ...properties[group],
                                {
                                    ...card,
                                    paidFromPropertyGroup: undefined,
                                },
                            ],
                        };
                    },
                    receiver.properties
                ),
            };

            const nextPendingPayment = state.paymentQueue[0] || null;
            const nextPaymentQueue = state.paymentQueue.slice(1);

            const nextState = {
                ...state,
                status: nextPendingPayment ? "waiting_for_payment" : "playing",
                players: updatedPlayers,
                pendingPayment: nextPendingPayment,
                paymentQueue: nextPaymentQueue,
                turn: {
                    ...state.turn,
                    phase: nextPendingPayment ? "payment" : "action",
                },
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `${payer.name} paid $${paymentTotal}M to ${receiver.name}.`,
                    },
                ],
            };

            return applyWinCondition(nextState);
        }

        case "DISCARD_CARD": {
            const { playerId, cardInstanceId } = action.payload;

            if (state.status !== "discarding") return state;
            if (state.currentPlayerId !== playerId) return state;

            const playerIndex = state.players.findIndex(
                (player) => player.id === playerId
            );

            if (playerIndex === -1) return state;

            const player = state.players[playerIndex];

            if (player.hand.length <= 7) return state;

            const { card, updatedHand } = removeCardFromHand(player, cardInstanceId);

            if (!card) return state;

            const updatedPlayers = [...state.players];

            updatedPlayers[playerIndex] = {
                ...player,
                hand: updatedHand,
            };

            return {
                ...state,
                players: updatedPlayers,
                discardPile: [...state.discardPile, card],
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `${player.name} discarded ${card.name}.`,
                    },
                ],
            };
        }

        case "FINISH_DISCARDING": {
            const { playerId } = action.payload;

            if (state.status !== "discarding") return state;
            if (state.currentPlayerId !== playerId) return state;

            const player = state.players.find((item) => item.id === playerId);

            if (!player) return state;
            if (player.hand.length > 7) return state;

            const currentPlayerIndex = state.turnOrder.indexOf(state.currentPlayerId);
            const nextPlayerIndex = (currentPlayerIndex + 1) % state.turnOrder.length;
            const nextPlayerId = state.turnOrder[nextPlayerIndex];

            return {
                ...state,
                status: "playing",
                currentPlayerId: nextPlayerId,
                turn: {
                    number: state.turn.number + 1,
                    actionsUsed: 0,
                    maxActions: 3,
                    hasDrawn: false,
                    phase: "draw",
                },
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `Discard complete. Next player is ${nextPlayerId}.`,
                    },
                ],
            };
        }

        case "AUTO_PLAY_RANDOM_CARD": {
            const { playerId } = action.payload;

            if (!canUseAction(state, playerId)) return state;

            const playerIndex = state.players.findIndex(
                (player) => player.id === playerId
            );

            if (playerIndex === -1) return state;

            const player = state.players[playerIndex];

            if (player.hand.length === 0) return state;

            const randomIndex = Math.floor(Math.random() * player.hand.length);
            const randomCard = player.hand[randomIndex];

            const updatedHand = player.hand.filter(
                (card) => card.instanceId !== randomCard.instanceId
            );

            const updatedPlayers = [...state.players];

            if (randomCard.type === "property" || randomCard.type === "wild") {
                const availableColors = randomCard.meta.colors || [];
                const selectedColor =
                    randomCard.meta.activeColor || availableColors[0];

                if (!selectedColor) return state;

                const propertyCard = {
                    ...randomCard,
                    meta: {
                        ...randomCard.meta,
                        activeColor: selectedColor,
                    },
                };

                updatedPlayers[playerIndex] = {
                    ...player,
                    hand: updatedHand,
                    properties: {
                        ...player.properties,
                        [selectedColor]: [
                            ...player.properties[selectedColor],
                            propertyCard,
                        ],
                    },
                };

                const nextState = {
                    ...state,
                    players: updatedPlayers,
                    turn: incrementActionCount(state),
                    log: [
                        ...state.log,
                        {
                            id: `log_${state.log.length + 1}`,
                            message: `${player.name}'s timer ended. ${randomCard.name} was auto-played as a property.`,
                        },
                    ],
                };

                return applyWinCondition(nextState);
            }

            updatedPlayers[playerIndex] = {
                ...player,
                hand: updatedHand,
                bank: [...player.bank, randomCard],
            };

            return {
                ...state,
                players: updatedPlayers,
                turn: incrementActionCount(state),
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `${player.name}'s timer ended. ${randomCard.name} was auto-banked.`,
                    },
                ],
            };
        }

        case "END_TURN": {
            if (state.status !== "playing") return state;

            const currentPlayer = state.players.find(
                (player) => player.id === state.currentPlayerId
            );

            if (!currentPlayer) return state;

            if (currentPlayer.hand.length > 7) {
                return {
                    ...state,
                    status: "discarding",
                    turn: {
                        ...state.turn,
                        phase: "discard",
                    },
                    log: [
                        ...state.log,
                        {
                            id: `log_${state.log.length + 1}`,
                            message: `${currentPlayer.name} must discard down to 7 cards.`,
                        },
                    ],
                };
            }

            const currentPlayerIndex = state.turnOrder.indexOf(state.currentPlayerId);
            const nextPlayerIndex = (currentPlayerIndex + 1) % state.turnOrder.length;
            const nextPlayerId = state.turnOrder[nextPlayerIndex];

            return {
                ...state,
                currentPlayerId: nextPlayerId,
                turn: {
                    number: state.turn.number + 1,
                    actionsUsed: 0,
                    maxActions: 3,
                    hasDrawn: false,
                    phase: "draw",
                },
                log: [
                    ...state.log,
                    {
                        id: `log_${state.log.length + 1}`,
                        message: `Turn ended. Next player is ${nextPlayerId}.`,
                    },
                ],
            };
        }

        default:
            return state;
    }
}