import React, { useEffect, useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { formatMoney } from '../utils/formatters';
import { Colors } from '../constants/colors';

interface Props {
  value: number;
  x: number;
  y: number;
  isCritical: boolean;
  onDone: () => void;
}

export function FloatingNumber({ value, x, y, isCritical, onDone }: Props) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(isCritical ? 0.5 : 0.8);

  const done = useCallback(() => {
    onDone();
  }, [onDone]);

  useEffect(() => {
    scale.value = withSpring(isCritical ? 1.4 : 1.1, { damping: 8, stiffness: 300 });
    translateY.value = withTiming(-100, { duration: 1200, easing: Easing.out(Easing.quad) });
    opacity.value = withTiming(0, { duration: 1200, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished) runOnJS(done)();
    });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const textColor = isCritical ? '#FF6D00' : Colors.accent.gold;
  const fontSize = isCritical ? 28 : 20;

  return (
    <Animated.View
      style={[
        styles.container,
        animStyle,
        { left: x - 40, top: y - 40 },
      ]}
      pointerEvents="none"
    >
      {isCritical && <Text style={styles.critLabel}>CRITICAL!</Text>}
      <Text style={[styles.text, { color: textColor, fontSize, fontWeight: isCritical ? '900' : '800' }]}>
        +{formatMoney(value)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 999,
  },
  text: {
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  critLabel: {
    color: '#FF6D00',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
