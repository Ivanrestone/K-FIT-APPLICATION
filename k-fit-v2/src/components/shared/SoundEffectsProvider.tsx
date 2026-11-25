import { createAudioPlayer } from "expo-audio";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type PropsWithChildren,
} from "react";

export type SoundEffect =
  | "tap"
  | "success"
  | "warning"
  | "scanIn"
  | "scanOut";

const SoundEffectsContext = createContext<
  ((effect: SoundEffect) => void) | null
>(null);

const VOLUMES: Record<SoundEffect, number> = {
  tap: 0.07,
  success: 0.16,
  warning: 0.14,
  scanIn: 0.2,
  scanOut: 0.2,
};

export function SoundEffectsProvider({ children }: PropsWithChildren) {
  const playersRef = useRef<Record<
    SoundEffect,
    ReturnType<typeof createAudioPlayer>
  > | null>(null);

  useEffect(() => {
    const players = {
      tap: createAudioPlayer(require("../../../assets/sounds/alert.wav")),
      success: createAudioPlayer(require("../../../assets/sounds/alert.wav")),
      warning: createAudioPlayer(require("../../../assets/sounds/warning.wav")),
      scanIn: createAudioPlayer(require("../../../assets/sounds/scan-in.wav")),
      scanOut: createAudioPlayer(require("../../../assets/sounds/scan-out.wav")),
    };

    players.tap.volume = VOLUMES.tap;
    players.success.volume = VOLUMES.success;
    players.warning.volume = VOLUMES.warning;
    players.scanIn.volume = VOLUMES.scanIn;
    players.scanOut.volume = VOLUMES.scanOut;
    playersRef.current = players;

    return () => {
      playersRef.current = null;
      Object.values(players).forEach((player) => player.release());
    };
  }, []);

  const playSound = useCallback(
    (effect: SoundEffect) => {
      const player = playersRef.current?.[effect];
      if (!player) return;

      void player
        .seekTo(0)
        .then(() => player.play())
        .catch((error: unknown) => {
          console.warn(`Unable to play ${effect} sound effect:`, error);
        });
    },
    [],
  );

  return (
    <SoundEffectsContext.Provider value={playSound}>
      {children}
    </SoundEffectsContext.Provider>
  );
}

export function useSoundEffects() {
  const playSound = useContext(SoundEffectsContext);
  if (!playSound) {
    throw new Error("useSoundEffects must be used within SoundEffectsProvider");
  }
  return playSound;
}
