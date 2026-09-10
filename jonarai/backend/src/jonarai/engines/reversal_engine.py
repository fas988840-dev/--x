"""Reversal-anticipation engine.

From ``JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md`` §15: outputs
``REVERSAL_RISK`` 0-100 plus a tier
(``LOW / MODERATE / HIGH / CRITICAL_REVERSAL_RISK``).

Blocked on architect items:
* Divergence-input weights.
* Tier-boundary thresholds.
"""

from __future__ import annotations

from typing import Never

from jonarai.domain.entities import ReversalRiskTier

from .base import Engine


class ReversalEngine(Engine[object, tuple[int, ReversalRiskTier]]):
    name = "ReversalEngine"
    blocker = "Divergence weights + tier-boundary thresholds"

    def compute(self, inputs: object) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
