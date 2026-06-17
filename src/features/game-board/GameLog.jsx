export function GameLog({ log }) {
  return (
    <section className="log-panel">
      <h2>Game Log</h2>

      <ul>
        {log.map((item) => (
          <li key={item.id}>{item.message}</li>
        ))}
      </ul>
    </section>
  );
}