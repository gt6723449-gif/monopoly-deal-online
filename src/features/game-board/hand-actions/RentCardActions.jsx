import { getPropertyColorName } from "../../../game/data/propertyColorNames";
import { t } from "../../../i18n/translations";
import { getDoubleRentCards } from "../playerHandHelpers";

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
  language,
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
              {t(language, "target")}: {targetPlayer.name}
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
              {getPropertyColorName(color, language)}
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
          {t(language, "use")} {doubleRentCard.name}
        </label>
      ))}

      <button type="button" onClick={() => onPlayRent(card)} disabled={!canAct}>
        {t(language, "playRent")}
      </button>
    </>
  );
}
