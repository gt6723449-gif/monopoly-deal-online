import { useState } from "react";
import { CardView } from "../../components/CardView/CardView";
import { getPropertyColorName } from "../../game/data/propertyColorNames";
import { PROPERTY_SETS } from "../../game/data/propertySets";
import { t } from "../../i18n/translations";

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

function getPropertySlotBackground(card, group) {
  const activeColor = card.meta?.activeColor || group;
  const activeColorValue = PROPERTY_COLORS[activeColor] || PROPERTY_COLORS[group];
  const colors = card.meta?.colors || [];
  const extraColors = colors.filter((color) => color !== activeColor);

  if (card.type !== "wild" || extraColors.length === 0) {
    return activeColorValue;
  }

  const passiveStops = extraColors
    .map((color, index) => {
      const start = 75 + (index / extraColors.length) * 25;
      const end = 75 + ((index + 1) / extraColors.length) * 25;
      return `${PROPERTY_COLORS[color] || "#cbd5e1"} ${start}% ${end}%`;
    })
    .join(", ");

  return `linear-gradient(90deg, ${activeColorValue} 0 75%, ${passiveStops})`;
}

export function PlayerProperties({
  player,
  currentPlayer,
  game,
  dispatch,
  language = "en",
}) {
  const [previewCard, setPreviewCard] = useState(null);
  const [colorChoiceCard, setColorChoiceCard] = useState(null);
  const canChangeWildColor =
    player.id === currentPlayer.id &&
    game.status === "playing" &&
    game.currentPlayerId === currentPlayer.id &&
    game.turn.phase === "action";

  function handlePropertyClick(card) {
    if (
      canChangeWildColor &&
      card.type === "wild" &&
      (card.meta?.colors || []).length > 1
    ) {
      setColorChoiceCard(card);
      return;
    }

    setPreviewCard(card);
  }

  function changeWildColor(color) {
    if (!colorChoiceCard) return;

    dispatch({
      type: "CHANGE_WILD_COLOR",
      payload: {
        playerId: currentPlayer.id,
        cardInstanceId: colorChoiceCard.instanceId,
        newColor: color,
      },
    });
    setColorChoiceCard(null);
  }

  return (
    <section className="table-zone">
      <div className="property-groups">
        {PROPERTY_GROUPS.map((group) => {
          const setDefinition = PROPERTY_SETS[group];
          const currentCount = player.properties[group].length;
          const isComplete = currentCount >= setDefinition.requiredCount;
          const slotCount = currentCount > 0 ? setDefinition.requiredCount : 1;

          return (
            <div
              className={isComplete ? "property-group complete-set" : "property-group"}
              key={group}
              title={`${getPropertyColorName(group, language)} ${currentCount}/${setDefinition.requiredCount}`}
            >
              <div
                className="property-card-slots"
                style={{
                  "--property-slot-count": slotCount,
                }}
              >
                {Array.from({ length: slotCount }).map((_, index) => {
                  const card = player.properties[group][index];

                  if (!card) {
                    return (
                      <div
                        className="property-slot property-slot-empty"
                        key={`${group}-empty-${index}`}
                      />
                    );
                  }

                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      className={
                        card.type === "wild"
                          ? "property-slot property-slot-filled property-slot-wild"
                          : "property-slot property-slot-filled"
                      }
                      key={card.instanceId}
                      style={{
                        background: getPropertySlotBackground(card, group),
                      }}
                      title={card.name}
                      onClick={() => handlePropertyClick(card)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handlePropertyClick(card);
                        }
                      }}
                    />
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

      {previewCard && (
        <div
          className="property-preview-backdrop"
          onClick={() => setPreviewCard(null)}
        >
          <div
            className="property-preview-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <CardView card={previewCard} language={language} />
            <button type="button" onClick={() => setPreviewCard(null)}>
              {t(language, "close")}
            </button>
          </div>
        </div>
      )}

      {colorChoiceCard && (
        <div
          className="property-preview-backdrop"
          onClick={() => setColorChoiceCard(null)}
        >
          <section
            className="property-preview-modal property-color-change-modal"
            dir={language === "ar" ? "rtl" : "ltr"}
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>{t(language, `cardName.${colorChoiceCard.id}`)}</h2>
            <CardView card={colorChoiceCard} language={language} />
            <div className="property-color-choice-grid">
              {(colorChoiceCard.meta?.colors || []).map((color) => (
                <button
                  type="button"
                  className="property-color-choice"
                  key={color}
                  style={{
                    "--property-choice-color": PROPERTY_COLORS[color] || "#cbd5e1",
                  }}
                  onClick={() => changeWildColor(color)}
                >
                  <span>{getPropertyColorName(color, language)}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="action-choice-cancel"
              onClick={() => setColorChoiceCard(null)}
            >
              {t(language, "cancel")}
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
