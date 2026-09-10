"""Noise / stop-hunt classification engine.

From ``JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md`` §10: before stopping a
trade, classify the move as
``NORMAL_NOISE / PULLBACK / LIQUIDITY_SWEEP / POSSIBLE_STOP_HUNT / REAL_REVERSAL``.

Blocked on architect items:
* Classification rule per label (input combinations that yield each).
"""

from __future__ import annotations

from typing import Never

from jonarai.domain.entities import NoiseClassification

from .base import Engine


class NoiseEngine(Engine[object, NoiseClassification]):
    name = "NoiseEngine"
    blocker = "Noise/stop-hunt classification rules per label"

    def compute(self, inputs: object) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
