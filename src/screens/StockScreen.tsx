import React, { useCallback } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { StockCard } from '../components/StockCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { formatMoney, formatPercent } from '../utils/formatters';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { Hairline } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';
import { calcStockProfitLoss } from '../utils/calculations';

export function StockScreen() {
  const stocks = useGameStore((s) => s.stocks);
  const money = useGameStore((s) => s.money);
  const portfolioValue = useGameStore((s) => s.portfolioValue);
  const mutualFunds = useGameStore((s) => s.mutualFunds);
  const buyStock = useGameStore((s) => s.buyStock);
  const sellStock = useGameStore((s) => s.sellStock);
  const investInFund = useGameStore((s) => s.investInFund);
  const withdrawFromFund = useGameStore((s) => s.withdrawFromFund);
  const { purchaseHaptic, errorHaptic } = useHaptics();

  const totalPL = stocks.reduce((sum, s) => sum + calcStockProfitLoss(s), 0);
  const totalInvested = stocks.reduce((s, st) => s + st.averageBuyPrice * st.sharesOwned, 0);
  const plPct = totalInvested > 0 ? totalPL / totalInvested : 0;

  const handleBuy = useCallback(
    (id: string, shares: number) => {
      const ok = buyStock(id, shares);
      if (ok) purchaseHaptic();
      else errorHaptic();
    },
    [buyStock, purchaseHaptic, errorHaptic]
  );

  const handleSell = useCallback(
    (id: string, shares: number) => {
      const ok = sellStock(id, shares);
      if (ok) purchaseHaptic();
      else errorHaptic();
    },
    [sellStock, purchaseHaptic, errorHaptic]
  );

  const handleInvestFund = useCallback(
    (id: string) => {
      const amount = Math.min(money * 0.1, money);
      if (amount <= 0) { errorHaptic(); return; }
      const ok = investInFund(id, amount);
      if (ok) purchaseHaptic();
      else errorHaptic();
    },
    [money, investInFund, purchaseHaptic, errorHaptic]
  );

  const handleWithdrawFund = useCallback(
    (id: string) => {
      const ok = withdrawFromFund(id);
      if (ok) purchaseHaptic();
      else errorHaptic();
    },
    [withdrawFromFund, purchaseHaptic, errorHaptic]
  );

  return (
    <FlatList
      data={stocks}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View style={styles.portfolioCard}>
              <LinearGradient
                colors={['rgba(91,141,239,0.12)', 'rgba(91,141,239,0.05)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              />
              <Text style={styles.portLabel}>PORTFOLIO VALUE</Text>
              <Text style={styles.portValue}>{formatMoney(portfolioValue)}</Text>
              <View style={styles.plRow}>
                <Text
                  style={[
                    styles.plText,
                    { color: totalPL >= 0 ? Colors.accent.green : Colors.accent.red },
                  ]}
                >
                  {formatMoney(totalPL, true)} ({formatPercent(plPct)})
                </Text>
              </View>
            </View>
          </View>
          <SectionHeader icon="📈" title="LIVE STOCKS" accent={Colors.accent.blue} />
        </View>
      }
      renderItem={({ item }) => (
        <StockCard
          stock={item}
          money={money}
          canBuy={(shares) => money >= item.currentPrice * shares}
          onBuy={(shares) => handleBuy(item.id, shares)}
          onSell={(shares) => handleSell(item.id, shares)}
        />
      )}
      ListFooterComponent={
        <View>
          <SectionHeader icon="📊" title="MUTUAL FUNDS" accent={Colors.accent.cyan} />
          {mutualFunds.map((fund) => (
            <View key={fund.id} style={styles.fundCard}>
              <View style={styles.fundInfo}>
                <Text style={styles.fundName}>{fund.name}</Text>
                <Text style={styles.fundDesc}>{fund.description}</Text>
                <View style={styles.fundStats}>
                  <View style={styles.fundStat}>
                    <Text style={styles.fundStatLabel}>INVESTED</Text>
                    <Text style={styles.fundStatValue}>{formatMoney(fund.invested)}</Text>
                  </View>
                  <View style={styles.fundStat}>
                    <Text style={styles.fundStatLabel}>CURRENT</Text>
                    <Text style={[styles.fundStatValue, { color: Colors.accent.green }]}>
                      {formatMoney(fund.currentValue)}
                    </Text>
                  </View>
                  <View style={styles.fundStat}>
                    <Text style={styles.fundStatLabel}>RETURN</Text>
                    <Text style={[styles.fundStatValue, { color: Colors.accent.gold }]}>
                      {formatPercent(fund.annualReturn, 0)}/yr
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.fundActions}>
                <TouchableOpacity
                  onPress={() => handleInvestFund(fund.id)}
                  style={[styles.fundBtn, styles.fundBtnBuy]}
                >
                  <Text style={styles.fundBtnText}>+10%</Text>
                </TouchableOpacity>
                {fund.currentValue > 0 && (
                  <TouchableOpacity
                    onPress={() => handleWithdrawFund(fund.id)}
                    style={[styles.fundBtn, styles.fundBtnSell]}
                  >
                    <Text style={[styles.fundBtnText, { color: '#fff' }]}>SELL</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          <View style={{ height: 24 }} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24 },
  header: { padding: 16 },
  portfolioCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91,141,239,0.2)',
  },
  portLabel: {
    color: Colors.text.muted,
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 5,
  },
  portValue: { color: Colors.accent.platinum, fontFamily: Fonts.displayBlack, fontSize: 28, letterSpacing: -0.5 },
  plRow: { marginTop: 5 },
  plText: { fontFamily: Fonts.monoSemi, fontSize: 14 },
  sectionTitle: {
    color: Colors.text.secondary,
    fontFamily: Fonts.displaySemi,
    fontSize: 13,
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  fundCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Hairline.soft,
  },
  fundInfo: { flex: 1 },
  fundName: { color: Colors.text.primary, fontFamily: Fonts.displaySemi, fontSize: 15 },
  fundDesc: { color: Colors.text.muted, fontFamily: Fonts.body, fontSize: 11, marginTop: 3, marginBottom: 8 },
  fundStats: { flexDirection: 'row', gap: 12 },
  fundStat: {},
  fundStatLabel: {
    color: Colors.text.muted,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 3,
  },
  fundStatValue: { color: Colors.text.primary, fontFamily: Fonts.monoSemi, fontSize: 13 },
  fundActions: { gap: 8, marginLeft: 12 },
  fundBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 50,
  },
  fundBtnBuy: { backgroundColor: Colors.accent.green },
  fundBtnSell: { backgroundColor: Colors.accent.red },
  fundBtnText: { color: '#0E1422', fontFamily: Fonts.bodyExtra, fontSize: 12 },
});
