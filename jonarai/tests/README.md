# Tests

Actual test suites live next to the code they test:

- **Backend tests** — `../backend/tests/` (pytest)
- **Frontend tests** — `../frontend/` (vitest; nothing here yet)

This top-level `tests/` directory is reserved for later cross-cutting
tests that don't belong to a single subpackage, e.g.:

- End-to-end scenarios that boot the DB + backend + frontend.
- Backtest-methodology tests (Phase X).
- Paper-trading calibration tests (Phase Y).

None of those exist yet — those phases haven't started.
