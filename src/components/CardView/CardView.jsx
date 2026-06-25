import { PROPERTY_SETS } from "../../game/data/propertySets";
import { t } from "../../i18n/translations";

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

function getCardValue(card) {
  return `$${card.value}M`;
}

function getPrimaryColor(card) {
  return card.meta?.activeColor || card.meta?.colors?.[0] || "utility";
}

function getCardName(card, language) {
  return t(language, `cardName.${card.id}`);
}

function getCardDescription(card, language) {
  return t(language, `cardDescription.${card.id}`);
}

function getCardTypeLabel(card, language) {
  if (card.type === "property" || card.type === "wild") {
    return t(language, "propertyCard");
  }

  if (card.type === "money") {
    return t(language, "moneyCard");
  }

  if (card.type === "rent") {
    return t(language, "rentCard");
  }

  if (card.type === "action") {
    return t(language, "actionCard");
  }

  return card.type;
}

function getRentRows(card, language) {
  const color = getPrimaryColor(card);
  const set = PROPERTY_SETS[color];

  if (!set) return [];

  return set.rents.map((rent, index) => ({
    label:
      index + 1 === 1
        ? `1 ${t(language, "cardSingular")}`
        : `${index + 1} ${t(language, "cardPlural")}`,
    rent,
  }));
}

function PropertyColorBar({ card }) {
  const colors = card.meta?.colors || [];

  if (colors.length <= 1) {
    return (
      <div
        className="deal-property-bar"
        style={{ background: PROPERTY_COLORS[getPrimaryColor(card)] }}
      />
    );
  }

  return (
    <div className="deal-property-bar split">
      {colors.map((color) => (
        <span
          key={color}
          style={{ background: PROPERTY_COLORS[color] || "#cbd5e1" }}
        />
      ))}
    </div>
  );
}

function RentColorCircle({ card, language }) {
  const colors = card.meta?.colors || [];

  if (colors.length === 0) {
    return (
      <div className="deal-action-icon rent-icon">
        <span>{t(language, "rent")}</span>
      </div>
    );
  }

  if (colors.length === 1) {
    return (
      <div
        className="deal-action-icon rent-icon single-rent-color"
        style={{ background: PROPERTY_COLORS[colors[0]] }}
      >
        <span>{t(language, "rent")}</span>
      </div>
    );
  }

  const gradientStops = colors
    .map((color, index) => {
      const start = (index / colors.length) * 100;
      const end = ((index + 1) / colors.length) * 100;
      return `${PROPERTY_COLORS[color] || "#cbd5e1"} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div
      className="deal-action-icon rent-icon"
      style={{ background: `conic-gradient(${gradientStops})` }}
    >
      <span>{t(language, "rent")}</span>
    </div>
  );
}

export function CardView({ card, children, compact = false, language = "en" }) {
  const translatedName = getCardName(card, language);
  const translatedDescription = getCardDescription(card, language);

  if (compact) {
    return (
      <div className={`mini-card mini-card-${card.type}`}>
        <strong>{translatedName}</strong>
        <span>{getCardValue(card)}</span>
        {children}
      </div>
    );
  }

  const isProperty = card.type === "property" || card.type === "wild";
  const isMoney = card.type === "money";
  const isRent = card.type === "rent";
  const isAction = card.type === "action";

  return (
    <article className={`deal-card deal-card-${card.type}`}>
      <div className="deal-card-value">
        <span>{getCardValue(card)}</span>
      </div>

      <div className="deal-card-top-band">
        {isProperty && <PropertyColorBar card={card} />}
      </div>

      <header className="deal-card-header">
        <p>{getCardTypeLabel(card, language)}</p>
        <h3>{translatedName}</h3>
      </header>

      {isMoney && (
        <div className="deal-money-center">
          <span>{getCardValue(card)}</span>
        </div>
      )}

      {isProperty && (
        <div className="deal-rent-table">
          <strong>{t(language, "rent")}</strong>
          {getRentRows(card, language).map((row) => (
            <div key={row.label}>
              <span>{row.label}</span>
              <span>${row.rent}M</span>
            </div>
          ))}
        </div>
      )}

      {isRent && <RentColorCircle card={card} language={language} />}

      {isAction && (
        <div className="deal-action-name-circle">
          <strong>{translatedName}</strong>
        </div>
      )}

      {translatedDescription && !isProperty && !isMoney && (
        <p className="deal-card-text">{translatedDescription}</p>
      )}

      {children && <div className="card-actions">{children}</div>}
    </article>
  );
}
