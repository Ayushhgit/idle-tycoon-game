import React, { useCallback } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { PropertyCard } from '../components/PropertyCard';
import { StatTile } from '../components/ui/StatTile';
import { SectionHeader } from '../components/ui/SectionHeader';
import { formatMoney, formatIncomePerSec } from '../utils/formatters';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';

export function PropertyScreen() {
  const properties = useGameStore((s) => s.properties);
  const money = useGameStore((s) => s.money);
  const buyProperty = useGameStore((s) => s.buyProperty);
  const upgradeProperty = useGameStore((s) => s.upgradeProperty);
  const { purchaseHaptic, errorHaptic } = useHaptics();

  const ownedProperties = properties.filter((p) => p.owned);
  const totalRent = ownedProperties.reduce((sum, p) => sum + p.rentPerSec * p.level, 0);
  const totalValue = ownedProperties.reduce((sum, p) => sum + p.currentValue, 0);

  const handleBuy = useCallback(
    (id: string) => {
      const ok = buyProperty(id);
      if (ok) purchaseHaptic();
      else errorHaptic();
    },
    [buyProperty]
  );

  const handleUpgrade = useCallback(
    (id: string) => {
      const ok = upgradeProperty(id);
      if (ok) purchaseHaptic();
      else errorHaptic();
    },
    [upgradeProperty]
  );

  return (
    <FlatList
      data={properties}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          <View style={styles.statsRow}>
            <StatTile
              label="RENT/SEC"
              icon="💵"
              value={formatIncomePerSec(totalRent)}
              accent={Colors.accent.green}
            />
            <StatTile
              label="VALUE"
              icon="🏙️"
              value={formatMoney(totalValue)}
              accent={Colors.accent.blue}
            />
            <StatTile
              label="OWNED"
              icon="🔑"
              value={`${ownedProperties.length}/${properties.length}`}
              accent={Colors.accent.gold}
            />
          </View>
          <SectionHeader icon="🏙️" title="REAL ESTATE" accent={Colors.property.hotel} />
        </View>
      }
      renderItem={({ item }) => (
        <PropertyCard
          property={item}
          money={money}
          onBuy={() => handleBuy(item.id)}
          onUpgrade={() => handleUpgrade(item.id)}
        />
      )}
      ListFooterComponent={<View style={{ height: 24 }} />}
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
    gap: 10,
  },
});
