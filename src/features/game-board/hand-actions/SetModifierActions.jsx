import { t } from "../../../i18n/translations";

export function SetModifierActions({
  card,
  canAct,
  modifierTargets,
  selectedTargets,
  onTargetChange,
  onPlaySetModifier,
  language,
}) {
  return (
    <>
      {modifierTargets.length > 0 && (
        <select
          value={selectedTargets[card.instanceId] || modifierTargets[0]?.group}
          onChange={(event) =>
            onTargetChange(card.instanceId, event.target.value)
          }
          disabled={!canAct}
        >
          {modifierTargets.map((item) => (
            <option value={item.group} key={item.group}>
              {t(language, "addTo")} {item.label}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={() => onPlaySetModifier(card)}
        disabled={!canAct || modifierTargets.length === 0}
      >
        {t(language, "playCard")} {card.name}
      </button>
    </>
  );
}