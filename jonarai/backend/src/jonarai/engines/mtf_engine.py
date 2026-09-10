"""Multi-timeframe alignment engine.

From ``JONARAI_BUILD_ROADMAP.md`` Phase K: combines Weekly / Daily /
1H / 15M / 5M into an ``MTF_ALIGNMENT`` component score (0-100).

Blocked on architect items in ``docs/BLOCKED_ON_ARCHITECT.md``:
* Trend/structure definitions per timeframe.
* Weight per timeframe.
* Conflict penalty formula.
"""

from __future__ import annotations

from typing import Never

from jonarai.domain.entities import ComponentScore

from .base import Engine


class MtfEngine(Engine[object, ComponentScore]):
    """Deterministic multi-timeframe alignment score."""

    name = "MtfEngine"
    blocker = "MTF alignment rules (weights per TF, trend/structure defs, conflict penalty)"

    def compute(self, inputs: object) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
