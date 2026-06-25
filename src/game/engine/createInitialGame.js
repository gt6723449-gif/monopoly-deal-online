import { createDeck, drawCards } from "./deckEngine";

export function createInitialGame({ playerNames, botPlayerIds = [], mode = "local" }) {
  let deck = createDeck();

  const players = playerNames.map((name, index) => ({
      id: `player_${index + 1}`,
      name,
      hand: [],
      bank: [],
      properties: {
        brown: [],
        lightBlue: [],
        pink: [],
        orange: [],
        red: [],
        yellow: [],
        green: [],
        darkBlue: [],
        railroad: [],
        utility: [],
        wilds: [],
      },
      propertySetModifiers: {},
      isConnected: true,
      isBot: botPlayerIds.includes(`player_${index + 1}`),
  }));

  for (let cardIndex = 0; cardIndex < 5; cardIndex += 1) {
    players.forEach((player) => {
      const result = drawCards(deck, 1);
      deck = result.remainingDeck;
      player.hand.push(...result.drawnCards);
    });
  }

  return {
    id: "local_game_1",
    status: "playing",
    mode,
    humanPlayerId: players[0].id,

    players,

    deck,
    discardPile: [],

    currentPlayerId: players[0].id,
    turnOrder: players.map((player) => player.id),

    turn: {
      number: 1,
      actionsUsed: 0,
      maxActions: 3,
      hasDrawn: false,
      phase: "draw",
    },

    pendingAction: null,
    pendingPayment: null,
    paymentQueue: [],

    winnerId: null,

    log: [
      {
        id: "log_1",
        message: "Game created.",
      },
    ],
  };
}
