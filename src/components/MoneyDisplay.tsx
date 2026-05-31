import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { formatMoney, formatIncomePerSec } from '../utils/formatters';
import { Colors } from '../constants/colors';
import { NetWorthModal } from './NetWorthModal';

interface Props {
  onOpenSettings: () => void;
}

const RANKS = [
  { min: 0,             label: 'Broke',           emoji: '🪨', color: '#888' },
  { min: 1_000,         label: 'Side Hustler',     emoji: '💼', color: '#aaa' },
  { min: 50_000,        label: 'Manager',          emoji: '📋', color: '#66BB6A' },
  { min: 1_000_000,     label: 'Millionaire',      emoji: '💵', color: '#FFD700' },
  { min: 50_000_000,    label: 'Tycoon',           emoji: '🏙️', color: '#42A5F5' },
  { min: 1_000_000_000, label: 'Billionaire',      emoji: '🛥️', color: '#AB47BC' },
  { min: 1e12,          label: 'Oligarch',         emoji: '✈️', color: '#FF7043' },
  { min: 1e15,          label: '👑 Emperor',       emoji: '👑', color: '#FF1744' },
];

function getRank(netWorth: number) {
  let r = RANKS[0];
  for (const rank of RANKS) {
    if (netWorth >= rank.min) r = rank;
    else break;
  }
  return r;
}

export function MoneyDisplay({ onOpenSettings }: Props) {
  const money = useGameStore((s) => s.money);
  const gems = useGameStore((s) => s.gems);
  const passiveIncome = useGameStore((s) => s.passiveIncome);
  const netWorth = useGameStore((s) => s.netWorth);
  const events = useGameStore((s) => s.events);
  const [showNetWorth, setShowNetWorth] = useState(false);

  const scale = useSharedValue(1);
  const prevMoneyRef = useRef(money);

  useEffect(() => {
    if (money !== prevMoneyRef.current) {
      scale.value = withSequence(
        withTiming(1.03, { duration: 90, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 160, easing: Easing.in(Easing.quad) })
      );
      prevMoneyRef.current = money;
    }
  }, [money]);

  const moneyAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const now = Date.now();
  const activeEvents = events.filter((e) => e.active && now < e.endAt);
  const rank = getRank(netWorth);

  return (
    <LinearGradient
      colors={['#0d0d24', '#0a0a1c']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Top bar: brand + gems + settings */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandMark}>{rank.emoji}</Text>
          <Text style={[styles.brandText, { color: rank.color }]}>{rank.label.toUpperCase()}</Text>
        </View>

        <View style={styles.topRight}>
          <View style={styles.gemPill}>
            <Text style={styles.gemEmoji}>💎</Text>
            <Text style={styles.gemText}>{gems.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            onPress={onOpenSettings}
            style={styles.settingsBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance + net worth */}
      <View style={styles.mainRow}>
        <View style={styles.balanceBlock}>
          <Text style={styles.label}>BALANCE</Text>
          <Animated.Text
            style={[styles.moneyText, moneyAnimStyle]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatMoney(money)}
          </Animated.Text>
          <View style={styles.incomePill}>
            <View style={styles.incomeDot} />
            <Text style={styles.incomeText}>{formatIncomePerSec(passiveIncome)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.netWorthCard}
          onPress={() => setShowNetWorth(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.netWorthLabel}>NET WORTH</Text>
          <Text style={styles.netWorthText} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(netWorth)}
          </Text>
          <Text style={styles.netWorthHint}>Tap for breakdown ›</Text>
        </TouchableOpacity>
      </View>

      {activeEvents.length > 0 && (
        <View style={styles.eventRow}>
          {activeEvents.slice(0, 2).map((ev) => (
            <View key={ev.id} style={styles.eventChip}>
              <Text style={styles.eventEmoji}>{ev.emoji}</Text>
              <Text style={styles.eventName}>{ev.name}</Text>
            </View>
          ))}
        </View>
      )}

      <NetWorthModal visible={showNetWorth} onClose={() => setShowNetWorth(false)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.12)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandMark: { fontSize: 16 },
  brandText: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,229,255,0.1)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.25)',
  },
  gemEmoji: { fontSize: 13 },
  gemText: { color: Colors.accent.cyan, fontSize: 14, fontWeight: '800' },
  settingsBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  settingsIcon: { fontSize: 16 },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  balanceBlock: { flex: 1.4, justifyContent: 'center' },
  label: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 3,
  },
  moneyText: {
    color: Colors.accent.gold,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  incomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  incomeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.green,
  },
  incomeText: {
    color: Colors.accent.green,
    fontSize: 13,
    fontWeight: '700',
  },
  netWorthCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  netWorthLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  netWorthText: {
    color: Colors.text.primary,
    fontSize: 19,
    fontWeight: '900',
  },
  netWorthHint: {
    color: 'rgba(255,215,0,0.6)',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
  },
  eventRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  eventChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,165,0,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,165,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 5,
  },
  eventEmoji: { fontSize: 12 },
  eventName: { color: '#FFB300', fontSize: 11, fontWeight: '800' },
});
