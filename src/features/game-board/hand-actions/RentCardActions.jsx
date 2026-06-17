import { PROPERTY_SETS } from "../../../game/data/propertySets";
import { getDoubleRentCards } from "../playerHandHelpers";

function formatColorName(color) {
  return PROPERTY_SETS[color]?.label || color;
}

export function RentCardActions({
  card,
  canAct,
  currentPlayer,
  targetablePlayers,
  requiresTargetSelection,
  selectedColors,
  selectedTargets,
  selectedTargetId,
  onColorChange,
  onTargetChange,
  onPlayRent,
}) {
  const availableColors = card.meta.colors || [];
  const selectedColor = selectedColors[card.instanceId] || availableColors[0];

  return (
    <>
      {requiresTargetSelection && (
        <select
          value={selectedTargetId}
          onChange={(event) =>
            onTargetChange(card.instanceId, event.target.value)
          }
          disabled={!canAct}
        >
          {targetablePlayers.map((targetPlayer) => (
            <option value={targetPlayer.id} key={targetPlayer.id}>
              Target: {targetPlayer.name}
            </option>
          ))}
        </select>
      )}

      {availableColors.length > 1 && (
        <select
          value={selectedColor}
          onChange={(event) =>
            onColorChange(card.instanceId, event.target.value)
          }
          disabled={!canAct}
        >
          {availableColors.map((color) => (
            <option value={color} key={color}>
              {formatColorName(color)}
            </option>
          ))}
        </select>
      )}

      {getDoubleRentCards(currentPlayer).map((doubleRentCard) => (
        <label className="checkbox-row" key={doubleRentCard.instanceId}>
          <input
            type="checkbox"
            checked={Boolean(
              selectedTargets[
                `${card.instanceId}_double_${doubleRentCard.instanceId}`
              ]
            )}
            onChange={(event) =>
              onTargetChange(
                `${card.instanceId}_double_${doubleRentCard.instanceId}`,
                event.target.checked
              )
            }
            disabled={!canAct}
          />
          Use {doubleRentCard.name}
        </label>
      ))}

      <button type="button" onClick={() => onPlayRent(card)} disabled={!canAct}>
        Play Rent
      </button>
    </>
  );
}