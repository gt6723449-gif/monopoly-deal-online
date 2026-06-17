import { PROPERTY_SETS } from "../../game/data/propertySets";

export function getTargetablePlayers(game, currentPlayer) {
  return game.players.filter((player) => player.id !== currentPlayer.id);
}

export function getSelectedTargetId(game, currentPlayer, selectedTargets, cardId) {
  const firstOtherPlayer = getTargetablePlayers(game, currentPlayer)[0];
  return selectedTargets[cardId] || firstOtherPlayer?.id;
}

export function getCurrentPlayerProperties(currentPlayer) {
  return Object.keys(currentPlayer.properties).flatMap((group) => {
    const setDefinition = PROPERTY_SETS[group];

    if (!setDefinition) return [];

    return currentPlayer.properties[group].map((propertyCard) => ({
      group,
      card: propertyCard,
    }));
  });
}

export function getStealableProperties(game, currentPlayer) {
  return game.players
    .filter((player) => player.id !== currentPlayer.id)
    .flatMap((targetPlayer) =>
      Object.keys(targetPlayer.properties).flatMap((group) => {
        const setDefinition = PROPERTY_SETS[group];

        if (!setDefinition) return [];

        const isComplete =
          targetPlayer.properties[group].length >= setDefinition.requiredCount;

        if (isComplete) return [];

        return targetPlayer.properties[group].map((propertyCard) => ({
          playerId: targetPlayer.id,
          playerName: targetPlayer.name,
          group,
          card: propertyCard,
        }));
      })
    );
}

export function getStealableFullSets(game, currentPlayer) {
  return game.players
    .filter((player) => player.id !== currentPlayer.id)
    .flatMap((targetPlayer) =>
      Object.keys(targetPlayer.properties).flatMap((group) => {
        const setDefinition = PROPERTY_SETS[group];

        if (!setDefinition) return [];

        const isComplete =
          targetPlayer.properties[group].length >= setDefinition.requiredCount;

        if (!isComplete) return [];

        return [
          {
            playerId: targetPlayer.id,
            playerName: targetPlayer.name,
            group,
            label: `${targetPlayer.name}'s ${setDefinition.label} set`,
          },
        ];
      })
    );
}

export function getModifierTargets(currentPlayer, card) {
  const actionType = card.meta.actionType;

  return Object.keys(currentPlayer.properties)
    .filter((group) => {
      const setDefinition = PROPERTY_SETS[group];

      if (!setDefinition) return false;
      if (!setDefinition.allowsHouse || !setDefinition.allowsHotel) return false;

      const isComplete =
        currentPlayer.properties[group].length >= setDefinition.requiredCount;

      if (!isComplete) return false;

      const modifiers = currentPlayer.propertySetModifiers[group] || {};

      if (actionType === "house" && modifiers.house) return false;
      if (actionType === "hotel" && modifiers.hotel) return false;
      if (actionType === "hotel" && !modifiers.house) return false;

      return true;
    })
    .map((group) => ({
      group,
      label: PROPERTY_SETS[group].label,
    }));
}

export function getDoubleRentCards(currentPlayer) {
  return currentPlayer.hand
    .filter(
      (card) =>
        card.type === "action" && card.meta.actionType === "doubleRent"
    )
    .slice(0, 2);
}