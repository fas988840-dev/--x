"""NO-TRADE engine.

From ``JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md`` §16: ``NO TRADE`` has
equal importance to ``ENTRY``. This engine enumerates veto conditions
and, when any trigger, emits a
:class:`~jonarai.domain.entities.NoTradeDecision`.

Blocked on architect items in ``docs/BLOCKED_ON_ARCHITECT.md``:
* Numeric thresholds for each veto category (spread %, OI min, IV
  percentile ceiling, minutes-to-close cutoff, etc.).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Never

from jonarai.domain.entities import NoTradeDecision, SessionRegime

from .base import Engine


@dataclass(frozen=True, slots=True)
class NoTradeEngineInput:
    session_regime: SessionRegime
    would_have_scored: int
    now_utc: datetime
    # Additional inputs land as the architect names them.


class NoTradeEngine(Engine[NoTradeEngineInput, NoTradeDecision | None]):
    """Runs veto checks. Returns None only if every gate passes."""

    name = "NoTradeEngine"
    blocker = "Veto thresholds (spread %, min OI, IV ceiling, late-entry cutoff, ...)"

    def compute(self, inputs: NoTradeEngineInput) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
