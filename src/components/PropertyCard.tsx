import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Property } from '../types/game';
import { formatMoney, formatIncomePerSec, formatPercent } from '../utils/formatters';
import { calcPropertyUpgradeCost } from '../utils/calculations';
import { Colors } from '../constants/colors';

interface Props {
  property: Property;
  money: number;
  onBuy: () => void;
  onUpgrade: () => void;
}

const PROPERTY_COLORS: Record<string, [string, string]> = {
  apartment: ['#78909C', '#546E7A'],
  villa: ['#66BB6A', '#43A047'],
  hotel: ['#FF7043', '#E64A19'],
  mall: ['#5C6BC0', '#3949AB'],
  skyscraper: ['#FFD54F', '#FFB300'],
};

export const PropertyCard = memo(function PropertyCard({
  property,
  money,
  onBuy,
  onUpgrade,
}: Props) {
  const scale = useSharedValue(1);
  const gradColors = PROPERTY_COLORS[property.id] ?? ['#aaa', '#888'];
  const cost = property.owned ? calcPropertyUpgradeCost(property) : property.baseCost;
  const canAfford = money >= cost;

  const handlePress = () => {
    if (!canAfford) return;
    scale.value = withSequence(
      withSpring(0.95, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    if (property.owned) onUpgrade();
    else onBuy();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const profitPercent =
    property.owned && property.purchasePrice > 0
      ? (property.currentValue - property.purchasePrice) / property.purchasePrice
      : 0;

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <View
          style={[
            styles.card,
            property.owned && { borderColor: gradColors[0] + '66', shadowColor: gradColors[0] },
          ]}
        >
          <LinearGradient
            colors={
              property.owned
                ? [gradColors[0] + '14', 'rgba(255,255,255,0.015)']
                : ['rgba(255,255,255,0.04)', 'transparent']
            }
            style={StyleSheet.absoluteFill}
          />

          <LinearGradient
            colors={gradColors}
            style={styles.imageArea}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.18)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.emoji}>{property.emoji}</Text>
            {property.owned && (
              <View style={styles.levelPill}>
                <Text style={styles.levelText}>Lv.{property.level}</Text>
              </View>
            )}
          </LinearGradient>

          <View style={styles.info}>
            <Text style={styles.name}>{property.name}</Text>
            {property.owned ? (
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>RENT</Text>
                  <Text style={[styles.statValue, { color: Colors.accent.green }]}>
                    {formatIncomePerSec(property.rentPerSec * property.level)}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>VALUE</Text>
                  <Text style={styles.statValue}>{formatMoney(property.currentValue)}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>GAIN</Text>
                  <Text style={[styles.statValue, { color: profitPercent >= 0 ? Colors.accent.green : Colors.accent.red }]}>
                    {formatPercent(profitPercent)}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.description}>{property.description}</Text>
            )}

            <TouchableOpacity
              onPress={handlePress}
              disabled={!canAfford}
              style={[styles.actionBtn, !canAfford && styles.disabledBtn]}
            >
              <LinearGradient
                colors={canAfford ? gradColors : ['#2a2a38', '#1d1d28']}
                style={styles.actionGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.actionText, !canAfford && styles.actionTextDim]}>
                  {property.owned ? '⬆ UPGRADE' : '🏠 BUY'} · {formatMoney(cost)}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: 20,
    marginVertical: 7,
    marginHorizontal: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  imageArea: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emoji: { fontSize: 40 },
  levelPill: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  info: {
    flex: 1,
    padding: 14,
  },
  name: {
    color: Colors.text.primary,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 3,
  },
  description: {
    color: Colors.text.muted,
    fontSize: 11,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  stat: { flex: 1 },
  statLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  statValue: { color: Colors.text.primary, fontWeight: '800', fontSize: 13 },
  actionBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  disabledBtn: { opacity: 0.4 },
  actionGrad: { paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  actionText: { color: '#0a0a1a', fontWeight: '900', fontSize: 13 },
  actionTextDim: { color: Colors.text.muted },
});
