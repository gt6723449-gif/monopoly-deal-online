import { getCompletedPropertySetCount } from "../../game/engine/winEngine";
import { PlayerBank } from "./PlayerBank";
import { PlayerHand } from "./PlayerHand";
import { PlayerProperties } from "./PlayerProperties";

export function PlayerPanel({
    player,
    currentPlayer,
    game,
    dispatch,
    selectedColors,
    setSelectedColors,
    selectedTargets,
    setSelectedTargets,
}) {
    const completedSetCount = getCompletedPropertySetCount(player);

    return (
        <section
            className={
                player.id === game.currentPlayerId
                    ? "player-panel active-player"
                    : "player-panel"
            }
        >
            <h2>{player.name}</h2>

            <p>
                <strong>Completed Sets:</strong> {completedSetCount}/3
            </p>

            <PlayerBank player={player} />

            <PlayerProperties
                player={player}
                currentPlayer={currentPlayer}
                game={game}
                dispatch={dispatch}
            />

            <PlayerHand
                player={player}
                currentPlayer={currentPlayer}
                game={game}
                dispatch={dispatch}
                selectedColors={selectedColors}
                setSelectedColors={setSelectedColors}
                selectedTargets={selectedTargets}
                setSelectedTargets={setSelectedTargets}
            />
        </section>
    );
}