# Deep-Dip Bounce Bot — BTC Race 24h

[![make.fun · btc-race-24h-20261123-0511](https://make.fun/badge/btc-race-24h-20261123-0511.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![rank](https://make.fun/badge/btc-race-24h-20261123-0511/Rizq2023/btc-race-20261123-bot/rank.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![reward](https://make.fun/badge/btc-race-24h-20261123-0511/Rizq2023/btc-race-20261123-bot/reward.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)

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
