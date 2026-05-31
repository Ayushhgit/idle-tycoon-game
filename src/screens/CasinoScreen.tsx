import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { CasinoResult, CasinoState } from '../types/game';
import { Colors } from '../constants/colors';
import { useHaptics } from '../hooks/useHaptics';
import { formatNumber, formatMoney } from '../utils/formatters';

const { width } = Dimensions.get('window');

const TOKEN_PACKAGES = [
  { id: 'starter',  tokens: 100,   cost: 500,    label: 'Starter',  emoji: '🎫', bonus: '' },
  { id: 'medium',   tokens: 500,   cost: 2000,   label: 'Regular',  emoji: '🎟️', bonus: '+20 free' },
  { id: 'big',      tokens: 1500,  cost: 5000,   label: 'Big',      emoji: '🃏', bonus: '+200 free' },
  { id: 'mega',     tokens: 5000,  cost: 15000,  label: 'Mega',     emoji: '🎰', bonus: '+1000 free' },
  { id: 'whale',    tokens: 20000, cost: 50000,  label: 'Whale',    emoji: '🐳', bonus: '+5000 free' },
];

const SLOT_SYMBOLS = ['🍒', '🍋', '🍇', '💎', '7️⃣', '⭐', '💰', '🎰'];

type GameTab = 'slots' | 'coinflip' | 'roulette';

export function CasinoScreen() {
  const casino = useGameStore((s) => s.casino);
  const money = useGameStore((s) => s.money);
  const buyTokens = useGameStore((s) => s.buyTokens);
  const sellTokens = useGameStore((s) => s.sellTokens);
  const playSlots = useGameStore((s) => s.playSlots);
  const playCoinFlip = useGameStore((s) => s.playCoinFlip);
  const playRoulette = useGameStore((s) => s.playRoulette);
  const { purchaseHaptic, criticalHaptic, errorHaptic } = useHaptics();

  const [activeGame, setActiveGame] = useState<GameTab>('slots');
  const [lastResult, setLastResult] = useState<CasinoResult | null>(null);
  const [showBuy, setShowBuy] = useState(false);
  const [showCashOut, setShowCashOut] = useState(false);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <CasinoHeader
        tokens={casino.tokens}
        money={money}
        onBuyPress={() => { setShowBuy((v) => !v); setShowCashOut(false); }}
        onCashOutPress={() => { setShowCashOut((v) => !v); setShowBuy(false); }}
      />

      {showBuy && (
        <BuyTokensPanel
          money={money}
          onBuy={(id) => {
            const ok = buyTokens(id);
            if (ok) { purchaseHaptic(); setShowBuy(false); }
            else errorHaptic();
          }}
        />
      )}

      {showCashOut && (
        <CashOutPanel
          tokens={casino.tokens}
          onSell={(amount) => {
            const cash = sellTokens(amount);
            if (cash > 0) { purchaseHaptic(); setShowCashOut(false); }
            else errorHaptic();
          }}
        />
      )}

      <StatsBar casino={casino} />

      <View style={styles.gameTabs}>
        {(['slots', 'coinflip', 'roulette'] as GameTab[]).map((g) => (
          <TouchableOpacity
            key={g}
            onPress={() => { setActiveGame(g); setLastResult(null); }}
            style={[styles.gameTab, activeGame === g && styles.gameTabActive]}
          >
            <Text style={styles.gameTabEmoji}>
              {g === 'slots' ? '🎰' : g === 'coinflip' ? '🪙' : '🎡'}
            </Text>
            <Text style={[styles.gameTabText, activeGame === g && styles.gameTabTextActive]}>
              {g === 'slots' ? 'SLOTS' : g === 'coinflip' ? 'COIN FLIP' : 'ROULETTE'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {lastResult && <ResultBanner result={lastResult} />}

      {activeGame === 'slots' && (
        <SlotsGame
          tokens={casino.tokens}
          onPlay={(bet) => {
            const r = playSlots(bet);
            if (r) { setLastResult(r); r.won ? criticalHaptic() : errorHaptic(); }
            else errorHaptic();
          }}
        />
      )}
      {activeGame === 'coinflip' && (
        <CoinFlipGame
          tokens={casino.tokens}
          onPlay={(bet, choice) => {
            const r = playCoinFlip(bet, choice);
            if (r) { setLastResult(r); r.won ? criticalHaptic() : errorHaptic(); }
            else errorHaptic();
          }}
        />
      )}
      {activeGame === 'roulette' && (
        <RouletteGame
          tokens={casino.tokens}
          onPlay={(bet, type, num) => {
            const r = playRoulette(bet, type, num);
            if (r) { setLastResult(r); r.won ? criticalHaptic() : errorHaptic(); }
            else errorHaptic();
          }}
        />
      )}

      {casino.history.length > 0 && (
        <HistoryPanel history={casino.history.slice(0, 8)} />
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Casino Header ───────────────────────────────────────────────────────────

function CasinoHeader({
  tokens,
  money,
  onBuyPress,
  onCashOutPress,
}: {
  tokens: number;
  money: number;
  onBuyPress: () => void;
  onCashOutPress: () => void;
}) {
  return (
    <LinearGradient
      colors={['#1a0a2e', '#2d0a4e', '#1a0a2e']}
      style={styles.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerTitle}>🎰 CASINO</Text>
          <Text style={styles.headerSub}>Tough odds • Bet smart • Cash out anytime</Text>
        </View>
        <View style={styles.tokenBadge}>
          <Text style={styles.tokenEmoji}>🎫</Text>
          <Text style={styles.tokenCount}>{formatNumber(tokens)}</Text>
          <Text style={styles.tokenLabel}>TOKENS</Text>
        </View>
      </View>
      <View style={styles.headerBtnRow}>
        <TouchableOpacity onPress={onBuyPress} style={styles.buyBtn} activeOpacity={0.85}>
          <LinearGradient
            colors={['#FFD700', '#FF8C00']}
            style={styles.buyGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buyText}>🎫 BUY</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCashOutPress}
          style={[styles.buyBtn, tokens <= 0 && styles.cashOutDisabled]}
          activeOpacity={0.85}
          disabled={tokens <= 0}
        >
          <LinearGradient
            colors={['#00E676', '#00B248']}
            style={styles.buyGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.cashOutText}>💵 CASH OUT</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

// ─── Cash Out Panel ───────────────────────────────────────────────────────────

const SELL_RATE = 2; // $ per token (buy rate is $5/token — house keeps the spread)

function CashOutPanel({
  tokens,
  onSell,
}: {
  tokens: number;
  onSell: (amount: number) => void;
}) {
  const options = [
    { label: '25%', amount: Math.floor(tokens * 0.25) },
    { label: '50%', amount: Math.floor(tokens * 0.5) },
    { label: 'ALL', amount: tokens },
  ];
  return (
    <View style={styles.buyPanel}>
      <Text style={styles.buyPanelTitle}>CASH OUT — ${SELL_RATE}/token</Text>
      <View style={styles.cashOutRow}>
        {options.map((opt) => {
          const valid = opt.amount > 0;
          return (
            <TouchableOpacity
              key={opt.label}
              onPress={() => onSell(opt.amount)}
              disabled={!valid}
              style={[styles.cashOutCard, !valid && styles.pkgCardDisabled]}
              activeOpacity={0.85}
            >
              <Text style={styles.cashOutPct}>{opt.label}</Text>
              <Text style={styles.cashOutTokens}>🎫 {formatNumber(opt.amount)}</Text>
              <View style={styles.cashOutValueBadge}>
                <Text style={styles.cashOutValue}>{formatMoney(opt.amount * SELL_RATE)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Buy Tokens Panel ─────────────────────────────────────────────────────────

function BuyTokensPanel({
  money,
  onBuy,
}: {
  money: number;
  onBuy: (id: string) => void;
}) {
  return (
    <View style={styles.buyPanel}>
      <Text style={styles.buyPanelTitle}>PURCHASE TOKENS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packagesRow}>
        {TOKEN_PACKAGES.map((pkg) => {
          const canAfford = money >= pkg.cost;
          return (
            <TouchableOpacity
              key={pkg.id}
              onPress={() => onBuy(pkg.id)}
              disabled={!canAfford}
              style={[styles.pkgCard, !canAfford && styles.pkgCardDisabled]}
            >
              <LinearGradient
                colors={canAfford ? ['#2d1a4e', '#1a0a2e'] : ['#222', '#111']}
                style={styles.pkgGrad}
              >
                <Text style={styles.pkgEmoji}>{pkg.emoji}</Text>
                <Text style={styles.pkgLabel}>{pkg.label}</Text>
                <Text style={styles.pkgTokens}>🎫 {formatNumber(pkg.tokens)}</Text>
                {pkg.bonus !== '' && (
                  <View style={styles.pkgBonus}>
                    <Text style={styles.pkgBonusText}>{pkg.bonus}</Text>
                  </View>
                )}
                <View style={[styles.pkgCostBadge, !canAfford && styles.pkgCostBadgeLocked]}>
                  <Text style={styles.pkgCost}>{formatMoney(pkg.cost)}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ casino }: { casino: CasinoState }) {
  return (
    <View style={styles.statsBar}>
      {[
        { label: 'GAMES', value: formatNumber(casino.gamesPlayed), color: Colors.accent.gold },
        { label: 'WON', value: formatNumber(casino.totalTokensWon), color: Colors.accent.green },
        { label: 'LOST', value: formatNumber(casino.totalTokensLost), color: Colors.accent.red },
        { label: 'BEST WIN', value: formatNumber(casino.biggestWin), color: Colors.accent.purple },
      ].map((s) => (
        <View key={s.label} style={styles.statItem}>
          <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
          <Text style={styles.statLabel}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Result Banner ────────────────────────────────────────────────────────────

function ResultBanner({ result }: { result: CasinoResult }) {
  const scale = useSharedValue(0.8);
  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 250 });
  }, [result]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.resultBanner, animStyle]}>
      <LinearGradient
        colors={result.won ? ['rgba(0,230,118,0.15)', 'rgba(0,230,118,0.05)'] : ['rgba(255,23,68,0.15)', 'rgba(255,23,68,0.05)']}
        style={styles.resultGrad}
      >
        <Text style={styles.resultEmoji}>{result.won ? '🎉' : '💸'}</Text>
        <View style={styles.resultInfo}>
          <Text style={[styles.resultTitle, { color: result.won ? Colors.accent.green : Colors.accent.red }]}>
            {result.won ? `+${formatNumber(result.net)} TOKENS` : `−${formatNumber(result.bet)} TOKENS`}
          </Text>
          <Text style={styles.resultDetail}>{result.detail}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Slots Game ───────────────────────────────────────────────────────────────

function SlotsGame({ tokens, onPlay }: { tokens: number; onPlay: (bet: number) => void }) {
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState(['🍒', '🍋', '🍇']);
  const [spinning, setSpinning] = useState(false);

  const reel1Y = useSharedValue(0);
  const reel2Y = useSharedValue(0);
  const reel3Y = useSharedValue(0);
  const leverRotate = useSharedValue(0);

  const spin = useCallback(() => {
    if (spinning || tokens < bet) return;
    setSpinning(true);

    leverRotate.value = withSequence(
      withTiming(30, { duration: 150 }),
      withTiming(-10, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    const spinReel = (sv: { value: number }, delay: number) => {
      sv.value = withSequence(
        withTiming(-300, { duration: 0 }),
        withTiming(0, { duration: 600 + delay, easing: Easing.out(Easing.cubic) })
      );
    };

    spinReel(reel1Y, 0);
    spinReel(reel2Y, 120);
    spinReel(reel3Y, 240);

    setTimeout(() => {
      const r1 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
      const r2 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
      const r3 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
      setReels([r1, r2, r3]);
      onPlay(bet);
      setSpinning(false);
    }, 900);
  }, [spinning, tokens, bet, onPlay]);

  const leverStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${leverRotate.value}deg` }],
  }));

  const r1Style = useAnimatedStyle(() => ({ transform: [{ translateY: reel1Y.value }] }));
  const r2Style = useAnimatedStyle(() => ({ transform: [{ translateY: reel2Y.value }] }));
  const r3Style = useAnimatedStyle(() => ({ transform: [{ translateY: reel3Y.value }] }));

  return (
    <View style={styles.gameCard}>
      <LinearGradient colors={['#1a0a2e', '#0d0020']} style={[styles.gameCardBg, { borderRadius: 20 }]} />
      <Text style={styles.gameTitle}>🎰 SLOT MACHINE</Text>

      <View style={styles.slotMachine}>
        <LinearGradient
          colors={['#2d1a4e', '#1a0a2e']}
          style={styles.slotBody}
        >
          <View style={styles.reelsRow}>
            {[r1Style, r2Style, r3Style].map((style, i) => (
              <View key={i} style={styles.reelWindow}>
                <View style={styles.reelWindowInner}>
                  <Animated.Text style={[styles.reelSymbol, style]}>{reels[i]}</Animated.Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.slotLine} />
        </LinearGradient>

        <Animated.View style={[styles.leverContainer, leverStyle]}>
          <TouchableOpacity onPress={spin} disabled={spinning || tokens < bet}>
            <LinearGradient
              colors={spinning || tokens < bet ? ['#555', '#333'] : ['#FF3D00', '#B71C1C']}
              style={styles.leverBtn}
            >
              <Text style={styles.leverText}>{spinning ? '...' : 'SPIN'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <BetControls bet={bet} onChangeBet={setBet} tokens={tokens} quick={[10, 50, 100, 500]} />

      <View style={styles.payTable}>
        <Text style={styles.payTableTitle}>PAYTABLE</Text>
        <View style={styles.payRows}>
          {[
            ['💰💰💰', '40x'],
            ['7️⃣7️⃣7️⃣', '20x'],
            ['💎💎💎', '12x'],
            ['⭐⭐⭐', '5x'],
            ['Triple only', 'pairs lose'],
          ].map(([combo, payout]) => (
            <View key={combo} style={styles.payRow}>
              <Text style={styles.payCombo}>{combo}</Text>
              <Text style={styles.payPayout}>{payout}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Coin Flip Game ───────────────────────────────────────────────────────────

function CoinFlipGame({
  tokens,
  onPlay,
}: {
  tokens: number;
  onPlay: (bet: number, choice: 'heads' | 'tails') => void;
}) {
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [flipping, setFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);

  const coinRotate = useSharedValue(0);
  const coinScale = useSharedValue(1);

  const flip = useCallback(() => {
    if (flipping || tokens < bet) return;
    setFlipping(true);
    setCoinResult(null);

    coinRotate.value = withSequence(
      withTiming(720, { duration: 800, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: 0 })
    );
    coinScale.value = withSequence(
      withTiming(1.3, { duration: 400 }),
      withTiming(1, { duration: 400 })
    );

    setTimeout(() => {
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      setCoinResult(result);
      onPlay(bet, choice);
      setFlipping(false);
    }, 850);
  }, [flipping, tokens, bet, choice, onPlay]);

  const coinStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${coinRotate.value}deg` },
      { scale: coinScale.value },
    ],
  }));

  return (
    <View style={styles.gameCard}>
      <LinearGradient colors={['#0a1a2e', '#0d1a20']} style={[styles.gameCardBg, { borderRadius: 20 }]} />
      <Text style={styles.gameTitle}>🪙 COIN FLIP</Text>
      <Text style={styles.gameSubtitle}>1.95x payout • tough 44% win chance</Text>

      <Animated.View style={[styles.coinWrapper, coinStyle]}>
        <LinearGradient
          colors={['#FFD700', '#FF8C00', '#FFD700']}
          style={styles.coin}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.coinFace}>
            {coinResult === null ? '🪙' : coinResult === 'heads' ? '👑' : '⚡'}
          </Text>
          <Text style={styles.coinLabel}>
            {coinResult === null ? '?' : coinResult.toUpperCase()}
          </Text>
        </LinearGradient>
      </Animated.View>

      <View style={styles.choiceRow}>
        {(['heads', 'tails'] as const).map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setChoice(c)}
            style={[styles.choiceBtn, choice === c && styles.choiceBtnActive]}
          >
            <Text style={styles.choiceEmoji}>{c === 'heads' ? '👑' : '⚡'}</Text>
            <Text style={[styles.choiceText, choice === c && styles.choiceTextActive]}>
              {c.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <BetControls bet={bet} onChangeBet={setBet} tokens={tokens} quick={[10, 50, 100, 500]} />

      <TouchableOpacity
        onPress={flip}
        disabled={flipping || tokens < bet}
        style={[styles.playBtn, (flipping || tokens < bet) && styles.playBtnDisabled]}
      >
        <LinearGradient
          colors={flipping || tokens < bet ? ['#333', '#222'] : ['#2979FF', '#1565C0']}
          style={styles.playBtnGrad}
        >
          <Text style={styles.playBtnText}>
            {flipping ? '🪙 Flipping...' : `🎯 FLIP (${bet} tokens)`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Roulette Game ────────────────────────────────────────────────────────────

function RouletteGame({
  tokens,
  onPlay,
}: {
  tokens: number;
  onPlay: (bet: number, type: 'red' | 'black' | 'even' | 'odd' | 'number', num?: number) => void;
}) {
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState<'red' | 'black' | 'even' | 'odd' | 'number'>('red');
  const [numberInput, setNumberInput] = useState('7');
  const [spinning, setSpinning] = useState(false);
  const [landedNumber, setLandedNumber] = useState<number | null>(null);

  const wheelRotate = useSharedValue(0);
  const ballX = useSharedValue(0);

  const spin = useCallback(() => {
    if (spinning || tokens < bet) return;
    setSpinning(true);
    setLandedNumber(null);

    wheelRotate.value = withSequence(
      withTiming(720 + Math.random() * 360, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );

    ballX.value = withRepeat(
      withTiming(10, { duration: 100, easing: Easing.linear }),
      6,
      true
    );

    setTimeout(() => {
      const landed = Math.floor(Math.random() * 37);
      setLandedNumber(landed);
      const num = betType === 'number' ? parseInt(numberInput, 10) || 7 : undefined;
      onPlay(bet, betType, num);
      setSpinning(false);
    }, 1300);
  }, [spinning, tokens, bet, betType, numberInput, onPlay]);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wheelRotate.value}deg` }],
  }));

  const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  const numberColor = landedNumber === null
    ? '#888'
    : landedNumber === 0
    ? Colors.accent.green
    : RED_NUMBERS.has(landedNumber) ? Colors.accent.red : '#fff';

  return (
    <View style={styles.gameCard}>
      <LinearGradient colors={['#0a2010', '#0d200d']} style={[styles.gameCardBg, { borderRadius: 20 }]} />
      <Text style={styles.gameTitle}>🎡 ROULETTE</Text>
      <Text style={styles.gameSubtitle}>Red/Black/Even/Odd: 1.8x • Number: 30x</Text>

      <View style={styles.rouletteCenter}>
        <Animated.View style={[styles.rouletteWheel, wheelStyle]}>
          <LinearGradient
            colors={['#1a4a1a', '#0d200d', '#1a4a1a']}
            style={styles.wheelGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.wheelEmoji}>🎡</Text>
          </LinearGradient>
        </Animated.View>
        <View style={styles.landedDisplay}>
          <Text style={styles.landedLabel}>LANDED</Text>
          <Text style={[styles.landedNumber, { color: numberColor }]}>
            {landedNumber === null ? '—' : landedNumber}
          </Text>
          {landedNumber !== null && (
            <Text style={[styles.landedColor, { color: numberColor }]}>
              {landedNumber === 0 ? '🟢 ZERO' : RED_NUMBERS.has(landedNumber) ? '🔴 RED' : '⚫ BLACK'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.betTypeGrid}>
        {(['red', 'black', 'even', 'odd'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setBetType(t)}
            style={[
              styles.betTypeBtn,
              betType === t && styles.betTypeBtnActive,
              t === 'red' && { borderColor: Colors.accent.red },
              t === 'black' && { borderColor: '#aaa' },
              t === 'even' && { borderColor: Colors.accent.blue },
              t === 'odd' && { borderColor: Colors.accent.purple },
            ]}
          >
            <LinearGradient
              colors={
                betType === t
                  ? t === 'red'   ? ['#c62828', '#b71c1c']
                  : t === 'black' ? ['#424242', '#212121']
                  : t === 'even'  ? ['#1565C0', '#0D47A1']
                  :                 ['#6A1B9A', '#4A148C']
                  : ['#1a1a2e', '#111']
              }
              style={styles.betTypeBtnGrad}
            >
              <Text style={styles.betTypeBtnText}>{t.toUpperCase()}</Text>
              <Text style={styles.betTypePayout}>1.8x</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => setBetType('number')}
        style={[styles.numberBetRow, betType === 'number' && styles.numberBetRowActive]}
      >
        <LinearGradient
          colors={betType === 'number' ? ['#FF6D00', '#E65100'] : ['#1a1a2e', '#111']}
          style={styles.numberBetGrad}
        >
          <Text style={styles.numberBetLabel}>EXACT NUMBER (30x)</Text>
          <TextInput
            value={numberInput}
            onChangeText={(v) => {
              const n = parseInt(v, 10);
              if (!isNaN(n) && n >= 0 && n <= 36) setNumberInput(String(n));
              else if (v === '') setNumberInput('');
              setBetType('number');
            }}
            keyboardType="number-pad"
            style={styles.numberInput}
            maxLength={2}
            selectTextOnFocus
          />
        </LinearGradient>
      </TouchableOpacity>

      <BetControls bet={bet} onChangeBet={setBet} tokens={tokens} quick={[5, 25, 100, 250]} />

      <TouchableOpacity
        onPress={spin}
        disabled={spinning || tokens < bet}
        style={[styles.playBtn, (spinning || tokens < bet) && styles.playBtnDisabled]}
      >
        <LinearGradient
          colors={spinning || tokens < bet ? ['#333', '#222'] : ['#2e7d32', '#1b5e20']}
          style={styles.playBtnGrad}
        >
          <Text style={styles.playBtnText}>
            {spinning ? '🎡 Spinning...' : `🎯 SPIN (${bet} tokens)`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Bet Controls ─────────────────────────────────────────────────────────────

function BetControls({
  bet,
  onChangeBet,
  tokens,
  quick,
}: {
  bet: number;
  onChangeBet: (n: number) => void;
  tokens: number;
  quick: number[];
}) {
  return (
    <View style={styles.betControls}>
      <Text style={styles.betLabel}>BET AMOUNT</Text>
      <View style={styles.betRow}>
        <TouchableOpacity
          onPress={() => onChangeBet(Math.max(1, Math.floor(bet / 2)))}
          style={styles.betAdjBtn}
        >
          <Text style={styles.betAdjText}>½</Text>
        </TouchableOpacity>
        <TextInput
          value={String(bet)}
          onChangeText={(v) => {
            const n = parseInt(v, 10);
            if (!isNaN(n) && n >= 1) onChangeBet(Math.min(n, tokens));
          }}
          keyboardType="number-pad"
          style={styles.betInput}
          selectTextOnFocus
        />
        <TouchableOpacity
          onPress={() => onChangeBet(Math.min(tokens, bet * 2))}
          style={styles.betAdjBtn}
        >
          <Text style={styles.betAdjText}>2x</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onChangeBet(tokens)}
          style={[styles.betAdjBtn, styles.betAllIn]}
        >
          <Text style={styles.betAdjText}>ALL IN</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.quickBets}>
        {quick.map((q) => (
          <TouchableOpacity
            key={q}
            onPress={() => onChangeBet(Math.min(q, tokens))}
            style={[styles.quickBet, bet === q && styles.quickBetActive]}
          >
            <Text style={[styles.quickBetText, bet === q && styles.quickBetTextActive]}>
              {formatNumber(q)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({ history }: { history: CasinoResult[] }) {
  const GAME_EMOJI: Record<string, string> = {
    slots: '🎰', coinflip: '🪙', roulette: '🎡',
  };
  return (
    <View style={styles.historyPanel}>
      <Text style={styles.historyTitle}>📋 RECENT RESULTS</Text>
      {history.map((r, i) => (
        <View key={i} style={styles.historyRow}>
          <Text style={styles.historyGameEmoji}>{GAME_EMOJI[r.game]}</Text>
          <View style={styles.historyInfo}>
            <Text style={styles.historyDetail} numberOfLines={1}>{r.detail}</Text>
          </View>
          <Text style={[styles.historyNet, { color: r.won ? Colors.accent.green : Colors.accent.red }]}>
            {r.won ? '+' : '−'}{formatNumber(Math.abs(r.net))}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },

  // Header
  header: {
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.15)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerTitle: {
    color: Colors.accent.gold,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerSub: {
    color: Colors.text.muted,
    fontSize: 11,
    marginTop: 2,
  },
  tokenBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tokenEmoji: { fontSize: 20 },
  tokenCount: { color: Colors.accent.gold, fontWeight: '900', fontSize: 18 },
  tokenLabel: { color: Colors.text.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  headerBtnRow: { flexDirection: 'row', gap: 10 },
  buyBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  buyGrad: { paddingVertical: 12, alignItems: 'center' },
  buyText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  cashOutText: { color: '#00210f', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  cashOutDisabled: { opacity: 0.4 },
  cashOutRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 4 },
  cashOutCard: {
    flex: 1,
    backgroundColor: 'rgba(0,230,118,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.25)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  cashOutPct: { color: Colors.accent.green, fontWeight: '900', fontSize: 18 },
  cashOutTokens: { color: Colors.text.secondary, fontSize: 12, fontWeight: '700' },
  cashOutValueBadge: {
    backgroundColor: 'rgba(0,230,118,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cashOutValue: { color: Colors.accent.green, fontWeight: '800', fontSize: 12 },

  // Buy panel
  buyPanel: {
    backgroundColor: Colors.bg.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  buyPanelTitle: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  packagesRow: { marginHorizontal: -4 },
  pkgCard: { marginHorizontal: 4, borderRadius: 14, overflow: 'hidden', width: 110 },
  pkgCardDisabled: { opacity: 0.4 },
  pkgGrad: { padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)', borderRadius: 14 },
  pkgEmoji: { fontSize: 28, marginBottom: 4 },
  pkgLabel: { color: Colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  pkgTokens: { color: Colors.accent.gold, fontWeight: '900', fontSize: 14, marginTop: 4 },
  pkgBonus: {
    backgroundColor: 'rgba(0,230,118,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  pkgBonusText: { color: Colors.accent.green, fontSize: 9, fontWeight: '700' },
  pkgCostBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pkgCostBadgeLocked: { backgroundColor: 'rgba(255,255,255,0.06)' },
  pkgCost: { color: Colors.accent.gold, fontWeight: '800', fontSize: 11 },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 4,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontWeight: '900', fontSize: 14 },
  statLabel: { color: Colors.text.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 2 },

  // Game tabs
  gameTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.bg.card,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  gameTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 3,
  },
  gameTabActive: { backgroundColor: 'rgba(255,215,0,0.12)' },
  gameTabEmoji: { fontSize: 20 },
  gameTabText: { color: Colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  gameTabTextActive: { color: Colors.accent.gold },

  // Result banner
  resultBanner: { marginHorizontal: 16, marginBottom: 8, borderRadius: 14, overflow: 'hidden' },
  resultGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderRadius: 14,
  },
  resultEmoji: { fontSize: 32 },
  resultInfo: { flex: 1 },
  resultTitle: { fontWeight: '900', fontSize: 18 },
  resultDetail: { color: Colors.text.muted, fontSize: 12, marginTop: 2 },

  // Game card
  gameCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  gameCardBg: { ...StyleSheet.absoluteFillObject },
  gameTitle: {
    color: Colors.text.primary,
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1,
    marginBottom: 4,
  },
  gameSubtitle: { color: Colors.text.muted, fontSize: 11, marginBottom: 16 },

  // Slots
  slotMachine: { alignItems: 'center', marginBottom: 20 },
  slotBody: {
    borderRadius: 16,
    padding: 16,
    width: width - 80,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  reelsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  reelWindow: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelWindowInner: { alignItems: 'center', justifyContent: 'center' },
  reelSymbol: { fontSize: 36 },
  slotLine: {
    height: 2,
    backgroundColor: Colors.accent.gold,
    marginTop: 4,
    opacity: 0.4,
  },
  leverContainer: { marginTop: 12, transformOrigin: 'top' },
  leverBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  leverText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 2 },
  payTable: {
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
  },
  payTableTitle: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  payRows: { gap: 4 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payCombo: { color: Colors.text.secondary, fontSize: 12 },
  payPayout: { color: Colors.accent.gold, fontWeight: '800', fontSize: 13 },

  // Coin flip
  coinWrapper: { alignSelf: 'center', marginVertical: 16 },
  coin: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFE44D',
    shadowColor: Colors.accent.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  coinFace: { fontSize: 40 },
  coinLabel: { color: '#000', fontWeight: '900', fontSize: 11, letterSpacing: 1, marginTop: 2 },
  choiceRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  choiceBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 4,
  },
  choiceBtnActive: {
    borderColor: Colors.accent.gold,
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  choiceEmoji: { fontSize: 28 },
  choiceText: { color: Colors.text.muted, fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  choiceTextActive: { color: Colors.accent.gold },

  // Roulette
  rouletteCenter: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16 },
  rouletteWheel: { alignItems: 'center', justifyContent: 'center' },
  wheelGrad: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.accent.green,
  },
  wheelEmoji: { fontSize: 52 },
  landedDisplay: { flex: 1, alignItems: 'center' },
  landedLabel: { color: Colors.text.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  landedNumber: { fontWeight: '900', fontSize: 52, lineHeight: 56 },
  landedColor: { fontWeight: '700', fontSize: 13 },
  betTypeGrid: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  betTypeBtn: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  betTypeBtnActive: { borderWidth: 2 },
  betTypeBtnGrad: { paddingVertical: 12, alignItems: 'center', gap: 2 },
  betTypeBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  betTypePayout: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  numberBetRow: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  numberBetRowActive: { borderColor: '#FF6D00' },
  numberBetGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  numberBetLabel: { color: Colors.text.primary, fontWeight: '700', fontSize: 13 },
  numberInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: Colors.text.primary,
    fontWeight: '900',
    fontSize: 18,
    textAlign: 'center',
    width: 60,
  },

  // Shared play button
  playBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  playBtnDisabled: { opacity: 0.5 },
  playBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  playBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

  // Bet controls
  betControls: { marginTop: 4 },
  betLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  betRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  betAdjBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  betAllIn: { backgroundColor: 'rgba(255,23,68,0.15)', borderColor: Colors.accent.red, borderWidth: 1 },
  betAdjText: { color: Colors.text.primary, fontWeight: '800', fontSize: 12 },
  betInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.accent.gold,
    fontWeight: '900',
    fontSize: 17,
    textAlign: 'center',
  },
  quickBets: { flexDirection: 'row', gap: 8 },
  quickBet: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  quickBetActive: { backgroundColor: 'rgba(255,215,0,0.15)' },
  quickBetText: { color: Colors.text.muted, fontWeight: '700', fontSize: 12 },
  quickBetTextActive: { color: Colors.accent.gold },

  // History
  historyPanel: {
    marginHorizontal: 16,
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    padding: 14,
  },
  historyTitle: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  historyGameEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  historyInfo: { flex: 1 },
  historyDetail: { color: Colors.text.muted, fontSize: 11 },
  historyNet: { fontWeight: '800', fontSize: 14 },
});
