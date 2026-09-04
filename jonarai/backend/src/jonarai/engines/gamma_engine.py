"""Gamma / dealer-positioning engine.

From ``JONARAI_BUILD_ROADMAP.md`` Phase I: computes GEX, DEX, VEX,
CHEX, Gamma Flip, Call Wall, Put Wall, Gamma Concentration, 0DTE
Gamma, and a ``GAMMA_STRUCTURE`` component score.

Blocked on architect items in ``docs/BLOCKED_ON_ARCHITECT.md``:
* Exact formulas per metric (sign conventions vary by author).
* When gamma "supports the move" vs "warns against it".
"""

from __future__ import annotations

from typing import Never

from jonarai.domain.entities import ComponentScore

from .base import Engine


class GammaEngine(Engine[object, ComponentScore]):
    """Deterministic gamma-structure score."""

    name = "GammaEngine"
    blocker = "GEX/DEX/VEX/CHEX formulas + gamma-flip method + wall definitions"

    def compute(self, inputs: object) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
