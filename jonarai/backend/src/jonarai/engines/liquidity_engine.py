"""Liquidity intelligence engine — VWAP, POC, HVN, LVN, Gamma Flip,
Call Wall, Put Wall, Liquidity Pools, Opening Range, Expected Move,
Previous High/Low → interaction zones.

Blocked on architect items:
* Zone-merging rules (when two nearby levels combine).
* Confidence-per-zone formula.
"""

from __future__ import annotations

from typing import Never

from jonarai.domain.entities import ComponentScore

from .base import Engine


class LiquidityEngine(Engine[object, ComponentScore]):
    name = "LiquidityEngine"
    blocker = "Zone-merging rules + per-zone confidence formula"

    def compute(self, inputs: object) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
