export function ForcedDealActions({
  card,
  canAct,
  ownProperties,
  forcedDealTargets,
  selectedTargets,
  onTargetChange,
  onPlayForcedDeal,
}) {
  return (
    <>
      {ownProperties.length > 0 && (
        <select
          value={
            selectedTargets[`${card.instanceId}_offered`] ||
            ownProperties[0]?.card.instanceId
          }
          onChange={(event) =>
            onTargetChange(`${card.instanceId}_offered`, event.target.value)
          }
          disabled={!canAct}
        >
          {ownProperties.map((item) => (
            <option value={item.card.instanceId} key={item.card.instanceId}>
              Give {item.card.name}
            </option>
          ))}
        </select>
      )}

      {forcedDealTargets.length > 0 && (
        <select
          value={
            selectedTargets[`${card.instanceId}_target`] ||
            forcedDealTargets[0]?.card.instanceId
          }
          onChange={(event) =>
            onTargetChange(`${card.instanceId}_target`, event.target.value)
          }
          disabled={!canAct}
        >
          {forcedDealTargets.map((item) => (
            <option value={item.card.instanceId} key={item.card.instanceId}>
              Take {item.card.name} from {item.playerName}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={() => onPlayForcedDeal(card)}
        disabled={
          !canAct || ownProperties.length === 0 || forcedDealTargets.length === 0
        }
      >
        Play Forced Deal
      </button>
    </>
  );
}