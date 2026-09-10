"""JONARAI Score engine — composes the 0-100 selectivity score.

From ``JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md`` §4: composes
component scores (MTF, Structure, Time, Flow, Gamma, CVD, VWAP,
Liquidity, Momentum, Volatility, Contract-liquidity, Spread, R/R,
Theta, Reversal) into one integer 0-100.

.. warning::

    **The output is a selectivity score, NOT a probability of profit.**
    Guardrail #2 (``CLAUDE.md``) forbids presenting it as a win rate.

Blocked on architect items in ``docs/BLOCKED_ON_ARCHITECT.md``:
* Per-component weights.
* Sub-scoring formulas per component.
* Bucket-boundary thresholds (currently spec-defined at 80/88/93).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Never

from jonarai.domain.entities import ComponentScore, JonaraiScore

from .base import Engine


@dataclass(frozen=True, slots=True)
class ScoreEngineInput:
    components: tuple[ComponentScore, ...]
    computed_at: datetime


class ScoreEngine(Engine[ScoreEngineInput, JonaraiScore]):
    """Composes component scores into a :class:`JonaraiScore`.

    .. note::

        Stub. Raises
        :class:`~jonarai.domain.errors.SpecNotYetProvidedError` until
        the architect supplies weights and sub-scoring formulas.
    """

    name = "ScoreEngine"
    blocker = "Score weights + component sub-scoring formulas"

    def compute(self, inputs: ScoreEngineInput) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
