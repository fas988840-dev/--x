"""Volatility engine — ATM IV, Expected Move, IV Rank, IV Percentile, Skew, Term Structure.

Blocked on architect items in ``docs/BLOCKED_ON_ARCHITECT.md``:
* IV-Rank / IV-Percentile lookback window.
* Expected-Move calculation method.
* Skew definition.
"""

from __future__ import annotations

from typing import Never

from jonarai.domain.entities import ComponentScore

from .base import Engine


class VolatilityEngine(Engine[object, ComponentScore]):
    name = "VolatilityEngine"
    blocker = "IV-Rank window + Expected-Move method + Skew definition"

    def compute(self, inputs: object) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
