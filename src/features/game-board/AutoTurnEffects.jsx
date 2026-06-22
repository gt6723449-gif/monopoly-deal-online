import { useEffect } from "react";

function getPayableCards(player) {
  return [
    ...player.bank,
    ...Object.keys(player.properties).flatMap((group) => player.properties[group]),
  ];
}

function getClosestPaymentCardIds(player, amount) {
  const cards = getPayableCards(player);

  if (cards.length === 0) return [];

  const totalAssets = cards.reduce((sum, card) => sum + card.value, 0);

  if (totalAssets <= amount) {
    return cards.map((card) => card.instanceId);
  }

  const totals = new Map([[0, []]]);

  for (const card of cards) {
    const currentTotals = Array.from(totals.entries());

    for (const [total, cardIds] of currentTotals) {
      const nextTotal = total + card.value;

      if (!totals.has(nextTotal)) {
        totals.set(nextTotal, [...cardIds, card.instanceId]);
      }
    }
  }

  for (let total = amount; total <= totalAssets; total += 1) {
    const cardIds = totals.get(total);

    if (cardIds) return cardIds;
  }

  return cards.map((card) => card.instanceId);
}

export function AutoTurnEffects({ game, currentPlayer, dispatch }) {
  useEffect(() => {
    if (game.status !== "playing") return;
    if (game.turn.phase !== "draw") return;
    if (game.turn.hasDrawn) return;

    const drawCount = currentPlayer.hand.length === 0 ? 5 : 2;

    dispatch({
      type: "DRAW_CARDS",
      payload: {
        playerId: currentPlayer.id,
        count: drawCount,
      },
    });
  }, [
    game.status,
    game.turn.phase,
    game.turn.hasDrawn,
    currentPlayer.id,
    currentPlayer.hand.length,
    dispatch,
  ]);

  useEffect(() => {
    if (game.status !== "playing") return;
    if (game.turn.phase !== "action") return;
    if (game.turn.actionsUsed < game.turn.maxActions) return;

    dispatch({
      type: "END_TURN",
      payload: {
        playerId: currentPlayer.id,
      },
    });
  }, [
    game.status,
    game.turn.phase,
    game.turn.actionsUsed,
    game.turn.maxActions,
    currentPlayer.id,
    dispatch,
  ]);

  useEffect(() => {
    if (game.status !== "playing") return undefined;
    if (game.turn.phase !== "action") return undefined;
    if (!currentPlayer.isBot) return undefined;

    const timeoutId = window.setTimeout(() => {
      if (game.turn.actionsUsed >= game.turn.maxActions || currentPlayer.hand.length === 0) {
        dispatch({
          type: "END_TURN",
          payload: {
            playerId: currentPlayer.id,
          },
        });
        return;
      }

      dispatch({
        type: "AUTO_PLAY_RANDOM_CARD",
        payload: {
          playerId: currentPlayer.id,
        },
      });
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [
    game.status,
    game.turn.phase,
    game.turn.actionsUsed,
    game.turn.maxActions,
    currentPlayer.id,
    currentPlayer.isBot,
    currentPlayer.hand.length,
    dispatch,
  ]);

  useEffect(() => {
    if (game.status !== "discarding") return undefined;
    if (!currentPlayer.isBot) return undefined;

    const timeoutId = window.setTimeout(() => {
      if (currentPlayer.hand.length <= 7) {
        dispatch({
          type: "FINISH_DISCARDING",
          payload: {
            playerId: currentPlayer.id,
          },
        });
        return;
      }

      const randomCard =
        currentPlayer.hand[Math.floor(Math.random() * currentPlayer.hand.length)];

      dispatch({
        type: "DISCARD_CARD",
        payload: {
          playerId: currentPlayer.id,
          cardInstanceId: randomCard.instanceId,
        },
      });
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [
    game.status,
    currentPlayer.id,
    currentPlayer.isBot,
    currentPlayer.hand,
    currentPlayer.hand.length,
    dispatch,
  ]);

  useEffect(() => {
    if (game.status !== "waiting_for_payment") return undefined;
    if (!game.pendingPayment) return undefined;

    const payer = game.players.find(
      (player) => player.id === game.pendingPayment.fromPlayerId
    );

    if (!payer?.isBot) return undefined;

    const timeoutId = window.setTimeout(() => {
      dispatch({
        type: "PAY_DEBT",
        payload: {
          playerId: payer.id,
          paymentCardIds: getClosestPaymentCardIds(
            payer,
            game.pendingPayment.amount
          ),
        },
      });
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [game.status, game.pendingPayment, game.players, dispatch]);

  useEffect(() => {
    if (game.status !== "waiting_for_response") return undefined;
    if (!game.pendingAction) return undefined;

    const respondingPlayerId = game.pendingAction.responsePlayerIds[0];
    const respondingPlayer = game.players.find(
      (player) => player.id === respondingPlayerId
    );

    if (!respondingPlayer?.isBot) return undefined;

    const justSayNoCard = respondingPlayer.hand.find(
      (card) => card.type === "action" && card.meta.actionType === "justSayNo"
    );

    const timeoutId = window.setTimeout(() => {
      if (justSayNoCard && Math.random() < 0.5) {
        dispatch({
          type: "PLAY_JUST_SAY_NO",
          payload: {
            playerId: respondingPlayer.id,
            cardInstanceId: justSayNoCard.instanceId,
          },
        });
        return;
      }

      dispatch({
        type: "DECLINE_JUST_SAY_NO",
        payload: {
          playerId: respondingPlayer.id,
        },
      });
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [game.status, game.pendingAction, game.players, dispatch]);

  return null;
}
