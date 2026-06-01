// ─────────────────────────────────────────────────────────────────────────
// MIDNIGHT PLATINUM — premium fintech-terminal palette.
// Blue-black canvas, platinum/silver metal, champagne gold for elite tiers,
// cool cyan as the "live" signal, refined emerald/rose for gains & losses.
// Keys are kept stable so every existing component reskins for free.
// ─────────────────────────────────────────────────────────────────────────
export const Colors = {
  bg: {
    primary: '#0B0F1A',
    secondary: '#0E1422',
    card: '#121826',
    cardAlt: '#161D2E',
    overlay: 'rgba(5,8,15,0.84)',
    glass: 'rgba(255,255,255,0.04)',
    glassBorder: 'rgba(174,183,201,0.14)',
  },
  accent: {
    // metals — the dominant identity
    platinum: '#E4E9F2',
    silver: '#AEB7C9',
    steel: '#6B7689',
    // champagne gold — reserved for elite / prestige highlights
    gold: '#CDA765',
    goldLight: '#E6CD92',
    goldDark: '#A2803E',
    // signals
    green: '#3DDC97',
    greenDark: '#22B97E',
    red: '#FF5C7A',
    redDark: '#E03E5E',
    blue: '#5B8DEF',
    blueLight: '#7BA6F5',
    purple: '#9D8CFF',
    purpleLight: '#B6A8FF',
    cyan: '#5BE1E6',
  },
  text: {
    primary: '#F2F5FA',
    secondary: 'rgba(226,232,242,0.66)',
    muted: 'rgba(174,183,201,0.46)',
    gold: '#CDA765',
    platinum: '#E4E9F2',
  },
  gradients: {
    gold: ['#E6CD92', '#CDA765'],
    goldShine: ['#F2E0AE', '#CDA765', '#A2803E'],
    platinum: ['#F4F7FC', '#C7D0DE'],
    metal: ['#D7DEEA', '#9AA4B6'],
    dark: ['#0E1422', '#0B0F1A'],
    card: ['#161D2E', '#121826'],
    green: ['#3DDC97', '#22B97E'],
    red: ['#FF6C86', '#E03E5E'],
    blue: ['#5B8DEF', '#3D6FD6'],
    purple: ['#9D8CFF', '#6F5BD6'],
    prestige: ['#7BA6F5', '#9D8CFF'],
    tap: ['#E4E9F2', '#7BA6F5'],
  },
  business: {
    lemonade: '#E6CD92',
    grocery: '#3DDC97',
    restaurant: '#FF7E8F',
    startup: '#5B8DEF',
    factory: '#8A94A6',
    ai: '#9D8CFF',
    bank: '#3DC9B0',
    space: '#7B86C9',
  },
  stock: {
    techx: '#5B8DEF',
    autocorp: '#FF7E8F',
    green: '#3DDC97',
    ai: '#9D8CFF',
    quantum: '#5BE1E6',
  },
  property: {
    apartment: '#8A94A6',
    villa: '#3DDC97',
    hotel: '#FFA07A',
    mall: '#7B86C9',
    skyscraper: '#E6CD92',
  },
  luxury: {
    car: '#FF7E8F',
    watch: '#E6CD92',
    yacht: '#5B8DEF',
    jet: '#AEB7C9',
    mansion: '#9D8CFF',
  },
} as const;
