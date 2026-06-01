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
import { Fonts } from '../constants/typography';
import { Hairline } from '../constants/theme';
import { NetWorthModal } from './NetWorthModal';
import { StatsModal } from './StatsModal';

interface Props {
  onOpenSettings: () => void;
}

const RANKS = [
  { min: 0,             label: 'Broke',        emoji: '○', color: '#8A94A6' },
  { min: 1_000,         label: 'Side Hustler', emoji: '◔', color: '#AEB7C9' },
  { min: 50_000,        label: 'Manager',      emoji: '◑', color: '#3DDC97' },
  { min: 1_000_000,     label: 'Millionaire',  emoji: '◕', color: '#E4E9F2' },
  { min: 50_000_000,    label: 'Tycoon',       emoji: '●', color: '#5B8DEF' },
  { min: 1_000_000_000, label: 'Billionaire',  emoji: '◆', color: '#9D8CFF' },
  { min: 1e12,          label: 'Oligarch',     emoji: '✦', color: '#CDA765' },
  { min: 1e15,          label: 'Emperor',      emoji: '♛', color: '#E6CD92' },
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
  const [showStats, setShowStats] = useState(false);

  const scale = useSharedValue(1);
  const prevMoneyRef = useRef(money);

  useEffect(() => {
    if (money !== prevMoneyRef.current) {
      scale.value = withSequence(
        withTiming(1.025, { duration: 90, easing: Easing.out(Easing.quad) }),
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
      colors={['#0E1422', '#0A0E18']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      {/* Top bar: rank + gems + settings */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.rankChip} onPress={() => setShowStats(true)} activeOpacity={0.7}>
          <Text style={[styles.rankMark, { color: rank.color }]}>{rank.emoji}</Text>
          <Text style={[styles.rankText, { color: rank.color }]}>{rank.label.toUpperCase()}</Text>
          <Text style={styles.rankChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.topRight}>
          <View style={styles.gemPill}>
            <Text style={styles.gemEmoji}>◈</Text>
            <Text style={styles.gemText}>{gems.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            onPress={onOpenSettings}
            style={styles.settingsBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
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
            <Text style={styles.incomeArrow}>▲</Text>
            <Text style={styles.incomeText}>{formatIncomePerSec(passiveIncome)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.netWorthCard}
          onPress={() => setShowNetWorth(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.012)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.netWorthLabel}>NET WORTH</Text>
          <Text style={styles.netWorthText} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(netWorth)}
          </Text>
          <Text style={styles.netWorthHint}>Breakdown ›</Text>
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
      <StatsModal
        visible={showStats}
        onClose={() => setShowStats(false)}
        rankLabel={rank.label}
        rankEmoji={rank.emoji}
        rankColor={rank.color}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Hairline.soft,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  rankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Hairline.soft,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rankMark: { fontSize: 13 },
  rankText: {
    fontFamily: Fonts.bodyExtra,
    fontSize: 11,
    letterSpacing: 1.6,
  },
  rankChevron: { color: Colors.text.muted, fontSize: 14, fontFamily: Fonts.bodyBold },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(91,225,230,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(91,225,230,0.22)',
  },
  gemEmoji: { fontSize: 12, color: Colors.accent.cyan },
  gemText: { color: Colors.accent.cyan, fontSize: 13, fontFamily: Fonts.monoSemi },
  settingsBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Hairline.soft,
  },
  settingsIcon: { fontSize: 16, color: Colors.text.secondary },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  balanceBlock: { flex: 1.4, justifyContent: 'center' },
  label: {
    color: Colors.text.muted,
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 3,
    marginBottom: 4,
  },
  moneyText: {
    color: Colors.accent.platinum,
    fontFamily: Fonts.displayBlack,
    fontSize: 34,
    letterSpacing: -0.8,
  },
  incomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },
  incomeArrow: { color: Colors.accent.green, fontSize: 9 },
  incomeText: {
    color: Colors.accent.green,
    fontFamily: Fonts.monoSemi,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  netWorthCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Hairline.soft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  netWorthLabel: {
    color: Colors.text.muted,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.8,
    marginBottom: 5,
  },
  netWorthText: {
    color: Colors.text.primary,
    fontFamily: Fonts.monoSemi,
    fontSize: 18,
    letterSpacing: -0.4,
  },
  netWorthHint: {
    color: Colors.accent.silver,
    fontFamily: Fonts.bodySemi,
    fontSize: 9,
    marginTop: 5,
    opacity: 0.8,
  },
  eventRow: { flexDirection: 'row', gap: 7, marginTop: 14 },
  eventChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(205,167,101,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(205,167,101,0.26)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  eventEmoji: { fontSize: 12 },
  eventName: { color: Colors.accent.goldLight, fontSize: 11, fontFamily: Fonts.bodyBold },
});
