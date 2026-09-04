"""Options flow classification engine.

From ``JONARAI_BUILD_ROADMAP.md`` Phase H: produces a bullish/
bearish/neutral flow classification plus an ``OPTIONS_FLOW`` component
score.

Blocked on architect items in ``docs/BLOCKED_ON_ARCHITECT.md``:
* Bullish / bearish / neutral thresholds (net-premium ratios, sweep
  vs block weighting, etc.).
"""

from __future__ import annotations

from typing import Never

from jonarai.domain.entities import ComponentScore

from .base import Engine


class FlowEngine(Engine[object, ComponentScore]):
    """Classifies options flow into directional bias."""

    name = "FlowEngine"
    blocker = "Flow classification thresholds (net-premium ratios, sweep/block weights)"

    def compute(self, inputs: object) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
