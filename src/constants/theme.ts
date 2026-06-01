import { ViewStyle } from 'react-native';

// Spatial + material tokens for the Midnight Platinum system.
export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Hairline metal borders (silver-tinted) used across surfaces.
export const Hairline = {
  faint: 'rgba(174,183,201,0.10)',
  soft: 'rgba(174,183,201,0.16)',
  strong: 'rgba(174,183,201,0.28)',
} as const;

// Layered shadows — deep, soft, expensive-feeling.
export const Shadow: Record<'card' | 'float' | 'glow', ViewStyle> = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 20,
  },
  glow: {
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 14,
  },
};
