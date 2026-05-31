import React, { useCallback } from 'react';
import { FlatList, Text, StyleSheet, View } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { BusinessCard } from '../components/BusinessCard';
import { BoosterPanel } from '../components/BoosterCard';
import { StatTile } from '../components/ui/StatTile';
import { SectionHeader } from '../components/ui/SectionHeader';
import { formatIncomePerSec } from '../utils/formatters';
import { calcBusinessCost } from '../utils/calculations';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';
import { GameState } from '../types/game';

type BoosterKey = keyof GameState['boosters'];

export function BusinessScreen() {
  const businesses = useGameStore((s) => s.businesses);
  const money = useGameStore((s) => s.money);
  const gems = useGameStore((s) => s.gems);
  const passiveIncome = useGameStore((s) => s.passiveIncome);
  const lifetimeEarnings = useGameStore((s) => s.lifetimeEarnings);
  const boosters = useGameStore((s) => s.boosters);
  const buyBusiness = useGameStore((s) => s.buyBusiness);
  const upgradeBusiness = useGameStore((s) => s.upgradeBusiness);
  const activateBooster = useGameStore((s) => s.activateBooster);
  const { purchaseHaptic, errorHaptic } = useHaptics();

  const handleBuy = useCallback(
    (id: string) => {
      const ok = buyBusiness(id);
      if (ok) purchaseHaptic();
      else errorHaptic();
    },
    [buyBusiness, purchaseHaptic, errorHaptic]
  );

  const handleUpgrade = useCallback(
    (id: string) => {
      const ok = upgradeBusiness(id);
      if (ok) purchaseHaptic();
      else errorHaptic();
    },
    [upgradeBusiness, purchaseHaptic, errorHaptic]
  );

  const handleBooster = useCallback(
    (key: BoosterKey) => {
      const ok = activateBooster(key);
      if (ok) purchaseHaptic();
      else errorHaptic();
    },
    [activateBooster, purchaseHaptic, errorHaptic]
  );

  return (
    <FlatList
      data={businesses}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <StatTile
              label="PASSIVE INCOME"
              icon="📈"
              value={formatIncomePerSec(passiveIncome)}
              accent={Colors.accent.green}
            />
            <StatTile
              label="OWNED"
              icon="🏢"
              value={`${businesses.filter((b) => b.owned).length} / ${businesses.length}`}
              accent={Colors.accent.gold}
            />
          </View>
          <BoosterPanel boosters={boosters} gems={gems} onActivate={handleBooster} />
          <SectionHeader icon="🏢" title="BUSINESSES" accent={Colors.business.startup} />
        </View>
      }
      renderItem={({ item }) => {
        const isUnlocked = lifetimeEarnings >= item.unlockAt || item.owned;
        const canAfford = money >= calcBusinessCost(item);
        return (
          <BusinessCard
            business={item}
            canAfford={canAfford}
            isUnlocked={isUnlocked}
            onBuy={() => handleBuy(item.id)}
            onUpgrade={() => handleUpgrade(item.id)}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    gap: 12,
  },
});
