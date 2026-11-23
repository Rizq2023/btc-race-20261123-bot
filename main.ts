// Deep-dip bounce bot for btc-race-24h-20261123-0511.
//
// The idea is patience: sit in cash for almost the whole window, buy one deep
// washout when the tape is oversold, sell the bounce, then stop. The winners of
// the previous round all did exactly this (one round trip, two trades), while
// every bot that traded often bled out on the ~26 bps a full round trip costs.
//
// Entry (all three must hold on a bar's close, filled at the next open):
//   - the close sits at least 1.0% below the highest close of the last 60 bars
//     (a real washout, not minute-to-minute noise);
//   - RSI(14) is under 35 (the tape is oversold, Wilder's smoothing);
//   - this is the first or second round trip, and at least 120 bars remain
//     (never start a trade we cannot finish before the window ends).
// Exit (the whole position, whichever comes first):
//   - the position is worth 0.8% over its cost (target: covers the ~0.26% round
//     trip and banks a real gain);
//   - the position is worth 1.5% under its cost (stop: the dip was a falling
//     knife, cut it and live to trade the next one);
//   - 120 bars have passed since the buy (timeout: do not hold through a long
//     grind down).
// Sizing: the whole cash balance in one order. One symbol, one position, no
// leverage, no shorts. max_slippage_bps 100 on every order.
//
// Determinism: float64 arithmetic on + - * / only, no wall clock, no network,
// no randomness. The same bars give the same orders, run after run.

import { runBars, type Bar, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const LOOKBACK_BARS = 60;
const DIP_PCT = 1.0;
const RSI_BARS = 14;
const RSI_OVERSOLD = 35;
const TARGET_PCT = 0.8;
const STOP_PCT = 1.5;
const MAX_HOLD_BARS = 120;
const MAX_ROUND_TRIPS = 2;
const TAIL_BARS = 120;
const MAX_SLIPPAGE_BPS = 100;

// --- indicator state (one symbol) -----------------------------------------
const closes: number[] = [];
let prevClose: number | null = null;
const firstChanges: number[] = [];
let avgGain: number | null = null;
let avgLoss: number | null = null;

// --- trade state ------------------------------------------------------------
let roundTrips = 0;
let entrySeq = -1;
let bought = false;

function pushClose(bar: Bar): void {
  const c = Number(bar.c);
  closes.push(c);
  if (closes.length > LOOKBACK_BARS) closes.shift();
  if (prevClose !== null) {
    const change = c - prevClose;
    if (avgGain === null || avgLoss === null) {
      firstChanges.push(change);
      if (firstChanges.length === RSI_BARS) {
        let g = 0;
        let l = 0;
        for (const d of firstChanges) {
          if (d > 0) g += d;
          else l -= d;
        }
        avgGain = g / RSI_BARS;
        avgLoss = l / RSI_BARS;
      }
    } else {
      const up = change > 0 ? change : 0;
      const down = change < 0 ? -change : 0;
      avgGain = (avgGain * (RSI_BARS - 1) + up) / RSI_BARS;
      avgLoss = (avgLoss * (RSI_BARS - 1) + down) / RSI_BARS;
    }
  }
  prevClose = c;
}

function rsiNow(): number | null {
  if (avgGain === null || avgLoss === null) return null;
  const moved = avgGain + avgLoss;
  return moved === 0 ? 50 : (100 * avgGain) / moved;
}

function dipPct(): number | null {
  if (closes.length < LOOKBACK_BARS || prevClose === null) return null;
  let high = closes[0]!;
  for (const c of closes) if (c > high) high = c;
  return ((high - prevClose) / high) * 100;
}

await runBars({
  onBatch(state, batch) {
    for (const bar of batch.bars) {
      if (bar.symbol === SYMBOL) pushClose(bar);
    }
    if (state.warmingUp) return [];

    const held = state.positions.get(SYMBOL);
    const orders: (SellInput | BuyInput)[] = [];

    // --- exit: we hold a position -----------------------------------------
    if (held !== undefined) {
      const value = state.value(SYMBOL, held.qty);
      const cost = held.cost;
      // Compare in integers: value/cost >= 1.008  <=>  value*1000 >= cost*1008
      const atTarget = value * 1000n >= cost * 1008n;
      const atStop = value * 1000n <= cost * 985n;
      const timedOut = entrySeq >= 0 && state.seq - entrySeq >= MAX_HOLD_BARS;
      if (atTarget || atStop || timedOut) {
        orders.push({ side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS });
        if (bought) {
          roundTrips++;
          bought = false;
        }
      }
      return orders;
    }

    // --- entry: flat, looking for one deep oversold dip -------------------
    if (roundTrips >= MAX_ROUND_TRIPS) return [];
    // Do not start a trade in the tail of the window: 1440 bars total, and
    // the last batch's orders are rejected anyway.
    if (state.seq >= 1440 - TAIL_BARS) return [];
    const dip = dipPct();
    const r = rsiNow();
    if (dip === null || r === null) return [];
    if (dip < DIP_PCT || r >= RSI_OVERSOLD) return [];

    const cash = state.cash;
    if (cash < BigInt(state.hello.fees.min_notional_quote_units)) return [];
    entrySeq = state.seq;
    bought = true;
    orders.push({ side: 'buy', symbol: SYMBOL, notional_quote_units: cash, max_slippage_bps: MAX_SLIPPAGE_BPS });
    return orders;
  },
});
