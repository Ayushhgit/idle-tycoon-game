# Idle Wealth Tycoon — Setup Guide

## Quick Start

```bash
cd C:\Users\KIIT0001\Desktop\idletycoon
npm install
npx expo start
```

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- For Android: Android Studio + emulator (or physical device with Expo Go)
- For iOS: macOS + Xcode (or Expo Go on iOS device)

## Install Dependencies

```bash
npm install
```

If you get version conflicts, use:
```bash
npx expo install --fix
```

## Environment Setup (Optional — Supabase)

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
copy .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The app works fully offline without Supabase. Cloud save and leaderboards
only activate when Supabase is configured.

## Supabase Setup (Optional)

1. Create a project at https://supabase.com
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Copy your project URL and anon key to `.env`

## Running the App

### Expo Go (fastest — no build needed)

```bash
npx expo start
```

Scan the QR code with Expo Go app on your phone.

### Android Emulator

```bash
npx expo start --android
```

### iOS Simulator (macOS only)

```bash
npx expo start --ios
```

## Building for Production

### Development Build

```bash
npx eas build --profile development --platform android
```

### Production APK (Android)

```bash
npx eas build --profile production --platform android
```

## Project Structure

```
app/              Expo Router pages
  _layout.tsx     Root layout (gesture handler + safe area)
  index.tsx       Main game screen

src/
  components/     Reusable UI components
  screens/        Tab screen content
  store/          Zustand game state
  types/          TypeScript interfaces
  constants/      Game data (businesses, stocks, etc.)
  utils/          Helpers (formatters, calculations)
  hooks/          Custom React hooks
  services/       Supabase + Audio services
  systems/        Game logic systems
  config/         Supabase client config
  lib/            AsyncStorage wrapper

assets/           App icons + splash screen
supabase/         SQL schema
```

## Troubleshooting

### Metro bundler cache

```bash
npx expo start --clear
```

### Package version mismatch

```bash
npx expo install --fix
```

### TypeScript errors

```bash
npx tsc --noEmit
```
