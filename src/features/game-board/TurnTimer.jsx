import { useEffect, useState } from "react";

const TURN_SECONDS = 30;

export function TurnTimer({ game, player, dispatch, isRunning = false }) {
    const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);

    const timerKey = `${game.currentPlayerId}_${game.turn.actionsUsed}_${game.turn.phase}`;

    const isActive =
        isRunning &&
        game.status === "playing" &&
        game.turn.phase === "action" &&
        game.currentPlayerId === player.id &&
        game.turn.actionsUsed < game.turn.maxActions;

    useEffect(() => {
        setTimeLeft(TURN_SECONDS);
    }, [timerKey]);

    useEffect(() => {
        if (!isActive) return;

        if (timeLeft <= 0) {
            dispatch({
                type: player.hand.length > 0 ? "AUTO_PLAY_RANDOM_CARD" : "END_TURN",
                payload: {
                    playerId: player.id,
                },
            });

            return;
        }

        const timeoutId = window.setTimeout(() => {
            setTimeLeft((current) => current - 1);
        }, 1000);

        return () => window.clearTimeout(timeoutId);
    }, [isActive, timeLeft, player.id, player.hand.length, dispatch]);

    const progress = Math.max(0, Math.min(1, timeLeft / TURN_SECONDS));

    return (
        <span
            className="turn-timer-ring"
            style={{
                "--timer-progress": `${progress * 360}deg`,
            }}
            title={`${timeLeft}s left`}
        />
    );
}
