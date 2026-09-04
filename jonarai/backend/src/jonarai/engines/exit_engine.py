"""Early-exit engine.

From ``JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md`` §13: continuously
computes ``EXIT_RISK_SCORE`` 0-100 and recommends one of
``HOLD / TIGHTEN_STOP / PARTIAL_EXIT / EXIT_RUNNER / FULL_EXIT``.

Blocked on architect items in ``docs/BLOCKED_ON_ARCHITECT.md``:
* Signal weights for exit-risk components (momentum decel, CVD
  divergence, flow reversal, delta deterioration, IV contraction,
  VWAP failure, ...).
* Action-mapping thresholds (exit-risk 0-100 → HOLD/TIGHTEN/exit).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Never

from jonarai.domain.entities import ExitDecision, OptionContract

from .base import Engine


@dataclass(frozen=True, slots=True)
class ExitEngineInput:
    contract: OptionContract
    now_utc: datetime
    entry_time_utc: datetime


class ExitEngine(Engine[ExitEngineInput, ExitDecision]):
    """Monitors an open position for exit signals."""

    name = "ExitEngine"
    blocker = "Exit-risk component weights + action-mapping thresholds"

    def compute(self, inputs: ExitEngineInput) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
