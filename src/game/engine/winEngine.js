import { PROPERTY_SETS } from "../data/propertySets";

export function isPropertySetComplete(player, group) {
  const setDefinition = PROPERTY_SETS[group];

  if (!setDefinition) {
    return false;
  }

  return player.properties[group].length >= setDefinition.requiredCount;
}

export function getCompletedPropertySets(player) {
  return Object.keys(PROPERTY_SETS).filter((group) =>
    isPropertySetComplete(player, group)
  );
}

export function getCompletedPropertySetCount(player) {
  return getCompletedPropertySets(player).length;
}

export function getWinningPlayer(players) {
  return players.find((player) => getCompletedPropertySetCount(player) >= 3);
}