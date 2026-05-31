import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { FloatingNumber } from './FloatingNumber';
import { FortuneWheelModal } from './FortuneWheel';
import { useHaptics } from '../hooks/useHaptics';
import { Colors } from '../constants/colors';
import { GameConfig } from '../constants/gameConfig';
import { formatMoney } from '../utils/formatters';
import { calcComboMultiplier, calcTapUpgradeCost } from '../utils/calculations';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = width * 0.62;

interface FloatItem {
  id: string;
  value: number;
  x: number;
  y: number;
  isCritical: boolean;
}

export function TapButton() {
  const tap = useGameStore((s) => s.tap);
  const upgradeTap = useGameStore((s) => s.upgradeTap);
  const tapLevel = useGameStore((s) => s.tapLevel);
  const tapPower = useGameStore((s) => s.tapPower);
  const comboCount = useGameStore((s) => s.comboCount);
  const money = useGameStore((s) => s.money);

  const wheel = useGameStore((s) => s.wheel);
  const { tapHaptic, criticalHaptic } = useHaptics();
  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [showWheel, setShowWheel] = useState(false);

  const today = new Date().toDateString();
  const hasFreeSpinToday = wheel.lastFreeSpinDate !== today;
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const rotation = useSharedValue(0);
  const idRef = useRef(0);

  const upgradeCost = calcTapUpgradeCost(tapLevel);
  const comboMult = calcComboMultiplier(comboCount);
  const canUpgrade = money >= upgradeCost;

  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const handleTap = useCallback(
    (evt: any) => {
      const { locationX, locationY } = evt.nativeEvent;
      const { value, isCritical } = tap(locationX, locationY);

      if (isCritical) {
        criticalHaptic();
        scale.value = withSequence(
          withSpring(0.88, { damping: 6, stiffness: 400 }),
          withSpring(1.08, { damping: 8, stiffness: 300 }),
          withSpring(1, { damping: 10, stiffness: 200 })
        );
      } else {
        tapHaptic();
        scale.value = withSequence(
          withSpring(0.92, { damping: 8, stiffness: 400 }),
          withSpring(1, { damping: 10, stiffness: 200 })
        );
      }

      const id = `float_${idRef.current++}`;
      const jitterX = locationX + (Math.random() - 0.5) * 60;
      const jitterY = locationY + (Math.random() - 0.5) * 40;
      setFloats((prev) => [
        ...prev.slice(-8),
        { id, value, x: jitterX, y: jitterY, isCritical },
      ]);
    },
    [tap, tapHaptic, criticalHaptic]
  );

  const removeFloat = useCallback((id: string) => {
    setFloats((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const ringAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.wrapper}>
      <FortuneWheelModal visible={showWheel} onClose={() => setShowWheel(false)} />

      {/* Fortune wheel FAB */}
      <TouchableOpacity
        style={[styles.wheelFab, hasFreeSpinToday && styles.wheelFabFree]}
        onPress={() => setShowWheel(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.wheelFabEmoji}>🎡</Text>
        {hasFreeSpinToday && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>FREE</Text>
          </View>
        )}
      </TouchableOpacity>

      {floats.map((f) => (
        <FloatingNumber
          key={f.id}
          value={f.value}
          x={f.x}
          y={f.y}
          isCritical={f.isCritical}
          onDone={() => removeFloat(f.id)}
        />
      ))}

      <View style={styles.centerContent}>
        <View style={styles.statStrip}>
          <View style={styles.statChip}>
            <Text style={styles.statChipLabel}>PER TAP</Text>
            <Text style={styles.statChipValue}>{formatMoney(tapPower)}</Text>
          </View>
          <View style={styles.statChipDivider} />
          <View style={styles.statChip}>
            <Text style={styles.statChipLabel}>LEVEL</Text>
            <Text style={[styles.statChipValue, { color: Colors.accent.blueLight }]}>
              {tapLevel}
            </Text>
          </View>
        </View>

        {comboCount > 1 && (
          <View style={styles.comboBadge}>
            <Text style={styles.comboText}>
              🔥 {comboCount}x COMBO · {comboMult.toFixed(1)}x
            </Text>
          </View>
        )}

        <TouchableWithoutFeedback onPress={handleTap}>
          <Animated.View style={[styles.buttonContainer, buttonAnimStyle]}>
            <Animated.View style={[styles.outerGlow, glowAnimStyle]} />
            <Animated.View style={[styles.rotatingRing, ringAnimStyle]}>
              {Array.from({ length: 12 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.ringDot,
                    {
                      transform: [
                        { rotate: `${i * 30}deg` },
                        { translateY: -BUTTON_SIZE / 2 - 12 },
                      ],
                    },
                  ]}
                />
              ))}
            </Animated.View>

            <LinearGradient
              colors={['#FFE44D', '#FFD700', '#FF8C00']}
              style={styles.button}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
            >
              <Text style={styles.coinEmoji}>💰</Text>
              <Text style={styles.tapLabel}>TAP</Text>
              <Text style={styles.levelLabel}>Lv.{tapLevel}</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableWithoutFeedback>

        <View style={styles.upgradeRow}>
          <TouchableWithoutFeedback onPress={() => upgradeTap()}>
            <View style={[styles.upgradeButton, !canUpgrade && styles.upgradeButtonDisabled]}>
              <LinearGradient
                colors={canUpgrade ? ['#2979FF', '#1565C0'] : ['#2a2a38', '#1d1d28']}
                style={styles.upgradeGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.upgradeIconWrap}>
                  <Text style={styles.upgradeIcon}>⬆</Text>
                </View>
                <View style={styles.upgradeTextBlock}>
                  <Text style={styles.upgradeText}>UPGRADE TAP</Text>
                  <Text style={styles.upgradeSubText}>
                    Power → Lv.{tapLevel + 1}
                  </Text>
                </View>
                <View style={styles.upgradeCostBadge}>
                  <Text style={styles.upgradeCostText}>{formatMoney(upgradeCost)}</Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 8,
    marginBottom: 16,
    minWidth: 200,
  },
  statChip: { flex: 1, alignItems: 'center' },
  statChipLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  statChipValue: {
    color: Colors.accent.gold,
    fontSize: 17,
    fontWeight: '900',
  },
  statChipDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  comboBadge: {
    backgroundColor: 'rgba(255,109,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,109,0,0.5)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 12,
  },
  comboText: {
    color: '#FF6D00',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  buttonContainer: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
    width: BUTTON_SIZE + 40,
    height: BUTTON_SIZE + 40,
    borderRadius: (BUTTON_SIZE + 40) / 2,
    backgroundColor: Colors.accent.gold,
  },
  rotatingRing: {
    position: 'absolute',
    width: BUTTON_SIZE + 30,
    height: BUTTON_SIZE + 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.gold,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  coinEmoji: {
    fontSize: 72,
    marginBottom: 4,
  },
  tapLabel: {
    color: '#0a0a1a',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  },
  levelLabel: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  wheelFab: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelFabFree: {
    borderColor: Colors.accent.gold + '88',
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  wheelFabEmoji: { fontSize: 26 },
  freeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.accent.red,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  freeBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  upgradeRow: {
    marginTop: 24,
  },
  upgradeButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#2979FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  upgradeButtonDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
  },
  upgradeGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    gap: 12,
  },
  upgradeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeIcon: { color: '#fff', fontSize: 18, fontWeight: '900' },
  upgradeTextBlock: { alignItems: 'flex-start' },
  upgradeText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  upgradeSubText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 1,
  },
  upgradeCostBadge: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  upgradeCostText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
});
