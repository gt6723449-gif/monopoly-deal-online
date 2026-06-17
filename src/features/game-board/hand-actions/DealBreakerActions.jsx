export function DealBreakerActions({
  card,
  canAct,
  stealableFullSets,
  selectedTargets,
  onTargetChange,
  onPlayDealBreaker,
}) {
  return (
    <>
      {stealableFullSets.length > 0 && (
        <select
          value={selectedTargets[card.instanceId] || stealableFullSets[0]?.label}
          onChange={(event) =>
            onTargetChange(card.instanceId, event.target.value)
          }
          disabled={!canAct}
        >
          {stealableFullSets.map((item) => (
            <option value={item.label} key={item.label}>
              Steal {item.label}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={() => onPlayDealBreaker(card)}
        disabled={!canAct || stealableFullSets.length === 0}
      >
        Play Deal Breaker
      </button>
    </>
  );
}