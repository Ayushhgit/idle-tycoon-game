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
import { Fonts } from '../constants/typography';
import { Hairline } from '../constants/theme';

interface Props {
  property: Property;
  money: number;
  onBuy: () => void;
  onUpgrade: () => void;
}

const PROPERTY_COLORS: Record<string, [string, string]> = {
  apartment: ['#8A94A6', '#5C6678'],
  villa: ['#3DDC97', '#22B97E'],
  hotel: ['#FFA07A', '#E0714A'],
  mall: ['#7B86C9', '#5460A8'],
  skyscraper: ['#E6CD92', '#CDA765'],
};

export const PropertyCard = memo(function PropertyCard({ property, money, onBuy, onUpgrade }: Props) {
  const scale = useSharedValue(1);
  const grad = PROPERTY_COLORS[property.id] ?? ['#AEB7C9', '#6B7689'];
  const cost = property.owned ? calcPropertyUpgradeCost(property) : property.baseCost;
  const canAfford = money >= cost;

  const handlePress = () => {
    if (!canAfford) return;
    scale.value = withSequence(
      withSpring(0.97, { damping: 12, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    );
    property.owned ? onUpgrade() : onBuy();
  };

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const profitPercent =
    property.owned && property.purchasePrice > 0
      ? (property.currentValue - property.purchasePrice) / property.purchasePrice
      : 0;

  return (
    <Animated.View style={[animStyle, styles.wrapper]}>
      <TouchableOpacity activeOpacity={0.92} onPress={handlePress}>
        <View style={[styles.card, property.owned && { borderColor: grad[0] + '4D', shadowColor: grad[0] }]}>
          {/* image band */}
          <LinearGradient colors={grad} style={styles.band} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <LinearGradient
              colors={['rgba(255,255,255,0.20)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.emoji}>{property.emoji}</Text>
            {property.owned && (
              <View style={styles.levelPill}>
                <Text style={styles.levelText}>LV {property.level}</Text>
              </View>
            )}
            <View style={styles.bandName}>
              <Text style={styles.name} numberOfLines={1}>{property.name}</Text>
            </View>
          </LinearGradient>

          <View style={styles.body}>
            {property.owned ? (
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>RENT</Text>
                  <Text style={[styles.statValue, { color: Colors.accent.green }]}>
                    {formatIncomePerSec(property.rentPerSec * property.level)}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>VALUE</Text>
                  <Text style={styles.statValue}>{formatMoney(property.currentValue)}</Text>
                </View>
                <View style={styles.statDivider} />
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

            <TouchableOpacity activeOpacity={0.9} onPress={handlePress} disabled={!canAfford}>
              <LinearGradient
                colors={canAfford ? grad : ['#1b2030', '#141925']}
                style={styles.actionGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.actionText, !canAfford && styles.actionDim]}>
                  {property.owned ? 'UPGRADE' : 'ACQUIRE'}
                </Text>
                <Text style={[styles.actionCost, !canAfford && styles.actionDim]}>{formatMoney(cost)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginVertical: 7 },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Hairline.soft,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  band: {
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emoji: { fontSize: 46 },
  levelPill: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: 'rgba(14,20,34,0.5)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelText: { color: '#fff', fontFamily: Fonts.bodyExtra, fontSize: 10, letterSpacing: 0.5 },
  bandName: {
    position: 'absolute',
    left: 14,
    bottom: 10,
    right: 14,
  },
  name: {
    color: '#fff',
    fontFamily: Fonts.display,
    fontSize: 18,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  body: { padding: 14 },
  description: { color: Colors.text.muted, fontFamily: Fonts.body, fontSize: 12, marginBottom: 12 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stat: { flex: 1 },
  statDivider: { width: 1, height: 28, backgroundColor: Hairline.soft, marginHorizontal: 8 },
  statLabel: { color: Colors.text.muted, fontFamily: Fonts.bodyBold, fontSize: 9, letterSpacing: 1, marginBottom: 3 },
  statValue: { color: Colors.text.primary, fontFamily: Fonts.monoSemi, fontSize: 12.5 },
  actionGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
  },
  actionText: { color: '#0E1422', fontFamily: Fonts.bodyExtra, fontSize: 12, letterSpacing: 1 },
  actionDim: { color: Colors.text.muted },
  actionCost: { color: '#0E1422', fontFamily: Fonts.monoSemi, fontSize: 14 },
});
