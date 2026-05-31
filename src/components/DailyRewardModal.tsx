import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { Colors } from '../constants/colors';
import { GameConfig } from '../constants/gameConfig';
import { useHaptics } from '../hooks/useHaptics';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function DailyRewardModal({ visible, onClose }: Props) {
  const claimDailyReward = useGameStore((s) => s.claimDailyReward);
  const dailyReward = useGameStore((s) => s.dailyReward);
  const { purchaseHaptic } = useHaptics();

  const scale = useSharedValue(0.7);
  const rotation = useSharedValue(0);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1
      );
      rotation.value = withRepeat(
        withTiming(360, { duration: 6000, easing: Easing.linear }),
        -1
      );
    } else {
      scale.value = 0.7;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const streak = dailyReward.currentStreak;
  const baseGems = GameConfig.dailyReward.baseGems;
  const bonusGems =
    Math.min(streak, GameConfig.dailyReward.maxStreakBonus) *
    GameConfig.dailyReward.streakBonusGems;
  const totalGems = baseGems + bonusGems;

  const handleClaim = () => {
    purchaseHaptic();
    claimDailyReward();
    onClose();
  };

  const DAY_REWARDS = Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    gems: GameConfig.dailyReward.baseGems + i * GameConfig.dailyReward.streakBonusGems,
    claimed: i < streak,
    isToday: i === streak,
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, containerStyle]}>
          <LinearGradient
            colors={['#1a0533', '#0a0a1a']}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />

          <Animated.View style={[styles.glowRing, glowStyle]} />
          <Animated.View style={[styles.spinRing, spinStyle]}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.spinDot,
                  { transform: [{ rotate: `${i * 45}deg` }, { translateY: -80 }] },
                ]}
              />
            ))}
          </Animated.View>

          <Text style={styles.titleEmoji}>🎁</Text>
          <Text style={styles.title}>DAILY REWARD</Text>
          <Text style={styles.streakText}>
            {streak === 0 ? 'Day 1 reward!' : `${streak}-day streak! 🔥`}
          </Text>

          <View style={styles.daysRow}>
            {DAY_REWARDS.map((d) => (
              <View
                key={d.day}
                style={[
                  styles.dayBox,
                  d.claimed && styles.dayBoxClaimed,
                  d.isToday && styles.dayBoxToday,
                ]}
              >
                <Text style={styles.dayNum}>D{d.day}</Text>
                <Text style={styles.dayEmoji}>💎</Text>
                <Text style={styles.dayGems}>{d.gems}</Text>
              </View>
            ))}
          </View>

          <View style={styles.rewardPreview}>
            <Text style={styles.rewardLabel}>TODAY'S REWARD</Text>
            <Text style={styles.gemsBig}>💎 {totalGems} Gems</Text>
          </View>

          <TouchableOpacity onPress={handleClaim} style={styles.claimButton}>
            <LinearGradient
              colors={[Colors.accent.purple, '#7B1FA2']}
              style={styles.claimGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.claimText}>CLAIM REWARD</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    width: width - 48,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,0,249,0.3)',
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.accent.purple,
    top: -60,
  },
  spinRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    top: -30,
  },
  spinDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.purple,
  },
  titleEmoji: { fontSize: 56, marginTop: 10, marginBottom: 8 },
  title: {
    color: Colors.text.primary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  streakText: {
    color: Colors.accent.purple,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 20,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dayBox: {
    width: 42,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dayBoxClaimed: {
    backgroundColor: 'rgba(212,0,249,0.15)',
    borderColor: Colors.accent.purple,
    opacity: 0.6,
  },
  dayBoxToday: {
    backgroundColor: 'rgba(212,0,249,0.25)',
    borderColor: Colors.accent.purple,
    borderWidth: 2,
  },
  dayNum: { color: Colors.text.muted, fontSize: 9, fontWeight: '700' },
  dayEmoji: { fontSize: 16, marginVertical: 2 },
  dayGems: { color: Colors.accent.cyan, fontWeight: '900', fontSize: 10 },
  rewardPreview: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginBottom: 20,
    width: '100%',
  },
  rewardLabel: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  gemsBig: { color: Colors.accent.cyan, fontSize: 26, fontWeight: '900' },
  claimButton: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  claimGrad: { paddingVertical: 16, alignItems: 'center' },
  claimText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  skipButton: { paddingVertical: 8 },
  skipText: { color: Colors.text.muted, fontSize: 13 },
});
