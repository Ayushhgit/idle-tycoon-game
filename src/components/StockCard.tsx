import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stock } from '../types/game';
import { StockChart } from './StockChart';
import { formatMoney, formatPercent } from '../utils/formatters';
import { calcStockProfitLoss, calcStockProfitLossPct } from '../utils/calculations';
import { Colors } from '../constants/colors';

interface Props {
  stock: Stock;
  canBuy: (shares: number) => boolean;
  onBuy: (shares: number) => void;
  onSell: (shares: number) => void;
}

export const StockCard = memo(function StockCard({ stock, canBuy, onBuy, onSell }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [sharesInput, setSharesInput] = useState('1');

  const priceChange =
    stock.priceHistory.length >= 2
      ? (stock.currentPrice - stock.priceHistory[0]) / stock.priceHistory[0]
      : 0;

  const up = priceChange >= 0;
  const moveColor = up ? Colors.accent.green : Colors.accent.red;
  const profitLoss = calcStockProfitLoss(stock);
  const profitPct = calcStockProfitLossPct(stock);
  const shares = parseInt(sharesInput, 10) || 1;
  const cost = stock.currentPrice * shares;
  const affordable = canBuy(shares);
  const owned = stock.sharesOwned > 0;

  return (
    <View style={[styles.card, { borderColor: moveColor + '2E' }]}>
      <LinearGradient
        colors={[moveColor + '14', 'rgba(255,255,255,0.015)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.rail, { backgroundColor: moveColor }]} />

      <TouchableOpacity onPress={() => setExpanded((e) => !e)} activeOpacity={0.9}>
        <View style={styles.header}>
          <View style={styles.leftInfo}>
            <View style={styles.tickerRow}>
              <View style={[styles.tickerChip, { backgroundColor: stock.color + '22', borderColor: stock.color + '55' }]}>
                <Text style={[styles.ticker, { color: stock.color }]}>{stock.ticker}</Text>
              </View>
              <Text style={styles.sector}>{stock.sector}</Text>
            </View>
            <Text style={styles.stockName} numberOfLines={1}>{stock.name}</Text>
          </View>

          <View style={styles.rightInfo}>
            <Text style={styles.price}>${formatMoney(stock.currentPrice).replace('$', '')}</Text>
            <View style={[styles.changePill, { backgroundColor: moveColor + '22' }]}>
              <Text style={[styles.changeArrow, { color: moveColor }]}>{up ? '▲' : '▼'}</Text>
              <Text style={[styles.change, { color: moveColor }]}>
                {formatPercent(priceChange).replace('+', '')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.chartRow}>
          <StockChart data={stock.priceHistory} color={moveColor} width={210} height={48} />
          {owned && (
            <View style={styles.plBlock}>
              <Text style={styles.plLabel}>{stock.sharesOwned} SH · P/L</Text>
              <Text style={[styles.plValue, { color: profitLoss >= 0 ? Colors.accent.green : Colors.accent.red }]}>
                {formatMoney(profitLoss, true)}
              </Text>
              <Text style={[styles.plPct, { color: profitPct >= 0 ? Colors.accent.green : Colors.accent.red }]}>
                {formatPercent(profitPct)}
              </Text>
            </View>
          )}
        </View>

        {!expanded && (
          <Text style={styles.tapHint}>Tap to trade ›</Text>
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.tradeSection}>
          <View style={styles.inputRow}>
            <Text style={styles.sharesLabel}>SHARES</Text>
            <TextInput
              style={styles.sharesInput}
              value={sharesInput}
              onChangeText={setSharesInput}
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
            />
            <View style={styles.costBadge}>
              <Text style={styles.totalCost}>{formatMoney(cost)}</Text>
            </View>
          </View>

          <View style={styles.quickBtns}>
            {[1, 5, 10, 100].map((q) => (
              <TouchableOpacity key={q} onPress={() => setSharesInput(String(q))} style={styles.quickBtn}>
                <Text style={styles.quickBtnText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => onBuy(shares)}
              disabled={!affordable}
              activeOpacity={0.85}
              style={[styles.tradeBtn, !affordable && styles.disabledBtn]}
            >
              <LinearGradient colors={['#00E676', '#00B248']} style={styles.tradeGrad}>
                <Text style={styles.tradeBtnText}>BUY</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSell(shares)}
              disabled={stock.sharesOwned < shares}
              activeOpacity={0.85}
              style={[styles.tradeBtn, stock.sharesOwned < shares && styles.disabledBtn]}
            >
              <LinearGradient colors={['#FF5252', '#C62828']} style={styles.tradeGrad}>
                <Text style={styles.tradeBtnText}>SELL</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: 18,
    marginVertical: 6,
    marginHorizontal: 16,
    padding: 14,
    paddingLeft: 17,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  rail: { position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leftInfo: { flex: 1 },
  tickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tickerChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  ticker: { fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  sector: { color: Colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  stockName: { color: Colors.text.primary, fontWeight: '800', fontSize: 15 },
  rightInfo: { alignItems: 'flex-end' },
  price: { color: Colors.text.primary, fontWeight: '900', fontSize: 19 },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 3,
  },
  changeArrow: { fontSize: 9, fontWeight: '900' },
  change: { fontSize: 12, fontWeight: '800' },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  plBlock: { alignItems: 'flex-end' },
  plLabel: { color: Colors.text.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  plValue: { fontWeight: '900', fontSize: 14 },
  plPct: { fontSize: 11, fontWeight: '700' },
  tapHint: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  tradeSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sharesLabel: { color: Colors.text.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  sharesInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.text.primary,
    fontWeight: '800',
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
  costBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  totalCost: { color: Colors.accent.gold, fontWeight: '900', fontSize: 14 },
  quickBtns: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  quickBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quickBtnText: { color: Colors.text.secondary, fontWeight: '800', fontSize: 13 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  tradeBtn: { flex: 1, borderRadius: 13, overflow: 'hidden' },
  tradeGrad: { paddingVertical: 13, alignItems: 'center' },
  disabledBtn: { opacity: 0.4 },
  tradeBtnText: { color: '#06210f', fontWeight: '900', fontSize: 14, letterSpacing: 1.5 },
});
