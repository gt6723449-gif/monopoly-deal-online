import { t } from "../../i18n/translations";

export function PlayerBank({ player, language }) {
    return (
        <section className="table-zone">
            <h3>{t(language, "bank")}</h3>

            <p>
                {t(language, "total")}: $
                {player.bank.reduce((sum, card) => sum + card.value, 0)}M
            </p>

            <div className="mini-card-list">
                {player.bank.map((card) => (
                    <div
                        className={`mini-card mini-card-${card.type}`}
                        key={card.instanceId}
                    >
                        {card.name}
                    </div>
                ))}
            </div>
        </section>
    );
}