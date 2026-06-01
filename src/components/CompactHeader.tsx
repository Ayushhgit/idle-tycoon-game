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
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../store/gameStore';
import { formatMoney, formatIncomePerSec } from '../utils/formatters';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { Hairline } from '../constants/theme';
import { Icons } from '../constants/icons';
import { NetWorthModal } from './NetWorthModal';
import { StatsModal } from './StatsModal';

interface Props {
  onOpenSettings: () => void;
}

const RANKS = [
  { min: 0,             label: 'Broke',        color: '#8A94A6' },
  { min: 1_000,         label: 'Side Hustler', color: '#AEB7C9' },
  { min: 50_000,        label: 'Manager',      color: '#3DDC97' },
  { min: 1_000_000,     label: 'Millionaire',  color: '#E4E9F2' },
  { min: 50_000_000,    label: 'Tycoon',       color: '#5B8DEF' },
  { min: 1_000_000_000, label: 'Billionaire',  color: '#9D8CFF' },
  { min: 1e12,          label: 'Oligarch',     color: '#CDA765' },
  { min: 1e15,          label: 'Emperor',      color: '#E6CD92' },
];

function getRank(netWorth: number) {
  let r = RANKS[0];
  for (const rank of RANKS) {
    if (netWorth >= rank.min) r = rank;
    else break;
  }
  return r;
}

export function CompactHeader({ onOpenSettings }: Props) {
  const money = useGameStore((s) => s.money);
  const gems = useGameStore((s) => s.gems);
  const passiveIncome = useGameStore((s) => s.passiveIncome);
  const netWorth = useGameStore((s) => s.netWorth);
  const events = useGameStore((s) => s.events);
  const [showNetWorth, setShowNetWorth] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const scale = useSharedValue(1);
  const prevMoneyRef = useRef(money);

  useEffect(() => {
    if (money !== prevMoneyRef.current) {
      scale.value = withSequence(
        withTiming(1.018, { duration: 80, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 150, easing: Easing.in(Easing.quad) })
      );
      prevMoneyRef.current = money;
    }
  }, [money]);

  const moneyAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const now = Date.now();
  const activeEvents = events.filter((e) => e.active && now < e.endAt);
  const rank = getRank(netWorth);

  return (
    <LinearGradient
      colors={['#0E1422', '#0B1019']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.row}>
        <TouchableOpacity style={styles.left} activeOpacity={0.75} onPress={() => setShowNetWorth(true)}>
          <View style={styles.rankRow}>
            <View style={[styles.rankDot, { backgroundColor: rank.color }]} />
            <Text style={[styles.rankText, { color: rank.color }]}>{rank.label.toUpperCase()}</Text>
          </View>
          <Animated.Text style={[styles.money, moneyAnimStyle]} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(money)}
          </Animated.Text>
          <View style={styles.incomeRow}>
            <Ionicons name={Icons.income} size={11} color={Colors.accent.green} />
            <Text style={styles.income}>{formatIncomePerSec(passiveIncome)}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.nwHint}>NW {formatMoney(netWorth)}</Text>
            <Ionicons name={Icons.chevron} size={10} color={Colors.text.muted} />
          </View>
        </TouchableOpacity>

        <View style={styles.right}>
          <TouchableOpacity style={styles.gemPill} activeOpacity={0.8} onPress={() => setShowStats(true)}>
            <Ionicons name={Icons.gems} size={13} color={Colors.accent.cyan} />
            <Text style={styles.gemText}>{gems.toLocaleString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onOpenSettings}
            style={styles.iconBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={Icons.settings} size={17} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
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
      <StatsModal
        visible={showStats}
        onClose={() => setShowStats(false)}
        rankLabel={rank.label}
        rankEmoji={'◆'}
        rankColor={rank.color}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  left: { flex: 1 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  rankDot: { width: 6, height: 6, borderRadius: 3 },
  rankText: { fontFamily: Fonts.bodyExtra, fontSize: 9.5, letterSpacing: 1.6 },
  money: {
    color: Colors.accent.platinum,
    fontFamily: Fonts.displayBlack,
    fontSize: 30,
    letterSpacing: -0.8,
  },
  incomeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  income: { color: Colors.accent.green, fontFamily: Fonts.monoSemi, fontSize: 12, letterSpacing: -0.2 },
  dot: { color: Colors.text.muted, fontSize: 12, marginHorizontal: 1 },
  nwHint: { color: Colors.text.muted, fontFamily: Fonts.mono, fontSize: 12 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  gemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(91,225,230,0.08)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(91,225,230,0.22)',
  },
  gemText: { color: Colors.accent.cyan, fontFamily: Fonts.monoSemi, fontSize: 13 },
  iconBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Hairline.soft,
  },
  eventRow: { flexDirection: 'row', gap: 7, marginTop: 10 },
  eventChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(205,167,101,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(205,167,101,0.26)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  eventEmoji: { fontSize: 11 },
  eventName: { color: Colors.accent.goldLight, fontSize: 10.5, fontFamily: Fonts.bodyBold },
});
