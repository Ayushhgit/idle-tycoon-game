import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { WheelPrize } from '../types/game';
import { formatMoney } from '../utils/formatters';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.8;

const SEGMENTS = [
  { label: 'Small Cash',   emoji: '💵', color: '#FFD700', darkColor: '#CC9900' },
  { label: '5 Gems',       emoji: '💎', color: '#00E5FF', darkColor: '#0097A7' },
  { label: 'Big Cash',     emoji: '🤑', color: '#FFB300', darkColor: '#E65100' },
  { label: 'Try Again',    emoji: '💨', color: '#555',    darkColor: '#333' },
  { label: '50 Tokens',    emoji: '🎫', color: '#AB47BC', darkColor: '#6A1B9A' },
  { label: '15 Gems',      emoji: '💎', color: '#00BCD4', darkColor: '#006064' },
  { label: 'Tap Stash',    emoji: '💸', color: '#FF8C00', darkColor: '#E65100' },
  { label: '200 Tokens',   emoji: '🎫', color: '#CE93D8', darkColor: '#7B1FA2' },
  { label: 'Nothing',      emoji: '🌀', color: '#444',    darkColor: '#222' },
  { label: '2x Income!',   emoji: '⚡', color: '#FF1744', darkColor: '#B71C1C' },
];

const SEG_COUNT = SEGMENTS.length;
const SEG_ANGLE = 360 / SEG_COUNT;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function FortuneWheelModal({ visible, onClose }: Props) {
  const spinWheel = useGameStore((s) => s.spinWheel);
  const gems = useGameStore((s) => s.gems);
  const wheel = useGameStore((s) => s.wheel);

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelPrize | null>(null);
  const rotation = useSharedValue(0);

  const today = new Date().toDateString();
  const hasFree = wheel.lastFreeSpinDate !== today;
  const canGemSpin = gems >= 3;

  const doSpin = (useGems: boolean) => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);

    // Spin to a random segment, multiple full rotations for drama.
    const targetSegment = Math.floor(Math.random() * SEG_COUNT);
    const extraSpins = 4 + Math.floor(Math.random() * 3);
    const targetAngle = extraSpins * 360 + targetSegment * SEG_ANGLE + SEG_ANGLE / 2;

    rotation.value = withTiming(
      rotation.value + targetAngle,
      { duration: 3500, easing: Easing.out(Easing.cubic) },
      () => {
        runOnJS(onSpinDone)(useGems);
      }
    );
  };

  const onSpinDone = (useGems: boolean) => {
    const prize = spinWheel(useGems);
    setResult(prize);
    setSpinning(false);
  };

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <LinearGradient
            colors={['#1a0a2e', '#0d0020', '#0a0a1a']}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />

          <View style={styles.handle} />

          <Text style={styles.title}>🎡 FORTUNE WHEEL</Text>
          <Text style={styles.sub}>
            {hasFree ? '1 FREE SPIN available' : `Extra spins · 💎 3/spin`}
          </Text>

          <View style={styles.wheelContainer}>
            {/* Pointer */}
            <View style={styles.pointer} />

            <Animated.View style={[styles.wheel, wheelStyle]}>
              {SEGMENTS.map((seg, i) => {
                const angle = i * SEG_ANGLE;
                const mid = angle + SEG_ANGLE / 2;
                const rad = (mid * Math.PI) / 180;
                const r = WHEEL_SIZE / 2 - 36;
                const tx = Math.cos(rad - Math.PI / 2) * r;
                const ty = Math.sin(rad - Math.PI / 2) * r;

                return (
                  <View key={i} style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                    {/* Segment arc approximate via rotated rectangles */}
                    <View
                      style={[
                        styles.segment,
                        {
                          backgroundColor: i % 2 === 0 ? seg.color + 'CC' : seg.darkColor + 'CC',
                          transform: [
                            { rotate: `${angle}deg` },
                          ],
                        },
                      ]}
                    />
                    {/* Label */}
                    <View
                      style={[
                        styles.segLabel,
                        { transform: [{ translateX: tx }, { translateY: ty }] },
                      ]}
                    >
                      <Text style={styles.segEmoji}>{seg.emoji}</Text>
                    </View>
                  </View>
                );
              })}

              {/* Center hub */}
              <View style={styles.hub}>
                <LinearGradient colors={['#FFD700', '#FF8C00']} style={styles.hubGrad}>
                  <Text style={styles.hubText}>SPIN</Text>
                </LinearGradient>
              </View>
            </Animated.View>
          </View>

          {/* Result banner */}
          {result && (
            <View style={[styles.resultBanner, { backgroundColor: result.color + '22', borderColor: result.color + '55' }]}>
              <Text style={styles.resultEmoji}>{result.emoji}</Text>
              <View style={styles.resultText}>
                <Text style={[styles.resultLabel, { color: result.color }]}>{result.label}</Text>
                {result.type === 'money' && result.amount > 0 && (
                  <Text style={styles.resultAmount}>{formatMoney(result.amount)}</Text>
                )}
                {result.type === 'gems' && (
                  <Text style={styles.resultAmount}>+{result.amount} 💎</Text>
                )}
                {result.type === 'tokens' && (
                  <Text style={styles.resultAmount}>+{result.amount} 🎫</Text>
                )}
              </View>
            </View>
          )}

          {/* Spin buttons */}
          <View style={styles.btnRow}>
            {hasFree ? (
              <TouchableOpacity
                onPress={() => doSpin(false)}
                disabled={spinning}
                style={[styles.spinBtn, spinning && styles.btnDisabled]}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#FFD700', '#FF8C00']} style={styles.spinGrad}>
                  <Text style={styles.spinBtnText}>🎡 FREE SPIN</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => doSpin(true)}
                  disabled={spinning || !canGemSpin}
                  style={[styles.spinBtn, (!canGemSpin || spinning) && styles.btnDisabled]}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#2979FF', '#1565C0']} style={styles.spinGrad}>
                    <Text style={styles.spinBtnText}>💎 3 Gems / Spin</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Prizes list */}
          <ScrollView style={styles.prizeList} showsVerticalScrollIndicator={false}>
            <Text style={styles.prizeListTitle}>PRIZES</Text>
            {SEGMENTS.map((seg, i) => (
              <View key={i} style={styles.prizeRow}>
                <View style={[styles.prizeColorDot, { backgroundColor: seg.color }]} />
                <Text style={styles.prizeEmoji}>{seg.emoji}</Text>
                <Text style={styles.prizeName}>{seg.label}</Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,215,0,0.2)',
    paddingBottom: 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 14,
  },
  title: {
    color: Colors.accent.gold,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  sub: {
    color: Colors.text.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    fontWeight: '700',
  },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: WHEEL_SIZE + 20,
    marginBottom: 8,
  },
  pointer: {
    position: 'absolute',
    top: -2,
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.accent.gold,
    zIndex: 10,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    backgroundColor: '#1a0a2e',
    borderWidth: 3,
    borderColor: Colors.accent.gold + '80',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  segment: {
    position: 'absolute',
    width: 2,
    height: WHEEL_SIZE / 2,
    top: 0,
    left: WHEEL_SIZE / 2 - 1,
    transformOrigin: 'bottom',
  },
  segLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segEmoji: { fontSize: 20 },
  hub: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#0a0a1a',
    zIndex: 20,
  },
  hubGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hubText: { color: '#0a0a1a', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  resultEmoji: { fontSize: 32 },
  resultText: {},
  resultLabel: { fontWeight: '900', fontSize: 17 },
  resultAmount: { color: Colors.text.secondary, fontWeight: '700', fontSize: 14, marginTop: 2 },
  btnRow: { paddingHorizontal: 16, marginBottom: 10 },
  spinBtn: { borderRadius: 16, overflow: 'hidden' },
  btnDisabled: { opacity: 0.45 },
  spinGrad: { paddingVertical: 15, alignItems: 'center' },
  spinBtnText: { color: '#0a0a1a', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  prizeList: { maxHeight: 140, paddingHorizontal: 16 },
  prizeListTitle: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  prizeColorDot: { width: 8, height: 8, borderRadius: 4 },
  prizeEmoji: { fontSize: 14 },
  prizeName: { color: Colors.text.secondary, fontSize: 12, fontWeight: '600' },
  closeBtn: {
    margin: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { color: Colors.text.secondary, fontWeight: '800', fontSize: 15 },
});
