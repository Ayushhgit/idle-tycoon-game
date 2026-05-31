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
import { useGameStore } from '../store/gameStore';
import { formatMoney } from '../utils/formatters';
import { calcPrestigeTokens, calcPrestigeRequirement } from '../utils/calculations';
import { Colors } from '../constants/colors';
import { GameConfig } from '../constants/gameConfig';
import { useHaptics } from '../hooks/useHaptics';
import { Confetti } from '../components/Confetti';

const { width } = Dimensions.get('window');

export function PrestigeScreen() {
  const prestigeData = useGameStore((s) => s.prestigeData);
  const netWorth = useGameStore((s) => s.netWorth);
  const performPrestige = useGameStore((s) => s.performPrestige);
  const { achievementHaptic } = useHaptics();
  const [confettiTrigger, setConfettiTrigger] = useState(0);

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
      '✨ PRESTIGE',
      `Reset your progress for ${tokens} Prestige Tokens?\n\nYou keep: Achievements, Gems, Permanent bonuses.\n\nYour income multiplier and tap power increase permanently!`,
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

  const currentTokens = prestigeData.tokens;
  const nextTapBoost = 1 + (currentTokens + tokens) * GameConfig.prestige.tapBoostPerToken;
  const nextIncomeBoost = 1 + (currentTokens + tokens) * GameConfig.prestige.incomeBoostPerToken;

  const PRESTIGE_PERKS = [
    {
      label: 'Tap Multiplier',
      current: `${prestigeData.permanentTapMultiplier.toFixed(2)}x`,
      after: `${nextTapBoost.toFixed(2)}x`,
      emoji: '👆',
      color: Colors.accent.gold,
    },
    {
      label: 'Income Multiplier',
      current: `${prestigeData.permanentIncomeMultiplier.toFixed(2)}x`,
      after: `${nextIncomeBoost.toFixed(2)}x`,
      emoji: '💰',
      color: Colors.accent.green,
    },
    {
      label: 'Stock Luck',
      current: `+${(prestigeData.permanentStockLuck * 100).toFixed(1)}%`,
      after: `+${((currentTokens + tokens) * GameConfig.prestige.stockLuckPerToken * 100).toFixed(1)}%`,
      emoji: '📈',
      color: Colors.accent.blue,
    },
  ];

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['rgba(255,109,0,0.18)', 'transparent']}
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
          <LinearGradient colors={['#FF8A3D', '#FF3D00']} style={StyleSheet.absoluteFill} />
          <Text style={styles.prestigeEmoji}>✨</Text>
        </View>
        <Text style={styles.prestigeCount}>PRESTIGE {prestigeData.count}</Text>
        <View style={styles.tokenChip}>
          <Text style={styles.tokenChipText}>💠 {prestigeData.tokens} Tokens</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PERMANENT BONUSES</Text>
        {PRESTIGE_PERKS.map((perk) => (
          <View key={perk.label} style={styles.perkRow}>
            <View style={[styles.perkIconChip, { backgroundColor: perk.color + '22', borderColor: perk.color + '44' }]}>
              <Text style={styles.perkEmoji}>{perk.emoji}</Text>
            </View>
            <Text style={styles.perkLabel}>{perk.label}</Text>
            <View style={styles.perkValues}>
              <View style={[styles.perkPill, { backgroundColor: perk.color + '1A' }]}>
                <Text style={[styles.perkCurrent, { color: perk.color }]}>{perk.current}</Text>
              </View>
              {canPrestige && (
                <>
                  <Text style={styles.arrow}>→</Text>
                  <View style={[styles.perkPill, { backgroundColor: perk.color + '33' }]}>
                    <Text style={[styles.perkAfter, { color: perk.color }]}>{perk.after}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PRESTIGE REQUIREMENTS</Text>
        <View style={styles.requireCard}>
          <LinearGradient
            colors={['rgba(255,109,0,0.1)', 'rgba(255,61,0,0.05)']}
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
          colors={canPrestige ? ['#FF6D00', '#FF3D00'] : ['#333', '#222']}
          style={styles.prestigeGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.prestigeBtnText}>
            {canPrestige
              ? `✨ PRESTIGE (+${tokens} tokens)`
              : `🔒 Need ${formatMoney(requirement)}`}
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
              colors={['#FF6D00', '#FF3D00']}
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
    backgroundColor: '#FF6D00',
    opacity: 0.18,
  },
  glowOrbInner: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FF3D00',
    opacity: 0.35,
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
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFAB40',
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
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 16,
  },
  prestigeEmoji: { fontSize: 50 },
  prestigeCount: {
    color: Colors.text.primary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    zIndex: 10,
    marginTop: 14,
  },
  tokenChip: {
    zIndex: 10,
    marginTop: 8,
    backgroundColor: 'rgba(213,0,249,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(213,0,249,0.4)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  tokenChipText: { color: Colors.accent.purpleLight, fontSize: 14, fontWeight: '800' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '800',
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
    borderColor: 'rgba(255,255,255,0.06)',
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
  perkLabel: { flex: 1, color: Colors.text.secondary, fontWeight: '700', fontSize: 14 },
  perkValues: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  perkPill: {
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  perkCurrent: { fontWeight: '800', fontSize: 14 },
  arrow: { color: Colors.text.muted, fontSize: 13 },
  perkAfter: { fontWeight: '900', fontSize: 14 },
  requireCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,109,0,0.2)',
  },
  reqLabel: { color: Colors.text.muted, fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  reqValue: { color: Colors.text.primary, fontWeight: '800', fontSize: 22, marginBottom: 12 },
  yourLabel: { color: Colors.text.muted, fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  yourValue: { fontWeight: '900', fontSize: 24, marginBottom: 12 },
  rewardPreview: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  rewardLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  rewardValue: { color: Colors.accent.gold, fontWeight: '800', fontSize: 16, marginBottom: 4 },
  prestigeBtn: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  prestigeBtnDisabled: { opacity: 0.5 },
  prestigeGrad: { paddingVertical: 20, alignItems: 'center' },
  prestigeBtnText: { color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },
  progressSection: { paddingHorizontal: 16, marginBottom: 20 },
  progressLabel: { color: Colors.text.muted, fontSize: 12, marginBottom: 8 },
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
