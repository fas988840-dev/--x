# Security Policy

## Supported Versions

FactLedger is pre-1.0 and has a single active line of development. There
is no version history to maintain security patches across yet — the
version below is the only one in use.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

This table will be updated once a 1.0 release establishes a real support
policy across versions.

## Reporting a Vulnerability

Please report suspected vulnerabilities privately rather than opening a
public issue, using GitHub's [private security advisory feature](../../security/advisories/new)
for this repository (Security tab → Report a vulnerability). This keeps
the report confidential until a fix is available.

Include, if known: the affected file/endpoint, a reproduction case, and
the potential impact. There is no fixed SLA for response yet — this is
an early-stage, pre-launch project — but every report will be acknowledged.

## Scope Notes

- This platform is **read-only**: it never requests, stores, or handles
  private keys, seed phrases, or wallet-signing credentials, and it never
  signs or submits transactions. Reports involving those categories are
  automatically in scope and high priority, since their presence at all
  would itself be a bug (see `CLAUDE.md`'s "Read-only, no signing, no
  secrets" invariant).
- API key authentication (`API_KEYS` env var, see `README.md`) is opt-in
  and **not enabled by default** — this is a known, documented tradeoff
  for local-development convenience, not something that needs reporting.
  Deployers are responsible for setting `API_KEYS` (and any other
  production hardening) before exposing an instance publicly.
