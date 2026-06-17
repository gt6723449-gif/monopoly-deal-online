export function SlyDealActions({
  card,
  canAct,
  stealableProperties,
  selectedTargets,
  onTargetChange,
  onPlaySlyDeal,
}) {
  return (
    <>
      {stealableProperties.length > 0 && (
        <select
          value={
            selectedTargets[card.instanceId] ||
            stealableProperties[0]?.card.instanceId
          }
          onChange={(event) =>
            onTargetChange(card.instanceId, event.target.value)
          }
          disabled={!canAct}
        >
          {stealableProperties.map((item) => (
            <option value={item.card.instanceId} key={item.card.instanceId}>
              Steal {item.card.name} from {item.playerName}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={() => onPlaySlyDeal(card)}
        disabled={!canAct || stealableProperties.length === 0}
      >
        Play Sly Deal
      </button>
    </>
  );
}