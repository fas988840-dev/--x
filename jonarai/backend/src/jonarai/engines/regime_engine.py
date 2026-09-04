"""Market-regime classification engine.

From ``JONARAI_BUILD_ROADMAP.md`` Phase L. Classes: TREND UP, TREND
DOWN, RANGE, BREAKOUT, REVERSAL, GAMMA PIN, GAMMA EXPANSION, HIGH VOL,
LOW VOL.

Blocked on: architect classification logic per regime.
"""

from __future__ import annotations

from enum import Enum
from typing import Never

from .base import Engine


class MarketRegime(str, Enum):
    TREND_UP = "TREND_UP"
    TREND_DOWN = "TREND_DOWN"
    RANGE = "RANGE"
    BREAKOUT = "BREAKOUT"
    REVERSAL = "REVERSAL"
    GAMMA_PIN = "GAMMA_PIN"
    GAMMA_EXPANSION = "GAMMA_EXPANSION"
    HIGH_VOL = "HIGH_VOL"
    LOW_VOL = "LOW_VOL"


class RegimeEngine(Engine[object, MarketRegime]):
    name = "RegimeEngine"
    blocker = "Regime classification logic (per-class predicates + priority)"

    def compute(self, inputs: object) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
