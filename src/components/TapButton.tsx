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
import { Fonts } from '../constants/typography';
import { Hairline } from '../constants/theme';
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
              {comboCount}× COMBO · {comboMult.toFixed(1)}×
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
              colors={['#F6F8FC', '#C7D0DE', '#94A2BC']}
              style={styles.button}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
            >
              <View style={styles.coinInner}>
                <Text style={styles.coinGlyph}>$</Text>
                <Text style={styles.tapLabel}>TAP</Text>
                <Text style={styles.levelLabel}>LV.{tapLevel}</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </TouchableWithoutFeedback>

        <View style={styles.upgradeRow}>
          <TouchableWithoutFeedback onPress={() => upgradeTap()}>
            <View style={[styles.upgradeButton, !canUpgrade && styles.upgradeButtonDisabled]}>
              <LinearGradient
                colors={canUpgrade ? ['#5B8DEF', '#3D6FD6'] : ['#1b2030', '#141925']}
                style={styles.upgradeGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.upgradeIconWrap}>
                  <Text style={styles.upgradeIcon}>↑</Text>
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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Hairline.soft,
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 9,
    marginBottom: 16,
    minWidth: 210,
  },
  statChip: { flex: 1, alignItems: 'center' },
  statChipLabel: {
    color: Colors.text.muted,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.8,
    marginBottom: 3,
  },
  statChipValue: {
    color: Colors.accent.platinum,
    fontFamily: Fonts.monoSemi,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  statChipDivider: {
    width: 1,
    height: 28,
    backgroundColor: Hairline.soft,
  },
  comboBadge: {
    backgroundColor: 'rgba(91,225,230,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(91,225,230,0.42)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
  },
  comboText: {
    color: Colors.accent.cyan,
    fontFamily: Fonts.displaySemi,
    fontSize: 13,
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
    backgroundColor: Colors.accent.blue,
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
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accent.silver,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  coinInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinGlyph: {
    fontFamily: Fonts.displayBlack,
    fontSize: 76,
    color: '#0E1422',
    lineHeight: 84,
    marginBottom: 2,
  },
  tapLabel: {
    color: '#0E1422',
    fontFamily: Fonts.displayBlack,
    fontSize: 20,
    letterSpacing: 6,
    marginLeft: 6,
  },
  levelLabel: {
    color: 'rgba(14,20,34,0.55)',
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 3,
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
    backgroundColor: 'rgba(205,167,101,0.12)',
  },
  wheelFabEmoji: { fontSize: 26 },
  freeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.accent.gold,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  freeBadgeText: { color: '#0E1422', fontSize: 8, fontFamily: Fonts.bodyExtra },
  upgradeRow: {
    marginTop: 24,
  },
  upgradeButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
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
  upgradeIcon: { color: '#fff', fontSize: 18, fontFamily: Fonts.displayBlack },
  upgradeTextBlock: { alignItems: 'flex-start' },
  upgradeText: {
    color: '#fff',
    fontFamily: Fonts.displaySemi,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  upgradeSubText: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: Fonts.bodySemi,
    fontSize: 11,
    marginTop: 2,
  },
  upgradeCostBadge: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  upgradeCostText: {
    color: '#fff',
    fontFamily: Fonts.monoSemi,
    fontSize: 14,
  },
});
