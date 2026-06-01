import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../store/gameStore';
import { formatMoney, formatNumber } from '../utils/formatters';
import {
  calcPrestigeTokens,
  calcPrestigeRequirement,
  calcPrestigeUpgradeCost,
} from '../utils/calculations';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { Hairline } from '../constants/theme';
import { GameConfig } from '../constants/gameConfig';
import { PrestigeUpgradeTrack } from '../types/game';
import { useHaptics } from '../hooks/useHaptics';
import { Confetti } from '../components/Confetti';

type IoniconName = keyof typeof Ionicons.glyphMap;

const UPGRADE_DEFS: {
  track: PrestigeUpgradeTrack;
  label: string;
  blurb: string;
  icon: IoniconName;
  color: string;
}[] = [
  { track: 'income',  label: 'Income Multiplier', blurb: 'All passive income',  icon: 'trending-up',   color: '#3DDC97' },
  { track: 'tap',     label: 'Tap Power',         blurb: 'Every tap earns more', icon: 'finger-print',  color: '#E6CD92' },
  { track: 'luck',    label: 'Market Luck',       blurb: 'Better stock swings',  icon: 'sparkles',      color: '#5B8DEF' },
  { track: 'offline', label: 'Offline Earnings',  blurb: 'Idle income while away',icon: 'moon',          color: '#9D8CFF' },
];

function effectStr(track: PrestigeUpgradeTrack, p: { permanentIncomeMultiplier: number; permanentTapMultiplier: number; permanentStockLuck: number; permanentOfflineMultiplier: number }) {
  switch (track) {
    case 'income':  return `×${p.permanentIncomeMultiplier.toFixed(2)}`;
    case 'tap':     return `×${p.permanentTapMultiplier.toFixed(2)}`;
    case 'luck':    return `+${(p.permanentStockLuck * 100).toFixed(0)}%`;
    case 'offline': return `+${((p.permanentOfflineMultiplier - 1) * 100).toFixed(0)}%`;
  }
}

function perLevelStr(track: PrestigeUpgradeTrack): string {
  const per = GameConfig.prestige.upgrades[track].perLevel;
  if (track === 'income' || track === 'tap') return `+${per.toFixed(2)}× per level`;
  return `+${(per * 100).toFixed(0)}% per level`;
}

const { width } = Dimensions.get('window');

export function PrestigeScreen() {
  const prestigeData = useGameStore((s) => s.prestigeData);
  const netWorth = useGameStore((s) => s.netWorth);
  const performPrestige = useGameStore((s) => s.performPrestige);
  const buyPrestigeUpgrade = useGameStore((s) => s.buyPrestigeUpgrade);
  const { achievementHaptic, purchaseHaptic, errorHaptic } = useHaptics();
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const handleBuyUpgrade = (track: PrestigeUpgradeTrack) => {
    const ok = buyPrestigeUpgrade(track);
    ok ? purchaseHaptic() : errorHaptic();
  };

  const requirement = calcPrestigeRequirement(prestigeData.count);
  const canPrestige = netWorth >= requirement;
  const tokens = canPrestige ? calcPrestigeTokens(netWorth, prestigeData.count) : 0;

  const glow = useSharedValue(0.5);
  const rotate = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0.4, { duration: 1500 })),
      -1
    );
    rotate.value = withRepeat(withTiming(360, { duration: 10000 }), -1, false);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const handlePrestige = () => {
    if (!canPrestige) return;
    Alert.alert(
      '✦ PRESTIGE',
      `Reset your progress for ${tokens} Prestige Token${tokens === 1 ? '' : 's'}?\n\nYou keep: Achievements, Gems, and every upgrade you've bought.\n\nSpend tokens in the shop below to permanently boost income, tap, luck and offline earnings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'PRESTIGE!',
          onPress: () => {
            const ok = performPrestige();
            if (ok) {
              achievementHaptic();
              setConfettiTrigger((c) => c + 1);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['rgba(123,166,245,0.16)', 'transparent']}
        style={styles.headerBgGlow}
      />
      <View style={styles.header}>
        <Animated.View style={[styles.glowOrb, glowStyle]} />
        <Animated.View style={[styles.glowOrbInner, glowStyle]} />
        <Animated.View style={[styles.spinRing, rotateStyle]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.orbDot,
                { transform: [{ rotate: `${i * 45}deg` }, { translateY: -82 }] },
              ]}
            />
          ))}
        </Animated.View>
        <View style={styles.emojiDisc}>
          <LinearGradient colors={['#7BA6F5', '#9D8CFF']} style={StyleSheet.absoluteFill} />
          <Text style={styles.prestigeEmoji}>✦</Text>
        </View>
        <Text style={styles.prestigeCount}>PRESTIGE {prestigeData.count}</Text>
        <View style={styles.tokenChip}>
          <Ionicons name="diamond" size={13} color={Colors.accent.purpleLight} />
          <Text style={styles.tokenChipText}>{formatNumber(prestigeData.tokens)} TOKENS</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.shopHead}>
          <Text style={styles.sectionTitle}>TOKEN SHOP</Text>
          <Text style={styles.shopBalance}>Balance: {formatNumber(prestigeData.tokens)}</Text>
        </View>
        {UPGRADE_DEFS.map((def) => {
          const level = prestigeData.upgrades[def.track];
          const cfg = GameConfig.prestige.upgrades[def.track];
          const maxed = level >= cfg.maxLevel;
          const cost = calcPrestigeUpgradeCost(def.track, level);
          const canAfford = prestigeData.tokens >= cost;
          return (
            <View key={def.track} style={styles.upgradeCard}>
              <View style={[styles.upIcon, { backgroundColor: def.color + '1F', borderColor: def.color + '3A' }]}>
                <Ionicons name={def.icon} size={20} color={def.color} />
              </View>
              <View style={styles.upInfo}>
                <View style={styles.upTopRow}>
                  <Text style={styles.upName}>{def.label}</Text>
                  <View style={[styles.upLevelPill, { backgroundColor: def.color + '1F' }]}>
                    <Text style={[styles.upLevelText, { color: def.color }]}>LV {level}</Text>
                  </View>
                </View>
                <Text style={styles.upBlurb}>{def.blurb}</Text>
                <View style={styles.upStatsRow}>
                  <Text style={[styles.upValue, { color: def.color }]}>
                    {effectStr(def.track, prestigeData)}
                  </Text>
                  <Text style={styles.upPerLevel}>{perLevelStr(def.track)}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleBuyUpgrade(def.track)}
                disabled={maxed || !canAfford}
                activeOpacity={0.85}
                style={styles.upBuyBtn}
              >
                <LinearGradient
                  colors={maxed ? ['#1b2030', '#141925'] : canAfford ? [def.color, def.color + 'CC'] : ['#1b2030', '#141925']}
                  style={styles.upBuyGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {maxed ? (
                    <Text style={styles.upBuyMax}>MAX</Text>
                  ) : (
                    <>
                      <Ionicons name="diamond" size={12} color={canAfford ? '#0E1422' : Colors.text.muted} />
                      <Text style={[styles.upBuyCost, !canAfford && styles.upBuyCostDim]}>{formatNumber(cost)}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PRESTIGE REQUIREMENTS</Text>
        <View style={styles.requireCard}>
          <LinearGradient
            colors={['rgba(91,141,239,0.1)', 'rgba(157,140,255,0.05)']}
            style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
          />
          <Text style={styles.reqLabel}>Net Worth Required (×8 each prestige)</Text>
          <Text style={styles.reqValue}>{formatMoney(requirement)}</Text>
          <Text style={styles.yourLabel}>Your Net Worth</Text>
          <Text style={[styles.yourValue, { color: canPrestige ? Colors.accent.green : Colors.accent.red }]}>
            {formatMoney(netWorth)}
          </Text>
          {canPrestige && (
            <View style={styles.rewardPreview}>
              <Text style={styles.rewardLabel}>YOU WILL RECEIVE</Text>
              <Text style={styles.rewardValue}>💠 {tokens} Prestige Tokens</Text>
              <Text style={styles.rewardValue}>💎 {tokens * 10} Gems</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        onPress={handlePrestige}
        disabled={!canPrestige}
        style={[styles.prestigeBtn, !canPrestige && styles.prestigeBtnDisabled]}
      >
        <LinearGradient
          colors={canPrestige ? ['#7BA6F5', '#9D8CFF'] : ['#1b2030', '#141925']}
          style={styles.prestigeGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.prestigeBtnText}>
            {canPrestige
              ? `✦ PRESTIGE  ·  +${tokens} TOKENS`
              : `🔒 NEED ${formatMoney(requirement)}`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {!canPrestige && (
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            Progress: {Math.min(100, (netWorth / requirement) * 100).toFixed(1)}%
          </Text>
          <View style={styles.progressBg}>
            <LinearGradient
              colors={['#7BA6F5', '#9D8CFF']}
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, (netWorth / requirement) * 100)}%` as any,
                },
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
    <Confetti trigger={confettiTrigger} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBgGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  header: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#5B8DEF',
    opacity: 0.16,
  },
  glowOrbInner: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#9D8CFF',
    opacity: 0.3,
  },
  spinRing: {
    position: 'absolute',
    width: 184,
    height: 184,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#AEB7C9',
  },
  emojiDisc: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#7BA6F5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 16,
  },
  prestigeEmoji: { fontSize: 46, color: '#0E1422' },
  prestigeCount: {
    color: Colors.text.primary,
    fontFamily: Fonts.displayBlack,
    fontSize: 23,
    letterSpacing: 2,
    zIndex: 10,
    marginTop: 14,
  },
  tokenChip: {
    zIndex: 10,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(157,140,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(157,140,255,0.38)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tokenChipText: { color: Colors.accent.purpleLight, fontSize: 13, fontFamily: Fonts.monoSemi, letterSpacing: 0.5 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  shopHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  shopBalance: { color: Colors.accent.purpleLight, fontFamily: Fonts.monoSemi, fontSize: 12 },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Hairline.soft,
    gap: 12,
  },
  upIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upInfo: { flex: 1 },
  upTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  upName: { color: Colors.text.primary, fontFamily: Fonts.displaySemi, fontSize: 14 },
  upLevelPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
  upLevelText: { fontFamily: Fonts.bodyExtra, fontSize: 9.5, letterSpacing: 0.5 },
  upBlurb: { color: Colors.text.muted, fontFamily: Fonts.body, fontSize: 11, marginBottom: 5 },
  upStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  upValue: { fontFamily: Fonts.monoSemi, fontSize: 14 },
  upPerLevel: { color: Colors.text.muted, fontFamily: Fonts.body, fontSize: 10 },
  upBuyBtn: { borderRadius: 12, overflow: 'hidden' },
  upBuyGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minWidth: 70,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  upBuyCost: { color: '#0E1422', fontFamily: Fonts.monoSemi, fontSize: 14 },
  upBuyCostDim: { color: Colors.text.muted },
  upBuyMax: { color: Colors.text.muted, fontFamily: Fonts.bodyExtra, fontSize: 12, letterSpacing: 1 },
  sectionTitle: {
    color: Colors.text.muted,
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Hairline.soft,
  },
  perkIconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  perkEmoji: { fontSize: 20 },
  perkLabel: { flex: 1, color: Colors.text.secondary, fontFamily: Fonts.bodySemi, fontSize: 14 },
  perkValues: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  perkPill: {
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  perkCurrent: { fontFamily: Fonts.monoSemi, fontSize: 13 },
  arrow: { color: Colors.text.muted, fontSize: 13 },
  perkAfter: { fontFamily: Fonts.monoSemi, fontSize: 13 },
  requireCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(157,140,255,0.22)',
  },
  reqLabel: { color: Colors.text.muted, fontFamily: Fonts.body, fontSize: 11, letterSpacing: 1, marginBottom: 5 },
  reqValue: { color: Colors.text.primary, fontFamily: Fonts.monoSemi, fontSize: 22, marginBottom: 12 },
  yourLabel: { color: Colors.text.muted, fontFamily: Fonts.body, fontSize: 11, letterSpacing: 1, marginBottom: 5 },
  yourValue: { fontFamily: Fonts.monoSemi, fontSize: 24, marginBottom: 12 },
  rewardPreview: {
    borderTopWidth: 1,
    borderTopColor: Hairline.soft,
    paddingTop: 12,
  },
  rewardLabel: {
    color: Colors.text.muted,
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 8,
  },
  rewardValue: { color: Colors.accent.gold, fontFamily: Fonts.bodySemi, fontSize: 15, marginBottom: 4 },
  prestigeBtn: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  prestigeBtnDisabled: { opacity: 0.5 },
  prestigeGrad: { paddingVertical: 20, alignItems: 'center' },
  prestigeBtnText: { color: '#0E1422', fontFamily: Fonts.displayBlack, fontSize: 16, letterSpacing: 0.8 },
  progressSection: { paddingHorizontal: 16, marginBottom: 20 },
  progressLabel: { color: Colors.text.muted, fontFamily: Fonts.bodySemi, fontSize: 12, marginBottom: 8 },
  progressBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
