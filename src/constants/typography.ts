// ─────────────────────────────────────────────────────────────────────────
// Type system — Sora (geometric display), Manrope (refined body),
// IBM Plex Mono (terminal numerics). Loaded in app/_layout.tsx.
// Custom fonts ship one file per weight, so reference families by exact name
// instead of relying on fontWeight (which is ignored for named families).
// ─────────────────────────────────────────────────────────────────────────
export const Fonts = {
  // display — headlines, brand, big balances
  display: 'Sora_700Bold',
  displayBlack: 'Sora_800ExtraBold',
  displaySemi: 'Sora_600SemiBold',
  displayMedium: 'Sora_500Medium',
  // body — labels, descriptions, buttons
  body: 'Manrope_500Medium',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyExtra: 'Manrope_800ExtraBold',
  // mono — prices, tickers, precise figures
  mono: 'IBMPlexMono_500Medium',
  monoSemi: 'IBMPlexMono_600SemiBold',
} as const;

// Convenience presets for the most common roles.
export const Type = {
  // eyebrow / overline labels (uppercase, tracked)
  overline: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
  },
  // section / card titles
  title: {
    fontFamily: Fonts.displaySemi,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  // hero numeric readout
  hero: {
    fontFamily: Fonts.displayBlack,
    letterSpacing: -0.5,
  },
  // numeric figures (mono terminal feel)
  numeric: {
    fontFamily: Fonts.monoSemi,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
} as const;
