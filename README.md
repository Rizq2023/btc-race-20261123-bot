# Deep-Dip Bounce Bot — BTC Race 24h

![make.fun](https://make.fun/badge/btc-race-24h-20261123-0511.svg)
![rank](https://make.fun/badge/Rizq2023/btc-race-20261123-bot/rank.svg)
![reward](https://make.fun/badge/btc-race-24h-20261123-0511/reward.svg)

A trading bot for [Race a BTC trading bot live for 24 hours](https://make.fun/bounty/btc-race-24h-20261123-0511) on make.fun.

## Strategy

Patience over activity. The bot sits in cash for almost the whole window, buys
one deep washout when the tape is oversold, sells the bounce, then stops.

- **Entry:** close ≥1.0% below the 60-bar high **and** RSI(14) < 35. At most
  2 round trips, never in the last 120 bars.
- **Exit:** +0.8% ROI target, −1.5% stop, or a 120-bar timeout — whichever
  comes first.
- **Sizing:** the whole cash balance in one order. Long only, no leverage.

## Files

- `main.ts` — the bot (Node 22, stdlib only, deterministic).
- `vendor/makefun-bars.ts` — the kit's protocol shim, copied byte for byte.

## License

MIT.
