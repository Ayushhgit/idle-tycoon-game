import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
      withSpring(0.97, { damping: 12, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    );
    if (business.owned) onUpgrade();
    else onBuy();
  };

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!isUnlocked) {
    return (
      <View style={[styles.card, styles.lockedCard]}>
        <Ionicons name="lock-closed" size={20} color={Colors.text.muted} />
        <Text style={styles.lockedName}>{business.name}</Text>
        <Text style={styles.lockedHint}>Earn {formatMoney(business.unlockAt)} to unlock</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[animStyle, styles.wrapper]}>
      <TouchableOpacity activeOpacity={0.92} onPress={handlePress}>
        <View style={[styles.card, business.owned && { borderColor: color + '4D', shadowColor: color }]}>
          {/* icon band */}
          <LinearGradient
            colors={[color + '33', color + '0D']}
            style={styles.band}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.iconSquare, { backgroundColor: color + '26', borderColor: color + '4D' }]}>
              <Text style={styles.emoji}>{business.emoji}</Text>
            </View>
            <View style={styles.bandRight}>
              {business.owned ? (
                <>
                  <View style={[styles.levelBadge, { backgroundColor: color }]}>
                    <Text style={styles.levelText}>LV {business.level}</Text>
                  </View>
                  <View style={styles.incomePill}>
                    <View style={styles.incomeDot} />
                    <Text style={styles.incomeText}>{formatIncomePerSec(income)}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.notOwnedPill}>
                  <Text style={styles.notOwnedText}>NOT OWNED</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* body */}
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={1}>{business.name}</Text>
            <Text style={styles.description} numberOfLines={1}>{business.description}</Text>

            <TouchableOpacity activeOpacity={0.9} onPress={handlePress} disabled={!canAfford}>
              <LinearGradient
                colors={
                  !canAfford
                    ? ['#1b2030', '#141925']
                    : business.owned
                    ? [color, color + 'CC']
                    : ['#E4E9F2', '#C7D0DE']
                }
                style={styles.actionButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.actionLabel, !canAfford && styles.actionLabelDim]}>
                  {business.owned ? 'UPGRADE' : 'ACQUIRE'}
                </Text>
                <Text style={[styles.actionCost, !canAfford && styles.actionLabelDim]}>
                  {formatMoney(cost)}
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
  wrapper: { marginHorizontal: 16, marginVertical: 7 },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Hairline.soft,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  lockedCard: {
    marginHorizontal: 16,
    marginVertical: 7,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderStyle: 'dashed',
    borderColor: Hairline.soft,
    paddingVertical: 24,
    gap: 6,
  },
  lockedName: { color: Colors.text.secondary, fontFamily: Fonts.displaySemi, fontSize: 14 },
  lockedHint: { color: Colors.text.muted, fontFamily: Fonts.body, fontSize: 11 },
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  iconSquare: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 30 },
  bandRight: { alignItems: 'flex-end', gap: 7 },
  levelBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelText: { fontFamily: Fonts.bodyExtra, fontSize: 10, color: '#0E1422', letterSpacing: 0.5 },
  incomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(61,220,151,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  incomeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.accent.green },
  incomeText: { fontFamily: Fonts.monoSemi, fontSize: 12, color: Colors.accent.green },
  notOwnedPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Hairline.soft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  notOwnedText: { color: Colors.text.muted, fontFamily: Fonts.bodyBold, fontSize: 9.5, letterSpacing: 1 },
  body: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 12 },
  name: { color: Colors.text.primary, fontFamily: Fonts.display, fontSize: 17, marginBottom: 3 },
  description: { color: Colors.text.muted, fontFamily: Fonts.body, fontSize: 12, marginBottom: 12 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
  },
  actionLabel: { color: '#0E1422', fontFamily: Fonts.bodyExtra, fontSize: 12, letterSpacing: 1 },
  actionLabelDim: { color: Colors.text.muted },
  actionCost: { color: '#0E1422', fontFamily: Fonts.monoSemi, fontSize: 14 },
});
