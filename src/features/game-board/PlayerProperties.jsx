import { PROPERTY_SETS } from "../../game/data/propertySets";

const PROPERTY_GROUPS = Object.keys(PROPERTY_SETS);

const PROPERTY_COLORS = {
  brown: "#8b4513",
  lightBlue: "#8ed8f8",
  pink: "#ff5aa5",
  orange: "#f97316",
  red: "#dc2626",
  yellow: "#facc15",
  green: "#16a34a",
  darkBlue: "#1d4ed8",
  railroad: "#111827",
  utility: "#94a3b8",
};

function formatColorName(color) {
  return PROPERTY_SETS[color]?.label || color;
}

export function PlayerProperties({ player, currentPlayer, game, dispatch }) {
  return (
    <section className="table-zone">
      <div className="property-groups">
        {PROPERTY_GROUPS.map((group) => {
          const setDefinition = PROPERTY_SETS[group];
          const currentCount = player.properties[group].length;
          const isComplete = currentCount >= setDefinition.requiredCount;

          return (
            <div
              className={isComplete ? "property-group complete-set" : "property-group"}
              key={group}
              title={`${formatColorName(group)} ${currentCount}/${setDefinition.requiredCount}`}
            >
              <div
                className="property-group-color"
                style={{ background: PROPERTY_COLORS[group] }}
              />

              <div className="property-card-slots">
                {player.properties[group].map((card) => {
                  const canMoveWild =
                    player.id === currentPlayer.id &&
                    card.type === "wild" &&
                    game.status === "playing" &&
                    game.turn.phase === "action";

                  const availableColors = card.meta.colors || [];

                  return (
                    <div
                      className={
                        card.type === "wild"
                          ? "property-slot-filled property-slot-wild"
                          : "property-slot-filled"
                      }
                      key={card.instanceId}
                      style={{
                        background:
                          PROPERTY_COLORS[card.meta.activeColor] ||
                          PROPERTY_COLORS[group],
                      }}
                      title={card.name}
                    >
                      {canMoveWild && availableColors.length > 1 && (
                        <select
                          value={card.meta.activeColor}
                          onChange={(event) =>
                            dispatch({
                              type: "CHANGE_WILD_COLOR",
                              payload: {
                                playerId: currentPlayer.id,
                                cardInstanceId: card.instanceId,
                                newColor: event.target.value,
                              },
                            })
                          }
                        >
                          {availableColors.map((color) => (
                            <option value={color} key={color}>
                              {formatColorName(color)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>

              {player.propertySetModifiers[group]?.house && (
                <div className="set-modifier-dot">H</div>
              )}

              {player.propertySetModifiers[group]?.hotel && (
                <div className="set-modifier-dot">★</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}