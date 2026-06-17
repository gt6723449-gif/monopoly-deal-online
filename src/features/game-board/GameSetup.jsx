import { useState } from "react";

export function GameSetup({ dispatch, onStart }) {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState([
    "Roy",
    "Player 2",
    "Player 3",
    "Player 4",
  ]);

  function handlePlayerCountChange(event) {
    setPlayerCount(Number(event.target.value));
  }

  function handleNameChange(index, value) {
    setPlayerNames((current) => {
      const updatedNames = [...current];
      updatedNames[index] = value;
      return updatedNames;
    });
  }

  function handleStartGame(event) {
    event.preventDefault();

    const activePlayerNames = playerNames
      .slice(0, playerCount)
      .map((name, index) => name.trim() || `Player ${index + 1}`);

    dispatch({
      type: "START_NEW_GAME",
      payload: {
        playerNames: activePlayerNames,
      },
    });

    onStart();
  }

  return (
    <main className="start-page">
      <section className="start-card">
        <div className="game-logo">
          <span>MONOPOLY</span>
          <strong>DEAL</strong>
        </div>

        <p className="start-subtitle">Online Card Game</p>

        <form onSubmit={handleStartGame}>
          <label>
            Number of players
            <select value={playerCount} onChange={handlePlayerCountChange}>
              <option value={2}>2 Players</option>
              <option value={3}>3 Players</option>
              <option value={4}>4 Players</option>
            </select>
          </label>

          <div className="setup-names">
            {Array.from({ length: playerCount }).map((_, index) => (
              <label key={index}>
                Player {index + 1} name
                <input
                  type="text"
                  value={playerNames[index]}
                  onChange={(event) =>
                    handleNameChange(index, event.target.value)
                  }
                />
              </label>
            ))}
          </div>

          <button type="submit" className="start-button">
            Start Game
          </button>
        </form>
      </section>
    </main>
  );
}