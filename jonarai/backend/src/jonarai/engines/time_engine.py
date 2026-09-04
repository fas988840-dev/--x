"""Time Intelligence engine — P0 (highest priority).

From ``JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md`` §2: because JONARAI
targets 0DTE, the same directional signal at 10:00 AM is not
equivalent to the same signal near close due to changing theta, gamma,
liquidity, and contract behavior. This engine models time as a
first-class signal.

Outputs (per spec §2):
* Current :class:`~jonarai.domain.entities.SessionRegime`.
* ``TIME_QUALITY`` component score (0–100).
* Time-based reasoning strings.

Blocked on architect items in ``docs/BLOCKED_ON_ARCHITECT.md``:
* Session-regime boundary definitions (exact minute cutoffs per class).
* ``TIME_QUALITY`` sub-scoring formula.
* Theta-acceleration curve.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Never

from jonarai.domain.entities import ComponentScore, SessionRegime

from .base import Engine


@dataclass(frozen=True, slots=True)
class TimeEngineInput:
    now_utc: datetime
    market_open_utc: datetime
    market_close_utc: datetime
    option_expiry_utc: datetime


@dataclass(frozen=True, slots=True)
class TimeEngineOutput:
    regime: SessionRegime
    time_quality: ComponentScore
    minutes_to_close: int
    minutes_to_expiry: int


class TimeEngine(Engine[TimeEngineInput, TimeEngineOutput]):
    """Deterministic time-context engine.

    .. note::

        This is a **stub**. Every method raises
        :class:`~jonarai.domain.errors.SpecNotYetProvidedError` until
        the architect delivers the session-regime rules and the
        ``TIME_QUALITY`` scoring formula.
    """

    name = "TimeEngine"
    blocker = "Session-regime boundaries + TIME_QUALITY scoring formula"

    def compute(self, inputs: TimeEngineInput) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
