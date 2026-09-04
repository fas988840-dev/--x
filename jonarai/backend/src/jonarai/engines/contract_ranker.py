"""Contract-ranking engine.

From ``JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md`` §6 and
``JONARAI_BUILD_ROADMAP.md`` Phase P: after directional confirmation,
scans eligible SPXW 0DTE contracts and produces a ranked list with
per-contract scores.

Blocked on architect items in ``docs/BLOCKED_ON_ARCHITECT.md``:
* The ranking formula itself (spec §6 lists inputs but not the
  weighting).
* Slippage estimate formula.
"""

from __future__ import annotations

from typing import Never

from jonarai.domain.entities import ContractSnapshot

from .base import Engine


class ContractRanker(Engine[tuple[ContractSnapshot, ...], tuple[ContractSnapshot, ...]]):
    """Ranks candidate contracts by execution quality + expected risk."""

    name = "ContractRanker"
    blocker = "Ranking formula (input weights) + slippage estimate formula"

    def compute(self, inputs: tuple[ContractSnapshot, ...]) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
