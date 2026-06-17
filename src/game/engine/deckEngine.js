import { CARD_DEFINITIONS } from "../data/cards";
import { createId } from "../utils/id";
import { shuffleArray } from "../utils/shuffle";

export function createDeck() {
  const deck = [];

  CARD_DEFINITIONS.forEach((cardDefinition) => {
    for (let i = 0; i < cardDefinition.count; i += 1) {
      deck.push({
        ...cardDefinition,
        instanceId: createId("card"),
      });
    }
  });

  return shuffleArray(deck);
}

export function drawCards(deck, count) {
  const drawnCards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);

  return {
    drawnCards,
    remainingDeck,
  };
}

export function drawCardsWithReshuffle({ deck, discardPile, count }) {
  let workingDeck = [...deck];
  let workingDiscardPile = [...discardPile];
  const drawnCards = [];

  while (drawnCards.length < count) {
    if (workingDeck.length === 0) {
      if (workingDiscardPile.length === 0) {
        break;
      }

      workingDeck = shuffleArray(workingDiscardPile);
      workingDiscardPile = [];
    }

    const nextCard = workingDeck[0];

    workingDeck = workingDeck.slice(1);
    drawnCards.push(nextCard);
  }

  return {
    drawnCards,
    remainingDeck: workingDeck,
    remainingDiscardPile: workingDiscardPile,
  };
}