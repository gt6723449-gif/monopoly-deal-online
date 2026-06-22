import { t } from "../../../i18n/translations";

export function MoneyActionCardActions({
  card,
  canAct,
  requiresTargetSelection,
  targetablePlayers,
  selectedTargetId,
  onTargetChange,
  onPlayMoneyAction,
  language,
}) {
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

      <button
        type="button"
        onClick={() => onPlayMoneyAction(card)}
        disabled={!canAct}
      >
        {t(language, "playAction")}
      </button>
    </>
  );
}