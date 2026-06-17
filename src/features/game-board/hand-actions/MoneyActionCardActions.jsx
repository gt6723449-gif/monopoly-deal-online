export function MoneyActionCardActions({
  card,
  canAct,
  requiresTargetSelection,
  targetablePlayers,
  selectedTargetId,
  onTargetChange,
  onPlayMoneyAction,
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
              Target: {targetPlayer.name}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={() => onPlayMoneyAction(card)}
        disabled={!canAct}
      >
        Play Action
      </button>
    </>
  );
}