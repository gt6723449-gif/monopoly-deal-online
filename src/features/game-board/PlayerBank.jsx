export function PlayerBank({ player }) {
    return (
        <section className="table-zone">
            <h3>Bank</h3>

            <p>Total: ${player.bank.reduce((sum, card) => sum + card.value, 0)}M</p>

            <div className="mini-card-list">
                {player.bank.map((card) => (
                    <div className={`mini-card mini-card-${card.type}`} key={card.instanceId}>
                        {card.name}
                    </div>
                ))}
            </div>
        </section>
    );
}