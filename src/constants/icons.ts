import { Ionicons } from '@expo/vector-icons';
import { TabName } from '../types/game';

type IoniconName = keyof typeof Ionicons.glyphMap;

// Line iconography for the whole app — monochrome, tinted by context.
export const TabIcons: Record<TabName, { active: IoniconName; inactive: IoniconName; label: string }> = {
  tap:      { active: 'finger-print',        inactive: 'finger-print',         label: 'Tap' },
  business: { active: 'business',            inactive: 'business-outline',     label: 'Business' },
  stocks:   { active: 'trending-up',         inactive: 'trending-up',          label: 'Markets' },
  property: { active: 'home',                inactive: 'home-outline',         label: 'Estate' },
  luxury:   { active: 'diamond',             inactive: 'diamond-outline',      label: 'Luxury' },
  casino:   { active: 'dice',                inactive: 'dice-outline',         label: 'Casino' },
  prestige: { active: 'sparkles',            inactive: 'sparkles-outline',     label: 'Elite' },
};

export const Icons = {
  gems: 'diamond' as IoniconName,
  settings: 'settings-outline' as IoniconName,
  income: 'arrow-up' as IoniconName,
  chevron: 'chevron-forward' as IoniconName,
  close: 'close' as IoniconName,
  lock: 'lock-closed' as IoniconName,
  check: 'checkmark-circle' as IoniconName,
  up: 'arrow-up-circle' as IoniconName,
  down: 'arrow-down-circle' as IoniconName,
  cart: 'add-circle' as IoniconName,
  bolt: 'flash' as IoniconName,
  timer: 'time-outline' as IoniconName,
  trophy: 'trophy' as IoniconName,
  stat: 'stats-chart' as IoniconName,
  wallet: 'wallet-outline' as IoniconName,
  fund: 'pie-chart' as IoniconName,
  wheel: 'sync-circle' as IoniconName,
} as const;
