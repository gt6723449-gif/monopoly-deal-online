import { PROPERTY_SETS } from "../../game/data/propertySets";

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

function getRentRows(card) {
  const color = getPrimaryColor(card);
  const set = PROPERTY_SETS[color];

  if (!set) return [];

  return set.rents.map((rent, index) => ({
    label: `${index + 1} card${index + 1 > 1 ? "s" : ""}`,
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

function RentColorCircle({ card }) {
  const colors = card.meta?.colors || [];

  if (colors.length === 0) {
    return (
      <div className="deal-action-icon rent-icon">
        <span>RENT</span>
      </div>
    );
  }

  if (colors.length === 1) {
    return (
      <div
        className="deal-action-icon rent-icon single-rent-color"
        style={{ background: PROPERTY_COLORS[colors[0]] }}
      >
        <span>RENT</span>
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
      <span>RENT</span>
    </div>
  );
}

export function CardView({ card, children, compact = false }) {
  if (compact) {
    return (
      <div className={`mini-card mini-card-${card.type}`}>
        <strong>{card.name}</strong>
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

      {isProperty && <PropertyColorBar card={card} />}

      {!isProperty && <div className="deal-non-property-top-space" />}

      <header className="deal-card-header">
        <p>{isProperty ? "Property Card" : `${card.type} Card`}</p>
        <h3>{card.name}</h3>
      </header>

      {isMoney && (
        <div className="deal-money-center">
          <span>{getCardValue(card)}</span>
        </div>
      )}

      {isProperty && (
        <div className="deal-rent-table">
          <strong>Rent</strong>
          {getRentRows(card).map((row) => (
            <div key={row.label}>
              <span>{row.label}</span>
              <span>${row.rent}M</span>
            </div>
          ))}
        </div>
      )}

      {isRent && <RentColorCircle card={card} />}

      {isAction && <div className="deal-action-spacer" />}

      {card.description && !isProperty && !isMoney && (
        <p className="deal-card-text">{card.description}</p>
      )}

      {children && <div className="card-actions">{children}</div>}
    </article>
  );
}