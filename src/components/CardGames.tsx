import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { useHaptics } from '../hooks/useHaptics';
import { formatNumber } from '../utils/formatters';
import { Colors } from '../constants/colors';

// ─── Card primitives ──────────────────────────────────────────────────────────

interface Card {
  rank: number; // 2..14 (11=J,12=Q,13=K,14=A)
  suit: '♠' | '♥' | '♦' | '♣';
}

const SUITS: Card['suit'][] = ['♠', '♥', '♦', '♣'];

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) deck.push({ rank, suit });
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function rankLabel(rank: number): string {
  if (rank === 14) return 'A';
  if (rank === 13) return 'K';
  if (rank === 12) return 'Q';
  if (rank === 11) return 'J';
  return String(rank);
}

function PlayingCard({ card, hidden, small }: { card?: Card; hidden?: boolean; small?: boolean }) {
  const w = small ? 38 : 46;
  const h = small ? 54 : 66;
  if (hidden || !card) {
    return (
      <View style={[styles.card, { width: w, height: h }]}>
        <LinearGradient colors={['#2d1a4e', '#1a0a2e']} style={[StyleSheet.absoluteFill, { borderRadius: 7 }]} />
        <Text style={styles.cardBack}>🎴</Text>
      </View>
    );
  }
  const red = card.suit === '♥' || card.suit === '♦';
  return (
    <View style={[styles.card, styles.cardFace, { width: w, height: h }]}>
      <Text style={[styles.cardCorner, { color: red ? '#E53935' : '#1a1a2e' }]}>{rankLabel(card.rank)}</Text>
      <Text style={[styles.cardSuit, { color: red ? '#E53935' : '#1a1a2e' }]}>{card.suit}</Text>
    </View>
  );
}

// ─── Shared bet control ───────────────────────────────────────────────────────

function BetControls({
  bet,
  setBet,
  tokens,
  disabled,
}: {
  bet: number;
  setBet: (n: number) => void;
  tokens: number;
  disabled?: boolean;
}) {
  return (
    <View style={styles.betWrap}>
      <View style={styles.betInputRow}>
        <Text style={styles.betLabel}>BET</Text>
        <TextInput
          style={styles.betInput}
          value={String(bet)}
          onChangeText={(t) => setBet(Math.max(1, parseInt(t, 10) || 1))}
          keyboardType="number-pad"
          editable={!disabled}
          selectTextOnFocus
        />
        <Text style={styles.betTokens}>🎫 {formatNumber(tokens)}</Text>
      </View>
      <View style={styles.betQuickRow}>
        {[
          { label: '½', fn: () => setBet(Math.max(1, Math.floor(bet / 2))) },
          { label: '2×', fn: () => setBet(Math.min(tokens, bet * 2)) },
          { label: '10', fn: () => setBet(10) },
          { label: '100', fn: () => setBet(Math.min(tokens, 100)) },
          { label: 'MAX', fn: () => setBet(Math.max(1, tokens)) },
        ].map((q) => (
          <TouchableOpacity key={q.label} onPress={q.fn} disabled={disabled} style={styles.betQuickBtn}>
            <Text style={styles.betQuickText}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Blackjack ────────────────────────────────────────────────────────────────

function handValue(cards: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === 14) { aces += 1; total += 11; }
    else if (c.rank >= 11) total += 10;
    else total += c.rank;
  }
  while (total > 21 && aces > 0) { total -= 10; aces -= 1; }
  return total;
}

export function BlackjackGame() {
  const tokens = useGameStore((s) => s.casino.tokens);
  const casinoStake = useGameStore((s) => s.casinoStake);
  const casinoResolve = useGameStore((s) => s.casinoResolve);
  const { tapHaptic, criticalHaptic, errorHaptic } = useHaptics();

  const [bet, setBet] = useState(10);
  const [deck, setDeck] = useState<Card[]>([]);
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [phase, setPhase] = useState<'bet' | 'player' | 'done'>('bet');
  const [message, setMessage] = useState('Place your bet and deal');
  const [msgColor, setMsgColor] = useState<string>(Colors.text.muted);

  const settle = (pl: Card[], de: Card[]) => {
    const pv = handValue(pl);
    const dv = handValue(de);
    const isNatural = pl.length === 2 && pv === 21;
    let payout = 0;
    let msg = '';
    let color: string = Colors.accent.red;

    if (pv > 21) { payout = 0; msg = `Bust! ${pv} — you lose`; }
    else if (dv > 21) { payout = bet * 2; msg = `Dealer busts ${dv} — you win!`; color = Colors.accent.green; }
    else if (isNatural && dv !== 21) { payout = Math.floor(bet * 2.5); msg = `BLACKJACK! +${payout}`; color = Colors.accent.gold; }
    else if (pv > dv) { payout = bet * 2; msg = `${pv} beats ${dv} — you win!`; color = Colors.accent.green; }
    else if (pv === dv) { payout = bet; msg = `Push (${pv}) — bet returned`; color = Colors.text.secondary; }
    else { payout = 0; msg = `${dv} beats ${pv} — you lose`; }

    casinoResolve('blackjack', bet, payout, `BJ ${pv} vs ${dv}`);
    setMessage(msg);
    setMsgColor(color);
    setPhase('done');
    if (payout > bet) criticalHaptic();
    else if (payout === 0) errorHaptic();
  };

  const deal = () => {
    if (bet > tokens) { errorHaptic(); return; }
    if (!casinoStake(bet)) { errorHaptic(); return; }
    const d = buildDeck();
    const pl = [d.pop()!, d.pop()!];
    const de = [d.pop()!, d.pop()!];
    setDeck(d);
    setPlayer(pl);
    setDealer(de);
    tapHaptic();

    if (handValue(pl) === 21) {
      // natural — dealer plays out then settle
      finishDealer(pl, de, d);
    } else {
      setPhase('player');
      setMessage('Hit or Stand?');
      setMsgColor(Colors.text.secondary);
    }
  };

  const hit = () => {
    const d = [...deck];
    const card = d.pop()!;
    const pl = [...player, card];
    setDeck(d);
    setPlayer(pl);
    tapHaptic();
    if (handValue(pl) > 21) settle(pl, dealer);
  };

  const finishDealer = (pl: Card[], de: Card[], d: Card[]) => {
    const dealerCards = [...de];
    const deckCopy = [...d];
    while (handValue(dealerCards) < 17 && deckCopy.length > 0) {
      dealerCards.push(deckCopy.pop()!);
    }
    setDealer(dealerCards);
    setDeck(deckCopy);
    settle(pl, dealerCards);
  };

  const stand = () => finishDealer(player, dealer, deck);

  const reset = () => {
    setPhase('bet');
    setPlayer([]);
    setDealer([]);
    setMessage('Place your bet and deal');
    setMsgColor(Colors.text.muted);
  };

  const showDealerHole = phase !== 'player';

  return (
    <View style={styles.gameCard}>
      <LinearGradient colors={['#0a2010', '#0d200d']} style={[styles.gameBg, { borderRadius: 20 }]} />
      <Text style={styles.gameTitle}>🃏 BLACKJACK</Text>
      <Text style={styles.gameSub}>Beat the dealer to 21 · Blackjack pays 2.5×</Text>

      {/* Dealer */}
      <Text style={styles.handLabel}>
        DEALER {phase !== 'player' && dealer.length > 0 ? `· ${handValue(dealer)}` : ''}
      </Text>
      <View style={styles.handRow}>
        {dealer.length === 0 ? (
          <PlayingCard hidden />
        ) : (
          dealer.map((c, i) => (
            <PlayingCard key={i} card={c} hidden={i === 1 && !showDealerHole} />
          ))
        )}
      </View>

      {/* Player */}
      <Text style={styles.handLabel}>
        YOU {player.length > 0 ? `· ${handValue(player)}` : ''}
      </Text>
      <View style={styles.handRow}>
        {player.length === 0 ? <PlayingCard hidden /> : player.map((c, i) => <PlayingCard key={i} card={c} />)}
      </View>

      <Text style={[styles.message, { color: msgColor }]}>{message}</Text>

      {phase === 'bet' && (
        <>
          <BetControls bet={bet} setBet={setBet} tokens={tokens} />
          <TouchableOpacity onPress={deal} style={styles.primaryBtn} activeOpacity={0.85}>
            <LinearGradient colors={['#00E676', '#00B248']} style={styles.primaryGrad}>
              <Text style={styles.primaryText}>DEAL · {bet} 🎫</Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}

      {phase === 'player' && (
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={hit} style={[styles.actionBtn, { backgroundColor: '#2979FF' }]} activeOpacity={0.85}>
            <Text style={styles.actionText}>HIT</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={stand} style={[styles.actionBtn, { backgroundColor: '#FF8C00' }]} activeOpacity={0.85}>
            <Text style={styles.actionText}>STAND</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'done' && (
        <TouchableOpacity onPress={reset} style={styles.primaryBtn} activeOpacity={0.85}>
          <LinearGradient colors={['#FFD700', '#FF8C00']} style={styles.primaryGrad}>
            <Text style={[styles.primaryText, { color: '#0a0a1a' }]}>PLAY AGAIN</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Teen Patti ───────────────────────────────────────────────────────────────

interface TPEval {
  rank: number; // 6 trail .. 1 high
  name: string;
  tiebreak: number[];
}

function evalTeenPatti(cards: Card[]): TPEval {
  const vals = cards.map((c) => c.rank).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const flush = suits.every((s) => s === suits[0]);
  const [a, b, c] = vals;

  const isTrail = a === b && b === c;
  // straight: consecutive, or A-2-3 (vals [14,3,2])
  const normalStraight = a - b === 1 && b - c === 1;
  const aceLow = a === 14 && b === 3 && c === 2;
  const straight = normalStraight || aceLow;
  const pair = a === b || b === c || a === c;

  if (isTrail) return { rank: 6, name: 'Trail', tiebreak: [a] };
  if (straight && flush) return { rank: 5, name: 'Pure Sequence', tiebreak: aceLow ? [3] : [a] };
  if (straight) return { rank: 4, name: 'Sequence', tiebreak: aceLow ? [3] : [a] };
  if (flush) return { rank: 3, name: 'Color', tiebreak: vals };
  if (pair) {
    const pairVal = a === b ? a : b === c ? b : a;
    const kicker = vals.find((v) => v !== pairVal) ?? 0;
    return { rank: 2, name: 'Pair', tiebreak: [pairVal, kicker] };
  }
  return { rank: 1, name: 'High Card', tiebreak: vals };
}

function compareTP(p: TPEval, d: TPEval): number {
  if (p.rank !== d.rank) return p.rank - d.rank;
  for (let i = 0; i < Math.max(p.tiebreak.length, d.tiebreak.length); i++) {
    const pv = p.tiebreak[i] ?? 0;
    const dv = d.tiebreak[i] ?? 0;
    if (pv !== dv) return pv - dv;
  }
  return 0;
}

// Bonus multiplier on a win, by player's hand strength.
const TP_BONUS: Record<number, number> = { 6: 8, 5: 5, 4: 3, 3: 2, 2: 1.95, 1: 1.95 };

export function TeenPattiGame() {
  const tokens = useGameStore((s) => s.casino.tokens);
  const casinoStake = useGameStore((s) => s.casinoStake);
  const casinoResolve = useGameStore((s) => s.casinoResolve);
  const { tapHaptic, criticalHaptic, errorHaptic } = useHaptics();

  const [bet, setBet] = useState(10);
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState('Place your bet and deal');
  const [msgColor, setMsgColor] = useState<string>(Colors.text.muted);
  const [playing, setPlaying] = useState(false);

  const deal = () => {
    if (bet > tokens) { errorHaptic(); return; }
    if (!casinoStake(bet)) { errorHaptic(); return; }
    const d = buildDeck();
    const pl = [d.pop()!, d.pop()!, d.pop()!];
    const de = [d.pop()!, d.pop()!, d.pop()!];
    setPlayer(pl);
    setDealer(de);
    setRevealed(true);
    setPlaying(true);
    tapHaptic();

    const pe = evalTeenPatti(pl);
    const de2 = evalTeenPatti(de);
    const cmp = compareTP(pe, de2);

    let payout = 0;
    let msg = '';
    let color: string = Colors.accent.red;
    if (cmp > 0) {
      payout = Math.floor(bet * TP_BONUS[pe.rank]);
      msg = `${pe.name} beats ${de2.name} — +${payout}!`;
      color = pe.rank >= 4 ? Colors.accent.gold : Colors.accent.green;
    } else if (cmp === 0) {
      payout = bet;
      msg = `Tie (${pe.name}) — bet returned`;
      color = Colors.text.secondary;
    } else {
      payout = 0;
      msg = `${de2.name} beats your ${pe.name}`;
    }

    casinoResolve('teenpatti', bet, payout, `TP ${pe.name} vs ${de2.name}`);
    setMessage(msg);
    setMsgColor(color);
    if (payout > bet) criticalHaptic();
    else if (payout === 0) errorHaptic();
  };

  const reset = () => {
    setPlaying(false);
    setRevealed(false);
    setPlayer([]);
    setDealer([]);
    setMessage('Place your bet and deal');
    setMsgColor(Colors.text.muted);
  };

  return (
    <View style={styles.gameCard}>
      <LinearGradient colors={['#1a0a2e', '#0d0020']} style={[styles.gameBg, { borderRadius: 20 }]} />
      <Text style={styles.gameTitle}>👑 TEEN PATTI</Text>
      <Text style={styles.gameSub}>3-card showdown · Trail pays 8× · Pure Seq 5×</Text>

      <Text style={styles.handLabel}>DEALER</Text>
      <View style={styles.handRow}>
        {dealer.length === 0
          ? [0, 1, 2].map((i) => <PlayingCard key={i} hidden />)
          : dealer.map((c, i) => <PlayingCard key={i} card={c} hidden={!revealed} />)}
      </View>

      <Text style={styles.handLabel}>YOU</Text>
      <View style={styles.handRow}>
        {player.length === 0
          ? [0, 1, 2].map((i) => <PlayingCard key={i} hidden />)
          : player.map((c, i) => <PlayingCard key={i} card={c} />)}
      </View>

      <Text style={[styles.message, { color: msgColor }]}>{message}</Text>

      {!playing ? (
        <>
          <BetControls bet={bet} setBet={setBet} tokens={tokens} />
          <TouchableOpacity onPress={deal} style={styles.primaryBtn} activeOpacity={0.85}>
            <LinearGradient colors={['#D500F9', '#7B1FA2']} style={styles.primaryGrad}>
              <Text style={styles.primaryText}>DEAL · {bet} 🎫</Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity onPress={reset} style={styles.primaryBtn} activeOpacity={0.85}>
          <LinearGradient colors={['#FFD700', '#FF8C00']} style={styles.primaryGrad}>
            <Text style={[styles.primaryText, { color: '#0a0a1a' }]}>PLAY AGAIN</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gameCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  gameBg: {},
  gameTitle: { color: Colors.text.primary, fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  gameSub: { color: Colors.text.muted, fontSize: 11, marginBottom: 14, marginTop: 2 },
  handLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
    marginTop: 4,
  },
  handRow: { flexDirection: 'row', gap: 7, marginBottom: 8, minHeight: 66 },
  card: {
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardFace: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  cardCorner: { position: 'absolute', top: 3, left: 4, fontWeight: '900', fontSize: 13 },
  cardSuit: { fontSize: 22, fontWeight: '700' },
  cardBack: { fontSize: 24 },
  message: {
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
    minHeight: 18,
  },
  betWrap: { marginBottom: 12 },
  betInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  betLabel: { color: Colors.text.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  betInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.text.primary,
    fontWeight: '800',
    fontSize: 16,
    width: 90,
    textAlign: 'center',
  },
  betTokens: { color: Colors.accent.purpleLight, fontWeight: '800', fontSize: 13, marginLeft: 'auto' },
  betQuickRow: { flexDirection: 'row', gap: 6 },
  betQuickBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  betQuickText: { color: Colors.text.secondary, fontWeight: '800', fontSize: 12 },
  primaryBtn: { borderRadius: 14, overflow: 'hidden' },
  primaryGrad: { paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, borderRadius: 13, paddingVertical: 14, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
});
