import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const COLORS = ['#E4E9F2', '#CDA765', '#3DDC97', '#5B8DEF', '#9D8CFF', '#5BE1E6', '#AEB7C9'];

interface Props {
  /** Increment this number to fire a burst. */
  trigger: number;
  count?: number;
  originY?: number;
}

interface Particle {
  angle: number;
  distance: number;
  color: string;
  size: number;
  rotateDir: number;
  isSquare: boolean;
}

/** Lightweight one-shot confetti burst. Fires whenever `trigger` changes. */
export function Confetti({ trigger, count = 28, originY = height * 0.32 }: Props) {
  const progress = useSharedValue(0);

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }).map(() => {
        // Shoot mostly upward/outward (-160°..-20°), then gravity pulls down.
        const deg = -20 - Math.random() * 140;
        return {
          angle: (deg * Math.PI) / 180,
          distance: 120 + Math.random() * 200,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 7 + Math.random() * 7,
          rotateDir: Math.random() > 0.5 ? 1 : -1,
          isSquare: Math.random() > 0.4,
        };
      }),
    [count]
  );

  useEffect(() => {
    if (trigger === 0) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 1900, easing: Easing.out(Easing.quad) });
  }, [trigger]);

  if (trigger === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <ConfettiPiece key={i} particle={p} progress={progress} originY={originY} />
      ))}
    </View>
  );
}

function ConfettiPiece({
  particle,
  progress,
  originY,
}: {
  particle: Particle;
  progress: SharedValue<number>;
  originY: number;
}) {
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const dx = Math.cos(particle.angle) * particle.distance * t;
    // gravity: rise then fall
    const dy = Math.sin(particle.angle) * particle.distance * t + 320 * t * t;
    const opacity = t < 0.8 ? 1 : interpolate(t, [0.8, 1], [1, 0]);
    return {
      opacity,
      transform: [
        { translateX: dx },
        { translateY: dy },
        { rotate: `${t * 720 * particle.rotateDir}deg` },
        { scale: interpolate(t, [0, 0.1, 1], [0, 1, 0.85]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: width / 2 - particle.size / 2,
          top: originY,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          borderRadius: particle.isSquare ? 2 : particle.size / 2,
        },
        style,
      ]}
    />
  );
}
