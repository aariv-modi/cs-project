import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const GAME_DURATION = 60;
const NUM_HOLES = 9;
const SPAWN_INTERVAL_MS = 800;
const POPUP_LIFETIME_MS = 1200;
const DISTRACTION_CHANCE = 0.25;

const MOLE_IMAGES = [
  require('@/assets/images/andrew1.png'),
  require('@/assets/images/andrew2.png'),
  require('@/assets/images/andrew3.png'),
  require('@/assets/images/andrew4.png'),
  require('@/assets/images/andrew5.png'),
];

const DISTRACTION_IMAGES = [
  require('@/assets/images/praneel1.png'),
  require('@/assets/images/praneel2.png'),
  require('@/assets/images/praneel3.png'),
  require('@/assets/images/praneel4.png'),
  require('@/assets/images/praneel5.png'),
];

type PopupKind = 'mole' | 'distraction';

type Popup = {
  id: number;
  kind: PopupKind;
  imageIndex: number;
  // tracks whether the user already tapped it (so the despawn timer won't
  // also penalize the player for "missing" a mole they actually hit).
  resolved: boolean;
};

export default function WhackAMoleScreen() {
  const [holes, setHoles] = useState<(Popup | null)[]>(() =>
    Array(NUM_HOLES).fill(null)
  );
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);

  const nextIdRef = useRef(1);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const despawnTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = useCallback(() => {
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    despawnTimeoutsRef.current.forEach(clearTimeout);
    despawnTimeoutsRef.current = [];
  }, []);

  useEffect(() => clearAllTimers, [clearAllTimers]);

  const endGame = useCallback(() => {
    clearAllTimers();
    setIsPlaying(false);
    setHoles(Array(NUM_HOLES).fill(null));
  }, [clearAllTimers]);

  useEffect(() => {
    if (!isPlaying && score > highScore) {
      setHighScore(score);
    }
  }, [isPlaying, score, highScore]);

  const spawnPopup = useCallback(() => {
    setHoles((current) => {
      const emptyIndices = current
        .map((h, i) => (h === null ? i : -1))
        .filter((i) => i !== -1);
      if (emptyIndices.length === 0) return current;

      const idx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      const kind: PopupKind =
        Math.random() < DISTRACTION_CHANCE ? 'distraction' : 'mole';
      const imageIndex = Math.floor(Math.random() * 5);
      const popup: Popup = {
        id: nextIdRef.current++,
        kind,
        imageIndex,
        resolved: false,
      };

      const next = current.slice();
      next[idx] = popup;

      const timeout = setTimeout(() => {
        setHoles((cur) => {
          const slot = cur[idx];
          if (!slot || slot.id !== popup.id) return cur;
          // If it was an unresolved mole, the player missed it: -1.
          if (!slot.resolved && slot.kind === 'mole') {
            setScore((s) => s - 1);
          }
          const updated = cur.slice();
          updated[idx] = null;
          return updated;
        });
      }, POPUP_LIFETIME_MS);
      despawnTimeoutsRef.current.push(timeout);

      return next;
    });
  }, []);

  const startGame = useCallback(() => {
    clearAllTimers();
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setHoles(Array(NUM_HOLES).fill(null));
    setIsPlaying(true);

    spawnTimerRef.current = setInterval(spawnPopup, SPAWN_INTERVAL_MS);
    countdownTimerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [clearAllTimers, endGame, spawnPopup]);

  const handleHoleTap = useCallback(
    (index: number) => {
      if (!isPlaying) return;
      setHoles((cur) => {
        const slot = cur[index];
        if (!slot || slot.resolved) return cur;
        if (slot.kind === 'mole') {
          setScore((s) => s + 1);
        } else {
          setScore((s) => s - 2);
        }
        const updated = cur.slice();
        updated[index] = null;
        return updated;
      });
    },
    [isPlaying]
  );

  return (
    <ImageBackground
      source={require('@/assets/images/bg.png')}
      style={styles.bg}
      resizeMode="cover">
      <View style={styles.hud}>
        <Text style={styles.hudText}>Score: {score}</Text>
        <Text style={styles.hudText}>Time: {timeLeft}</Text>
        <Text style={styles.hudText}>Best: {highScore}</Text>
      </View>

      <View style={styles.grid}>
        {holes.map((slot, i) => (
          <Pressable
            key={i}
            style={styles.hole}
            onPress={() => handleHoleTap(i)}>
            {slot && (
              <Image
                source={
                  (slot.kind === 'mole' ? MOLE_IMAGES : DISTRACTION_IMAGES)[
                    slot.imageIndex
                  ]
                }
                style={styles.popup}
                resizeMode="contain"
              />
            )}
          </Pressable>
        ))}
      </View>

      {!isPlaying && (
        <View style={styles.overlay} pointerEvents="box-none">
          <Pressable style={styles.startButton} onPress={startGame}>
            <Text style={styles.startButtonText}>
              {timeLeft === 0 ? 'Play Again' : 'Start'}
            </Text>
          </Pressable>
          {timeLeft === 0 && (
            <Text style={styles.gameOverText}>Final Score: {score}</Text>
          )}
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: 'center',
  },
  hud: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  hudText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
    width: '90%',
    aspectRatio: 1,
    maxWidth: 480,
  },
  hole: {
    width: '33.333%',
    height: '33.333%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popup: {
    width: '110%',
    height: '110%',
    transform: [{ translateY: '-25%' }],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'white',
  },
  startButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  gameOverText: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
