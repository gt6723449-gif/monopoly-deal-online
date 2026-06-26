import { useState } from "react";
import { t } from "../../i18n/translations";
import { RulesModal } from "./RulesModal";

const BOT_NAMES = {
  en: ["Omar", "Sara", "Layan"],
  ar: ["\u0639\u0645\u0631", "\u0633\u0627\u0631\u0629", "\u0644\u064a\u0627\u0646"],
};

export function GameSetup({ dispatch, language, onStart }) {
  const botNames = BOT_NAMES[language] || BOT_NAMES.en;
  const [playerCount, setPlayerCount] = useState(2);
  const [playMode, setPlayMode] = useState("bots");
  const [showRules, setShowRules] = useState(false);
  const [playerNames, setPlayerNames] = useState([
    "",
    botNames[0],
    botNames[1],
    botNames[2],
  ]);
  const canStartGame = playerNames[0].trim().length > 0;

  function handleNameChange(index, value) {
    setPlayerNames((current) => {
      const updatedNames = [...current];
      updatedNames[index] = value;
      return updatedNames;
    });
  }

  function handleStartGame(event) {
    event.preventDefault();

    if (!canStartGame) return;

    const activePlayerNames = playerNames
      .slice(0, playerCount)
      .map((name, index) => {
        if (playMode === "bots" && index > 0) {
          return botNames[index - 1];
        }

        return name.trim() || `${t(language, "playerName")} ${index + 1}`;
      });
    const botPlayerIds =
      playMode === "bots"
        ? activePlayerNames.slice(1).map((_, index) => `player_${index + 2}`)
        : [];

    dispatch({
      type: "START_NEW_GAME",
      payload: {
        playerNames: activePlayerNames,
        botPlayerIds,
        mode: playMode,
      },
    });

    onStart();
  }

  return (
    <main className="start-page" dir={language === "ar" ? "rtl" : "ltr"}>
      <section className="start-card">
        <div className="game-logo">
          <span>MONOPOLY</span>
          <strong>DEAL</strong>
        </div>

        <p className="start-subtitle">{t(language, "onlineCardGame")}</p>

        <button
          type="button"
          className="rules-button"
          onClick={() => setShowRules(true)}
        >
          {t(language, "rules")}
        </button>

        <form onSubmit={handleStartGame}>
          <fieldset className="setup-choice-group">
            <legend>{t(language, "numberOfPlayers")}</legend>
            <div className="setup-choice-grid">
              {[2, 4].map((count) => (
                <button
                  type="button"
                  className={
                    playerCount === count
                      ? "setup-choice-card selected-setup-choice"
                      : "setup-choice-card"
                  }
                  key={count}
                  onClick={() => setPlayerCount(count)}
                >
                  <strong>{count}</strong>
                  <span>{t(language, "players")}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="setup-choice-group">
            <legend>{t(language, "gameMode")}</legend>
            <div className="setup-choice-grid">
              <button
                type="button"
                className={
                  playMode === "bots"
                    ? "setup-choice-card selected-setup-choice"
                    : "setup-choice-card"
                }
                onClick={() => setPlayMode("bots")}
              >
                {t(language, "playWithBots")}
              </button>

              <button
                type="button"
                className="setup-choice-card"
                disabled
              >
                {t(language, "playOnlinePlayers")}
              </button>
            </div>
          </fieldset>

          <div className="setup-names">
            <label>
              {t(language, "yourName")}
              <input
                type="text"
                value={playerNames[0]}
                onChange={(event) => handleNameChange(0, event.target.value)}
                required
              />
            </label>
          </div>

          <button type="submit" className="start-button" disabled={!canStartGame}>
            {t(language, "startGame")}
          </button>
        </form>
      </section>

      {showRules && (
        <RulesModal language={language} onClose={() => setShowRules(false)} />
      )}
    </main>
  );
}
