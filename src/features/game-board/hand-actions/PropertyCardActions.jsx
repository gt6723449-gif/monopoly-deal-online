import { getPropertyColorName } from "../../../game/data/propertyColorNames";
import { t } from "../../../i18n/translations";

export function PropertyCardActions({
  card,
  canAct,
  selectedColors,
  onColorChange,
  onPlayProperty,
  language,
}) {
  const availableColors = card.meta.colors || [];
  const selectedColor = selectedColors[card.instanceId] || availableColors[0];

  return (
    <>
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

      <button
        type="button"
        onClick={() => onPlayProperty(card)}
        disabled={!canAct}
      >
        {t(language, "playProperty")}
      </button>
    </>
  );
}
