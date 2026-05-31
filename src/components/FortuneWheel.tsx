import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { WheelPrize } from '../types/game';
import { WHEEL_SEGMENTS } from '../constants/wheel';
import { formatMoney } from '../utils/formatters';
import { useHaptics } from '../hooks/useHaptics';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(width * 0.82, 340);
const R = WHEEL_SIZE / 2;
const SEG_COUNT = WHEEL_SEGMENTS.length;
const SEG_ANGLE = 360 / SEG_COUNT;

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: R + radius * Math.sin(rad), y: R - radius * Math.cos(rad) };
}

function wedgePath(startAngle: number, endAngle: number) {
  const start = polar(startAngle, R);
  const end = polar(endAngle, R);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${R} ${R} L ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function FortuneWheelModal({ visible, onClose }: Props) {
  const spinWheel = useGameStore((s) => s.spinWheel);
  const gems = useGameStore((s) => s.gems);
  const wheel = useGameStore((s) => s.wheel);
  const { criticalHaptic, errorHaptic } = useHaptics();

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelPrize | null>(null);
  const rotation = useSharedValue(0);
  const pendingPrize = useRef<WheelPrize | null>(null);

  const today = new Date().toDateString();
  const hasFree = wheel.lastFreeSpinDate !== today;
  const canGemSpin = gems >= 3;

  const finish = () => {
    const p = pendingPrize.current;
    setResult(p);
    setSpinning(false);
    if (p && p.type !== 'nothing') criticalHaptic();
    else errorHaptic();
  };

  const doSpin = (useGems: boolean) => {
    if (spinning) return;

    // Decide the prize first so the wheel can land exactly on it.
    const prize = spinWheel(useGems);
    if (!prize) return;

    pendingPrize.current = prize;
    setResult(null);
    setSpinning(true);

    // Rotation that puts segment `index` under the top pointer.
    const mid = prize.index * SEG_ANGLE + SEG_ANGLE / 2;
    const targetMod = ((360 - mid) % 360 + 360) % 360;
    const currentMod = ((rotation.value % 360) + 360) % 360;
    let delta = targetMod - currentMod;
    if (delta < 0) delta += 360;
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const total = extraSpins * 360 + delta;

    rotation.value = withTiming(
      rotation.value + total,
      { duration: 3800, easing: Easing.out(Easing.cubic) },
      (done) => {
        if (done) runOnJS(finish)();
      }
    );
  };

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <LinearGradient
            colors={['#1c0a36', '#0d0020', '#08081a']}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />

          <View style={styles.handle} />
          <Text style={styles.title}>🎡 FORTUNE WHEEL</Text>
          <Text style={styles.sub}>
            {hasFree ? '✨ 1 FREE SPIN available today' : 'Extra spins · 💎 3 each'}
          </Text>

          <View style={styles.wheelContainer}>
            <View style={styles.pointer} />
            <View style={styles.glowRing} />

            <Animated.View style={[styles.wheelWrap, wheelStyle]}>
              <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                {WHEEL_SEGMENTS.map((seg, i) => (
                  <Path
                    key={i}
                    d={wedgePath(i * SEG_ANGLE, (i + 1) * SEG_ANGLE)}
                    fill={seg.color}
                    stroke="rgba(0,0,0,0.25)"
                    strokeWidth={1.5}
                  />
                ))}
                <Circle cx={R} cy={R} r={R - 1} fill="none" stroke="rgba(255,215,0,0.5)" strokeWidth={2} />
              </Svg>

              {/* Emoji labels overlaid at each segment mid-angle */}
              {WHEEL_SEGMENTS.map((seg, i) => {
                const mid = i * SEG_ANGLE + SEG_ANGLE / 2;
                const p = polar(mid, R * 0.66);
                return (
                  <View
                    key={`l${i}`}
                    style={[styles.labelBox, { left: p.x - 18, top: p.y - 18, transform: [{ rotate: `${mid}deg` }] }]}
                  >
                    <Text style={styles.labelEmoji}>{seg.emoji}</Text>
                  </View>
                );
              })}
            </Animated.View>

            {/* Center hub (static) */}
            <View style={styles.hub}>
              <LinearGradient colors={['#FFE44D', '#FF8C00']} style={styles.hubGrad}>
                <Text style={styles.hubText}>{spinning ? '···' : 'SPIN'}</Text>
              </LinearGradient>
            </View>
          </View>

          {result && !spinning && (
            <View style={[styles.resultBanner, { backgroundColor: result.color + '26', borderColor: result.color + '66' }]}>
              <Text style={styles.resultEmoji}>{result.emoji}</Text>
              <View>
                <Text style={[styles.resultLabel, { color: result.color }]}>
                  {result.type === 'nothing' ? 'No luck — spin again!' : 'You won ' + result.label + '!'}
                </Text>
                {result.type === 'money' && (
                  <Text style={styles.resultAmount}>+{formatMoney(result.amount)}</Text>
                )}
                {result.type === 'gems' && <Text style={styles.resultAmount}>+{result.amount} 💎</Text>}
                {result.type === 'tokens' && <Text style={styles.resultAmount}>+{result.amount} 🎫</Text>}
                {result.type === 'multiplier' && <Text style={styles.resultAmount}>2x income for 60s ⚡</Text>}
              </View>
            </View>
          )}

          <View style={styles.btnRow}>
            {hasFree ? (
              <TouchableOpacity
                onPress={() => doSpin(false)}
                disabled={spinning}
                style={[styles.spinBtn, spinning && styles.btnDisabled]}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#FFD700', '#FF8C00']} style={styles.spinGrad}>
                  <Text style={styles.spinBtnText}>{spinning ? 'SPINNING…' : '🎡 FREE SPIN'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => doSpin(true)}
                disabled={spinning || !canGemSpin}
                style={[styles.spinBtn, (!canGemSpin || spinning) && styles.btnDisabled]}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#2979FF', '#1565C0']} style={styles.spinGrad}>
                  <Text style={[styles.spinBtnText, { color: '#fff' }]}>
                    {spinning ? 'SPINNING…' : '💎 SPIN (3 Gems)'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={spinning}>
            <Text style={styles.closeBtnText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,215,0,0.22)',
    paddingBottom: 8,
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
    marginBottom: 18,
    fontWeight: '700',
  },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: WHEEL_SIZE + 24,
    marginBottom: 10,
  },
  pointer: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.accent.gold,
    zIndex: 30,
  },
  glowRing: {
    position: 'absolute',
    width: WHEEL_SIZE + 18,
    height: WHEEL_SIZE + 18,
    borderRadius: (WHEEL_SIZE + 18) / 2,
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  wheelWrap: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  labelBox: {
    position: 'absolute',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelEmoji: { fontSize: 22 },
  hub: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#0a0a1a',
    zIndex: 25,
  },
  hubGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hubText: { color: '#0a0a1a', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
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
  resultEmoji: { fontSize: 34 },
  resultLabel: { fontWeight: '900', fontSize: 16 },
  resultAmount: { color: Colors.text.secondary, fontWeight: '800', fontSize: 14, marginTop: 2 },
  btnRow: { paddingHorizontal: 16, marginBottom: 10 },
  spinBtn: { borderRadius: 16, overflow: 'hidden' },
  btnDisabled: { opacity: 0.45 },
  spinGrad: { paddingVertical: 16, alignItems: 'center' },
  spinBtnText: { color: '#0a0a1a', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  closeBtn: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { color: Colors.text.secondary, fontWeight: '800', fontSize: 15 },
});
