"""Entry engine — drives the SCAN → WATCH → ARMED → CONFIRMED → ENTRY state machine.

From ``JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md`` §5 (Elite Entry Gate) and
§7 (Entry State Machine).

.. warning::

    The engine **must never** jump from ``SCAN`` directly to ``ENTRY``.
    Guardrail #1 (``CLAUDE.md``) forbids collapsing the pipeline.

Blocked on architect items in ``docs/BLOCKED_ON_ARCHITECT.md``:
* Transition conditions between states.
* Time-to-Prove default windows per session regime.
* The full list of mandatory gates and how each is evaluated.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Never

from jonarai.domain.entities import EntrySignal, EntryState, JonaraiScore, OptionContract

from .base import Engine


@dataclass(frozen=True, slots=True)
class EntryEngineInput:
    contract: OptionContract
    score: JonaraiScore
    now_utc: datetime
    current_state: EntryState


class EntryEngine(Engine[EntryEngineInput, EntrySignal | None]):
    """Advances a candidate through the entry state machine.

    Returns None if the candidate has not reached ``ENTRY`` — the
    caller should not treat that as a bug.
    """

    name = "EntryEngine"
    blocker = "State transition conditions + mandatory gate list + Time-to-Prove windows"

    def compute(self, inputs: EntryEngineInput) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
