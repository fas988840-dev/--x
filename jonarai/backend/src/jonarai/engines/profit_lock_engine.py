"""Profit-lock engine.

From ``JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md`` §11-§12: drives the
state machine ``ENTRY → INITIAL_RISK → PROFIT_DETECTED → STOP_REDUCED
→ BREAKEVEN_ELIGIBLE → PROFIT_LOCK → TRAIL → EXIT``.

.. warning::

    Guardrail #5 (``CLAUDE.md``): never widen a stop after profit
    protection activates.

Blocked on architect items:
* State-transition trigger conditions.
* Trailing-stop distance formula.
"""

from __future__ import annotations

from enum import Enum
from typing import Never

from .base import Engine


class ProfitLockState(str, Enum):
    INITIAL_RISK = "INITIAL_RISK"
    PROFIT_DETECTED = "PROFIT_DETECTED"
    STOP_REDUCED = "STOP_REDUCED"
    BREAKEVEN_ELIGIBLE = "BREAKEVEN_ELIGIBLE"
    PROFIT_LOCK = "PROFIT_LOCK"
    TRAIL = "TRAIL"
    EXIT = "EXIT"


class ProfitLockEngine(Engine[object, ProfitLockState]):
    name = "ProfitLockEngine"
    blocker = "State-transition triggers + trailing-stop distance formula"

    def compute(self, inputs: object) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
