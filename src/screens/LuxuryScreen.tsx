import React, { useCallback } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { LuxuryCard } from '../components/LuxuryCard';
import { AchievementCard } from '../components/AchievementCard';
import { StatTile } from '../components/ui/StatTile';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';
import { useAchievements } from '../hooks/useAchievements';

export function LuxuryScreen() {
  const luxuryItems = useGameStore((s) => s.luxuryItems);
  const money = useGameStore((s) => s.money);
  const buyLuxuryItem = useGameStore((s) => s.buyLuxuryItem);
  const { purchaseHaptic, errorHaptic } = useHaptics();
  const { achievements, unlockedCount, totalCount } = useAchievements();

  const ownedItems = luxuryItems.filter((l) => l.owned);
  const totalPrestige = ownedItems.reduce((sum, l) => sum + l.prestigeBonus, 0);

  const handleBuy = useCallback(
    (id: string) => {
      const ok = buyLuxuryItem(id);
      if (ok) purchaseHaptic();
      else errorHaptic();
    },
    [buyLuxuryItem]
  );

  return (
    <FlatList
      data={luxuryItems}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          <View style={styles.statsRow}>
            <StatTile
              label="ITEMS OWNED"
              icon="💎"
              value={`${ownedItems.length}/${luxuryItems.length}`}
              accent={Colors.accent.purple}
            />
            <StatTile
              label="PRESTIGE BONUS"
              icon="✨"
              value={`+${totalPrestige}`}
              accent={Colors.accent.gold}
            />
          </View>
          <SectionHeader icon="💎" title="LUXURY ASSETS" accent={Colors.accent.purple} />
        </View>
      }
      renderItem={({ item }) => (
        <LuxuryCard item={item} money={money} onBuy={() => handleBuy(item.id)} />
      )}
      ListFooterComponent={
        <View>
          <SectionHeader
            icon="🏆"
            title="ACHIEVEMENTS"
            trailing={`${unlockedCount}/${totalCount}`}
            accent={Colors.accent.gold}
          />
          {achievements.map((ach) => (
            <AchievementCard key={ach.id} achievement={ach} />
          ))}
          <View style={{ height: 24 }} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    gap: 12,
  },
});
