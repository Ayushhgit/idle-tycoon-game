import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Business } from '../types/game';
import { formatMoney, formatIncomePerSec } from '../utils/formatters';
import { calcBusinessCost, calcBusinessIncome } from '../utils/calculations';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { Hairline } from '../constants/theme';

interface Props {
  business: Business;
  canAfford: boolean;
  isUnlocked: boolean;
  onBuy: () => void;
  onUpgrade: () => void;
}

const BUSINESS_COLORS: Record<string, string> = {
  lemonade_stand: Colors.business.lemonade,
  grocery_store: Colors.business.grocery,
  restaurant: Colors.business.restaurant,
  startup: Colors.business.startup,
  factory: Colors.business.factory,
  ai_company: Colors.business.ai,
  bank: Colors.business.bank,
  space_company: Colors.business.space,
};

export const BusinessCard = memo(function BusinessCard({
  business,
  canAfford,
  isUnlocked,
  onBuy,
  onUpgrade,
}: Props) {
  const scale = useSharedValue(1);
  const color = BUSINESS_COLORS[business.id] ?? Colors.accent.gold;
  const cost = calcBusinessCost(business);
  const income = calcBusinessIncome(business);

  const handlePress = () => {
    if (!isUnlocked) return;
    scale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    if (business.owned) onUpgrade();
    else onBuy();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!isUnlocked) {
    return (
      <View style={[styles.card, styles.lockedCard]}>
        <Text style={styles.lockedEmoji}>🔒</Text>
        <Text style={styles.lockedName}>{business.name}</Text>
        <Text style={styles.lockedHint}>
          Earn {formatMoney(business.unlockAt)} to unlock
        </Text>
      </View>
    );
  }

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <View
          style={[
            styles.card,
            business.owned && { borderColor: color + '55', shadowColor: color },
          ]}
        >
          <LinearGradient
            colors={
              business.owned
                ? [color + '18', 'rgba(255,255,255,0.02)']
                : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']
            }
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.leftSection}>
            <LinearGradient
              colors={[color + '40', color + '12']}
              style={styles.iconBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.emoji}>{business.emoji}</Text>
            </LinearGradient>
            {business.owned && (
              <View style={[styles.levelBadge, { backgroundColor: color }]}>
                <Text style={styles.levelText}>Lv.{business.level}</Text>
              </View>
            )}
          </View>

          <View style={styles.middleSection}>
            <Text style={styles.name} numberOfLines={1}>{business.name}</Text>
            <Text style={styles.description} numberOfLines={1}>{business.description}</Text>
            {business.owned ? (
              <View style={[styles.incomePill, { backgroundColor: Colors.accent.green + '18' }]}>
                <View style={styles.incomeDot} />
                <Text style={styles.incomeText}>{formatIncomePerSec(income)}</Text>
              </View>
            ) : (
              <View style={styles.notOwnedPill}>
                <Text style={styles.notOwnedText}>Not owned</Text>
              </View>
            )}
          </View>

          <View style={styles.rightSection}>
            <LinearGradient
              colors={
                !canAfford
                  ? ['#2a2a38', '#1d1d28']
                  : business.owned
                  ? [color, color + 'AA']
                  : [Colors.accent.gold, Colors.accent.goldDark]
              }
              style={[styles.actionButton, !canAfford && styles.disabledButton]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.actionLabel, !canAfford && styles.actionLabelDim]}>
                {business.owned ? '↑ UPGRADE' : 'ACQUIRE'}
              </Text>
              <Text style={[styles.costText, !canAfford && styles.actionLabelDim]}>
                {formatMoney(cost)}
              </Text>
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: 18,
    marginVertical: 6,
    marginHorizontal: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: Hairline.soft,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  lockedCard: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 18,
    marginVertical: 6,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
    opacity: 0.6,
    paddingVertical: 22,
  },
  lockedEmoji: { fontSize: 28, marginBottom: 6, opacity: 0.7 },
  lockedName: { color: Colors.text.secondary, fontFamily: Fonts.displaySemi, fontSize: 14 },
  lockedHint: { color: Colors.text.muted, fontFamily: Fonts.body, fontSize: 11, marginTop: 4 },
  leftSection: {
    marginRight: 12,
    alignItems: 'center',
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 30 },
  levelBadge: {
    marginTop: -8,
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  levelText: { fontSize: 10, fontFamily: Fonts.bodyExtra, color: '#0E1422' },
  middleSection: { flex: 1, gap: 4 },
  name: {
    color: Colors.text.primary,
    fontFamily: Fonts.displaySemi,
    fontSize: 15,
  },
  description: {
    color: Colors.text.muted,
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  incomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  incomeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.accent.green,
  },
  incomeText: { fontSize: 12.5, fontFamily: Fonts.monoSemi, color: Colors.accent.green },
  notOwnedPill: { alignSelf: 'flex-start' },
  notOwnedText: { color: Colors.text.muted, fontFamily: Fonts.body, fontSize: 11 },
  rightSection: { marginLeft: 10 },
  actionButton: {
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: 'center',
    minWidth: 96,
  },
  disabledButton: { opacity: 0.7 },
  actionLabel: {
    color: '#0E1422',
    fontFamily: Fonts.bodyExtra,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  actionLabelDim: { color: Colors.text.muted },
  costText: {
    color: 'rgba(14,20,34,0.72)',
    fontFamily: Fonts.monoSemi,
    fontSize: 13,
    marginTop: 3,
  },
});
