import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { formatMoney, formatPercent } from '../utils/formatters';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { Hairline } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function NetWorthModal({ visible, onClose }: Props) {
  const money = useGameStore((s) => s.money);
  const stocks = useGameStore((s) => s.stocks);
  const properties = useGameStore((s) => s.properties);
  const luxuryItems = useGameStore((s) => s.luxuryItems);
  const mutualFunds = useGameStore((s) => s.mutualFunds);
  const netWorth = useGameStore((s) => s.netWorth);
  const passiveIncome = useGameStore((s) => s.passiveIncome);
  const lifetimeEarnings = useGameStore((s) => s.lifetimeEarnings);
  const casino = useGameStore((s) => s.casino);

  const stockValue = stocks.reduce((s, st) => s + st.sharesOwned * st.currentPrice, 0);
  const propValue = properties.filter((p) => p.owned).reduce((s, p) => s + p.currentValue, 0);
  const luxValue = luxuryItems.filter((l) => l.owned).reduce((s, l) => s + l.cost, 0);
  const fundValue = mutualFunds.reduce((s, f) => s + f.currentValue, 0);

  const breakdown = [
    {
      label: 'Cash Balance',
      emoji: '💵',
      value: money,
      color: Colors.accent.gold,
      gradient: ['rgba(205,167,101,0.15)', 'rgba(205,167,101,0.04)'] as [string, string],
    },
    {
      label: 'Stock Portfolio',
      emoji: '📈',
      value: stockValue,
      color: Colors.accent.blue,
      gradient: ['rgba(91,141,239,0.15)', 'rgba(91,141,239,0.04)'] as [string, string],
    },
    {
      label: 'Real Estate',
      emoji: '🏙️',
      value: propValue,
      color: Colors.accent.green,
      gradient: ['rgba(61,220,151,0.15)', 'rgba(61,220,151,0.04)'] as [string, string],
    },
    {
      label: 'Luxury Assets',
      emoji: '💎',
      value: luxValue,
      color: Colors.accent.purple,
      gradient: ['rgba(157,140,255,0.15)', 'rgba(157,140,255,0.04)'] as [string, string],
    },
    {
      label: 'Mutual Funds',
      emoji: '📊',
      value: fundValue,
      color: Colors.accent.cyan,
      gradient: ['rgba(91,225,230,0.15)', 'rgba(91,225,230,0.04)'] as [string, string],
    },
  ].filter((b) => b.value > 0);

  const scale = useSharedValue(0.88);
  const translateY = useSharedValue(40);

  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 14, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 14, stiffness: 200 });
    } else {
      scale.value = 0.88;
      translateY.value = 40;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[styles.sheet, containerStyle]}
          onStartShouldSetResponder={() => true}
        >
          <LinearGradient
            colors={['#161D2E', '#0A0E18']}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />

          <View style={styles.handle} />

          <LinearGradient
            colors={['rgba(91,141,239,0.12)', 'transparent']}
            style={styles.topGlow}
          />

          <Text style={styles.title}>NET WORTH</Text>
          <Text style={styles.totalValue}>{formatMoney(netWorth)}</Text>

          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>PASSIVE/SEC</Text>
              <Text style={[styles.quickStatValue, { color: Colors.accent.green }]}>
                {formatMoney(passiveIncome)}/s
              </Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>LIFETIME EARNED</Text>
              <Text style={[styles.quickStatValue, { color: Colors.accent.gold }]}>
                {formatMoney(lifetimeEarnings)}
              </Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>CASINO TOKENS</Text>
              <Text style={[styles.quickStatValue, { color: Colors.accent.purple }]}>
                {casino.tokens.toLocaleString()}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>ASSET BREAKDOWN</Text>

            {breakdown.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>No assets yet. Start building your empire!</Text>
              </View>
            ) : (
              breakdown.map((item) => {
                const pct = netWorth > 0 ? item.value / netWorth : 0;
                return (
                  <View key={item.label} style={styles.breakdownRow}>
                    <LinearGradient colors={item.gradient} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
                    <View style={[styles.breakdownIcon, { backgroundColor: item.color + '25' }]}>
                      <Text style={styles.breakdownEmoji}>{item.emoji}</Text>
                    </View>
                    <View style={styles.breakdownInfo}>
                      <Text style={styles.breakdownLabel}>{item.label}</Text>
                      <View style={styles.barBg}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${Math.max(2, pct * 100)}%` as any, backgroundColor: item.color },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.breakdownRight}>
                      <Text style={[styles.breakdownValue, { color: item.color }]}>
                        {formatMoney(item.value)}
                      </Text>
                      <Text style={styles.breakdownPct}>{formatPercent(pct, 1).replace('+', '')}</Text>
                    </View>
                  </View>
                );
              })
            )}

            {stocks.filter((s) => s.sharesOwned > 0).length > 0 && (
              <>
                <Text style={styles.sectionTitle}>STOCK HOLDINGS</Text>
                {stocks
                  .filter((s) => s.sharesOwned > 0)
                  .map((s) => {
                    const val = s.sharesOwned * s.currentPrice;
                    const pl = (s.currentPrice - s.averageBuyPrice) * s.sharesOwned;
                    return (
                      <View key={s.id} style={styles.holdingRow}>
                        <View style={[styles.holdingDot, { backgroundColor: s.color }]} />
                        <View style={styles.holdingInfo}>
                          <Text style={styles.holdingTicker}>{s.ticker}</Text>
                          <Text style={styles.holdingShares}>{s.sharesOwned} shares</Text>
                        </View>
                        <View style={styles.holdingRight}>
                          <Text style={styles.holdingValue}>{formatMoney(val)}</Text>
                          <Text style={[styles.holdingPL, { color: pl >= 0 ? Colors.accent.green : Colors.accent.red }]}>
                            {formatMoney(pl, true)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
              </>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>CLOSE</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Hairline.soft,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  title: {
    color: Colors.text.muted,
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 5,
  },
  totalValue: {
    color: Colors.accent.platinum,
    fontFamily: Fonts.displayBlack,
    fontSize: 40,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 16,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatLabel: {
    color: Colors.text.muted,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 5,
    textAlign: 'center',
  },
  quickStatValue: { fontFamily: Fonts.monoSemi, fontSize: 13, textAlign: 'center' },
  quickStatDivider: {
    width: 1,
    backgroundColor: Hairline.soft,
    marginHorizontal: 4,
  },
  list: { flex: 1 },
  sectionTitle: {
    color: Colors.text.muted,
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 4,
  },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: Colors.text.muted, fontFamily: Fonts.body, fontSize: 13, textAlign: 'center' },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    overflow: 'hidden',
    gap: 12,
    borderWidth: 1,
    borderColor: Hairline.faint,
  },
  breakdownIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownEmoji: { fontSize: 24 },
  breakdownInfo: { flex: 1 },
  breakdownLabel: { color: Colors.text.primary, fontFamily: Fonts.bodySemi, fontSize: 13, marginBottom: 6 },
  barBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 2 },
  breakdownRight: { alignItems: 'flex-end' },
  breakdownValue: { fontFamily: Fonts.monoSemi, fontSize: 14 },
  breakdownPct: { color: Colors.text.muted, fontFamily: Fonts.mono, fontSize: 11, marginTop: 3 },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    gap: 10,
  },
  holdingDot: { width: 10, height: 10, borderRadius: 5 },
  holdingInfo: { flex: 1 },
  holdingTicker: { color: Colors.text.primary, fontFamily: Fonts.monoSemi, fontSize: 14 },
  holdingShares: { color: Colors.text.muted, fontFamily: Fonts.body, fontSize: 11 },
  holdingRight: { alignItems: 'flex-end' },
  holdingValue: { color: Colors.text.primary, fontFamily: Fonts.monoSemi, fontSize: 14 },
  holdingPL: { fontSize: 11, fontFamily: Fonts.mono, marginTop: 3 },
  closeBtn: {
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { color: Colors.text.secondary, fontFamily: Fonts.bodyBold, fontSize: 14, letterSpacing: 1 },
});
