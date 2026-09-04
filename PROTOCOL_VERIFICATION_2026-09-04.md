# Protocol Verification — 2026-09-04

This record separates verified protocol identity from verified instruction
layouts. FactLedger must not promote a protocol to a decoded/confirmed state
because a brand name is familiar.

## Orca Whirlpools

**Program identity: VERIFIED.**

Official Orca source (`orca-so/whirlpools`, `Anchor.toml`) currently declares:

```text
whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc
```

FactLedger registers that program identity as `Orca Whirlpools`.

**Instruction/account decode: NOT YET VERIFIED.** The current registry uses an
`UnknownProtocolDecoder`, so Orca instructions remain `status=unknown` with no
invented amounts/mints until the current SDK/IDL account layout is independently
validated and covered by fixtures/tests.

Official source checked: https://github.com/orca-so/whirlpools/blob/main/Anchor.toml

## Magic Eden Solana

**Public API presence: VERIFIED.** Current Magic Eden developer documentation
publishes Solana marketplace APIs and instruction-generation endpoints under
`api-mainnet.magiceden.dev` and documents an optional/default auction-house
address parameter for marketplace operations.

**Canonical on-chain program/account layout for FactLedger decoding: NOT
VERIFIED from the current official documentation reviewed.** The public docs do
not provide enough evidence here to safely hard-code a single Magic Eden
program ID and decode layout as FactLedger's canonical marketplace adapter.
Therefore no Magic Eden on-chain adapter is registered yet.

This is intentional. Magic Eden is also a marketplace rather than a DEX, so a
future adapter belongs in a broader protocol/activity registry rather than being
forced into `DexRegistry` merely to add a logo.

Official sources checked:
- https://docs.magiceden.io/reference/solana-overview
- https://docs.magiceden.io/reference/get_instructions-buy-now
- https://docs.magiceden.io/reference/solana-api-keys

## Promotion rule

A future adapter may move from UNKNOWN only after all of the following are
verified against current official source/IDL/SDK:

1. program ID;
2. instruction discriminator/type;
3. account ordering/roles;
4. amount/mint extraction;
5. fixture transactions or deterministic test vectors.

Until then, FactLedger reports the gap instead of guessing.
