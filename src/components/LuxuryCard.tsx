import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { LuxuryItem } from '../types/game';
import { formatMoney } from '../utils/formatters';
import { Colors } from '../constants/colors';

interface Props {
  item: LuxuryItem;
  money: number;
  onBuy: () => void;
}

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  car: ['#EF5350', '#B71C1C'],
  watch: ['#FFD54F', '#FF8F00'],
  yacht: ['#42A5F5', '#0D47A1'],
  jet: ['#78909C', '#263238'],
  mansion: ['#AB47BC', '#4A148C'],
};

export const LuxuryCard = memo(function LuxuryCard({ item, money, onBuy }: Props) {
  const scale = useSharedValue(1);
  const shimmer = useSharedValue(0);
  const gradColors = CATEGORY_GRADIENTS[item.category] ?? ['#aaa', '#555'];
  const canAfford = money >= item.cost;

  useEffect(() => {
    if (!item.owned) return;
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      false
    );
    return () => {
      shimmer.value = 0;
    };
  }, [item.owned]);

  const handlePress = () => {
    if (!canAfford || item.owned) return;
    scale.value = withSequence(
      withSpring(0.9, { damping: 6, stiffness: 400 }),
      withSpring(1.05, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    onBuy();
  };

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: item.owned ? 1 : canAfford ? 1 : 0.65,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value * 0.2,
  }));

  return (
    <Animated.View style={[styles.wrapper, cardAnimStyle]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress} disabled={item.owned}>
        <View style={styles.card}>
          <LinearGradient
            colors={gradColors}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.22)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            {item.owned && (
              <Animated.View style={[StyleSheet.absoluteFill, styles.shimmerOverlay, shimmerStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            )}
            <Text style={styles.emoji}>{item.emoji}</Text>
            {item.owned && (
              <View style={styles.ownedBadge}>
                <Text style={styles.ownedText}>OWNED</Text>
              </View>
            )}
          </LinearGradient>

          <View style={styles.body}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.description}>{item.description}</Text>

            <View style={styles.bonusRow}>
              {item.incomeMultiplier > 1 && (
                <View style={styles.bonus}>
                  <Text style={styles.bonusLabel}>Income</Text>
                  <Text style={[styles.bonusValue, { color: Colors.accent.green }]}>
                    x{item.incomeMultiplier.toFixed(2)}
                  </Text>
                </View>
              )}
              {item.tapMultiplier > 1 && (
                <View style={styles.bonus}>
                  <Text style={styles.bonusLabel}>Tap</Text>
                  <Text style={[styles.bonusValue, { color: Colors.accent.gold }]}>
                    x{item.tapMultiplier.toFixed(2)}
                  </Text>
                </View>
              )}
              {item.prestigeBonus > 0 && (
                <View style={styles.bonus}>
                  <Text style={styles.bonusLabel}>Prestige</Text>
                  <Text style={[styles.bonusValue, { color: Colors.accent.purple }]}>
                    +{item.prestigeBonus}
                  </Text>
                </View>
              )}
            </View>

            {!item.owned && (
              <TouchableOpacity
                onPress={handlePress}
                disabled={!canAfford}
                style={[styles.priceTag, !canAfford && styles.priceTagLocked]}
              >
                <LinearGradient
                  colors={canAfford ? gradColors : ['#333', '#222']}
                  style={styles.priceGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.priceText}>
                    {canAfford ? '💳 BUY ' : '🔒 '}{formatMoney(item.cost)}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmerOverlay: {
    borderRadius: 20,
  },
  emoji: { fontSize: 52 },
  ownedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,230,118,0.2)',
    borderWidth: 1,
    borderColor: Colors.accent.green,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ownedText: { color: Colors.accent.green, fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  body: { padding: 16 },
  name: { color: Colors.text.primary, fontWeight: '900', fontSize: 18, marginBottom: 4 },
  description: { color: Colors.text.muted, fontSize: 12, marginBottom: 12 },
  bonusRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  bonus: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  bonusLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  bonusValue: { fontWeight: '900', fontSize: 15 },
  priceTag: { borderRadius: 13, overflow: 'hidden' },
  priceTagLocked: { opacity: 0.6 },
  priceGrad: { paddingHorizontal: 16, paddingVertical: 13, alignItems: 'center' },
  priceText: { color: '#0a0a1a', fontWeight: '900', fontSize: 15 },
});
