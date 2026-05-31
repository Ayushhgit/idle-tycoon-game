import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { formatMoney } from '../utils/formatters';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';

interface Props {
  visible: boolean;
  amount: number;
  onClaim: () => void;
}

const { width } = Dimensions.get('window');

export function OfflineEarningsModal({ visible, amount, onClaim }: Props) {
  const scale = useSharedValue(0.7);
  const float = useSharedValue(0);
  const { purchaseHaptic } = useHaptics();

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
      float.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 1200 }),
          withTiming(0, { duration: 1200 })
        ),
        -1
      );
    } else {
      scale.value = 0.7;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  const handleClaim = () => {
    purchaseHaptic();
    onClaim();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, containerStyle]}>
          <LinearGradient
            colors={['#1a1a0a', '#0a0a1a']}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />
          <Animated.View style={floatStyle}>
            <Text style={styles.emoji}>💤</Text>
          </Animated.View>
          <Text style={styles.title}>WELCOME BACK!</Text>
          <Text style={styles.subtitle}>While you were away, your empire kept working</Text>

          <View style={styles.amountBox}>
            <LinearGradient
              colors={['rgba(255,215,0,0.15)', 'rgba(255,140,0,0.1)']}
              style={styles.amountGrad}
            >
              <Text style={styles.amountLabel}>OFFLINE EARNINGS</Text>
              <Text style={styles.amount}>{formatMoney(amount)}</Text>
              <Text style={styles.efficiency}>50% idle efficiency applied</Text>
            </LinearGradient>
          </View>

          <TouchableOpacity onPress={handleClaim} style={styles.claimBtn}>
            <LinearGradient
              colors={[Colors.accent.gold, Colors.accent.goldDark]}
              style={styles.claimGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.claimText}>COLLECT {formatMoney(amount)}</Text>
            </LinearGradient>
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
  card: {
    width: width - 48,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: {
    color: Colors.text.primary,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.text.muted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  amountBox: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  amountGrad: { padding: 20, alignItems: 'center' },
  amountLabel: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  amount: {
    color: Colors.accent.gold,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  efficiency: { color: Colors.text.muted, fontSize: 11, marginTop: 6 },
  claimBtn: { width: '100%', borderRadius: 18, overflow: 'hidden' },
  claimGrad: { paddingVertical: 18, alignItems: 'center' },
  claimText: { color: '#000', fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },
});
