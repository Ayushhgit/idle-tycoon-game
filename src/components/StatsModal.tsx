import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { formatMoney, formatNumber } from '../utils/formatters';
import { Colors } from '../constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  rankLabel: string;
  rankEmoji: string;
  rankColor: string;
}

export function StatsModal({ visible, onClose, rankLabel, rankEmoji, rankColor }: Props) {
  const s = useGameStore();

  const ownedBusinesses = s.businesses.filter((b) => b.owned).length;
  const ownedProps = s.properties.filter((p) => p.owned).length;
  const ownedLux = s.luxuryItems.filter((l) => l.owned).length;
  const unlockedAch = s.achievements.filter((a) => a.unlocked).length;

  const groups: { title: string; rows: [string, string, string?][] }[] = [
    {
      title: 'WEALTH',
      rows: [
        ['💰 Net Worth', formatMoney(s.netWorth), Colors.accent.gold],
        ['💵 Cash', formatMoney(s.money), undefined],
        ['📈 Lifetime Earned', formatMoney(s.lifetimeEarnings), Colors.accent.green],
        ['⚡ Passive / sec', formatMoney(s.passiveIncome) + '/s', Colors.accent.green],
        ['💎 Gems', formatNumber(s.gems), Colors.accent.cyan],
      ],
    },
    {
      title: 'EMPIRE',
      rows: [
        ['👆 Total Taps', formatNumber(s.totalTaps), undefined],
        ['🏢 Businesses', `${ownedBusinesses}/${s.businesses.length}`, undefined],
        ['🏙️ Properties', `${ownedProps}/${s.properties.length}`, undefined],
        ['💎 Luxury Items', `${ownedLux}/${s.luxuryItems.length}`, undefined],
        ['🏆 Achievements', `${unlockedAch}/${s.achievements.length}`, Colors.accent.gold],
      ],
    },
    {
      title: 'PRESTIGE',
      rows: [
        ['✨ Prestiges', formatNumber(s.prestigeData.count), Colors.accent.purple],
        ['💠 Prestige Tokens', formatNumber(s.prestigeData.tokens), Colors.accent.purple],
        ['👆 Tap Multiplier', `${s.prestigeData.permanentTapMultiplier.toFixed(2)}x`, undefined],
        ['💰 Income Multiplier', `${s.prestigeData.permanentIncomeMultiplier.toFixed(2)}x`, undefined],
      ],
    },
    {
      title: 'GAMBLING',
      rows: [
        ['🎮 Casino Games', formatNumber(s.casino.gamesPlayed), undefined],
        ['🎫 Tokens Won', formatNumber(s.casino.totalTokensWon), Colors.accent.green],
        ['💀 Tokens Lost', formatNumber(s.casino.totalTokensLost), Colors.accent.red],
        ['🏅 Biggest Win', formatNumber(s.casino.biggestWin) + ' 🎫', Colors.accent.gold],
        ['🎡 Wheel Spins', formatNumber(s.wheel.totalSpins), undefined],
        ['🎟️ Lottery Tickets', formatNumber(s.lottery.ticketsBought), undefined],
        ['💸 Lottery Won', formatMoney(s.lottery.totalWon), Colors.accent.green],
      ],
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <LinearGradient colors={['#14142a', '#0a0a1a']} style={[StyleSheet.absoluteFill, { borderRadius: 28 }]} />
          <View style={styles.handle} />

          <View style={styles.rankHeader}>
            <View style={[styles.rankDisc, { backgroundColor: rankColor + '22', borderColor: rankColor + '55' }]}>
              <Text style={styles.rankEmoji}>{rankEmoji}</Text>
            </View>
            <View>
              <Text style={styles.rankLabelSmall}>YOUR RANK</Text>
              <Text style={[styles.rankLabel, { color: rankColor }]}>{rankLabel}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
            {groups.map((g) => (
              <View key={g.title} style={styles.group}>
                <Text style={styles.groupTitle}>{g.title}</Text>
                <View style={styles.groupCard}>
                  {g.rows.map(([label, value, color], i) => (
                    <View key={label} style={[styles.row, i === g.rows.length - 1 && { borderBottomWidth: 0 }]}>
                      <Text style={styles.rowLabel}>{label}</Text>
                      <Text style={[styles.rowValue, color ? { color } : null]}>{value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            <View style={{ height: 16 }} />
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,215,0,0.15)',
    paddingTop: 12,
    paddingHorizontal: 18,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  rankHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  rankDisc: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankEmoji: { fontSize: 30 },
  rankLabelSmall: { color: Colors.text.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  rankLabel: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  list: { flexGrow: 0 },
  group: { marginBottom: 16 },
  groupTitle: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  groupCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowLabel: { color: Colors.text.secondary, fontSize: 13.5, fontWeight: '600' },
  rowValue: { color: Colors.text.primary, fontSize: 14, fontWeight: '800' },
  closeBtn: {
    marginBottom: 22,
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeText: { color: Colors.text.secondary, fontWeight: '800', fontSize: 15 },
});
