import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { LotteryResult } from '../types/game';
import { formatMoney } from '../utils/formatters';
import { useHaptics } from '../hooks/useHaptics';
import { Colors } from '../constants/colors';

const TICKET_OPTIONS = [1, 5, 10, 50];

export function LotteryPanel() {
  const buyLotteryTicket = useGameStore((s) => s.buyLotteryTicket);
  const money = useGameStore((s) => s.money);
  const netWorth = useGameStore((s) => s.netWorth);
  const lotteryState = useGameStore((s) => s.lottery);

  const [result, setResult] = useState<LotteryResult | null>(null);
  const { criticalHaptic, errorHaptic } = useHaptics();

  const ticketPrice = Math.max(100, netWorth * 0.001);

  const handleBuy = (tickets: number) => {
    const r = buyLotteryTicket(tickets);
    if (r) {
      setResult(r);
      if (r.won) criticalHaptic();
      else errorHaptic();
    }
  };

  const tierColor = result
    ? result.tier === 'jackpot'
      ? Colors.accent.gold
      : result.tier === 'major'
      ? Colors.accent.green
      : result.tier === 'minor'
      ? Colors.accent.blue
      : Colors.text.muted
    : Colors.text.muted;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,215,0,0.08)', 'rgba(255,140,0,0.04)']}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
      />

      <View style={styles.header}>
        <Text style={styles.title}>🎟️ LOTTERY</Text>
        <View style={styles.oddsChip}>
          <Text style={styles.oddsText}>Jackpot 1:3333</Text>
        </View>
      </View>

      <Text style={styles.ticketPrice}>
        {formatMoney(ticketPrice)} / ticket · Jackpot {formatMoney(ticketPrice * 1000)}
      </Text>

      {result && (
        <View style={[styles.resultBox, { borderColor: tierColor + '55' }]}>
          <Text style={[styles.resultLabel, { color: tierColor }]}>{result.label}</Text>
          {result.won && (
            <Text style={styles.resultPrize}>+{formatMoney(result.prize)}</Text>
          )}
        </View>
      )}

      <View style={styles.btnGrid}>
        {TICKET_OPTIONS.map((t) => {
          const cost = ticketPrice * t;
          const canAfford = money >= cost;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => handleBuy(t)}
              disabled={!canAfford}
              style={[styles.ticketBtn, !canAfford && styles.btnDisabled]}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={canAfford ? ['#FFD700', '#FF8C00'] : ['#2a2a38', '#1d1d28']}
                style={styles.ticketGrad}
              >
                <Text style={[styles.ticketCount, !canAfford && styles.dimText]}>
                  {t} {t === 1 ? 'ticket' : 'tickets'}
                </Text>
                <Text style={[styles.ticketCost, !canAfford && styles.dimText]}>
                  {formatMoney(cost)}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>TICKETS BOUGHT</Text>
          <Text style={styles.statValue}>{lotteryState.ticketsBought.toLocaleString()}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>TOTAL WON</Text>
          <Text style={[styles.statValue, { color: Colors.accent.green }]}>
            {formatMoney(lotteryState.totalWon)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    color: Colors.accent.gold,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  oddsChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  oddsText: { color: Colors.text.muted, fontSize: 10, fontWeight: '700' },
  ticketPrice: {
    color: Colors.text.muted,
    fontSize: 11,
    marginBottom: 12,
    fontWeight: '600',
  },
  resultBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  resultLabel: { fontWeight: '900', fontSize: 15 },
  resultPrize: { color: Colors.accent.green, fontWeight: '800', fontSize: 14, marginTop: 2 },
  btnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  ticketBtn: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnDisabled: { opacity: 0.5 },
  ticketGrad: {
    paddingVertical: 11,
    alignItems: 'center',
    gap: 2,
  },
  ticketCount: { color: '#0a0a1a', fontWeight: '900', fontSize: 13 },
  ticketCost: { color: 'rgba(0,0,0,0.7)', fontWeight: '700', fontSize: 12 },
  dimText: { color: Colors.text.muted },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 10,
  },
  statLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 3,
  },
  statValue: { color: Colors.text.primary, fontWeight: '900', fontSize: 15 },
});
