import { PROPERTY_SETS } from "../data/propertySets";

export function calculateRentForGroup(player, group) {
  const setDefinition = PROPERTY_SETS[group];

  if (!setDefinition) {
    return 0;
  }

  const propertyCount = player.properties[group].length;

  if (propertyCount === 0) {
    return 0;
  }

  const rentIndex = Math.min(propertyCount, setDefinition.rents.length) - 1;
  let rent = setDefinition.rents[rentIndex];

  const modifiers = player.propertySetModifiers[group];

  if (modifiers?.house) {
    rent += modifiers.house.value;
  }

  if (modifiers?.hotel) {
    rent += modifiers.hotel.value;
  }

  return rent;
}