"""Data-integrity failsafe.

From ``JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md`` §17: checks
DATA_FRESHNESS, TIMESTAMP_SYNC, MISSING_FIELDS, OUTLIERS,
WEBSOCKET_STATUS, PROVIDER_STATUS, QUOTE_AGE. On critical failure,
sets ``ENTRY_DISABLED = TRUE`` and, for an existing position,
switches to a predefined safe-management policy.

Unlike other engines this one is **safe to implement partially** —
the "refuse to score on any missing check" default is spec-compliant
even before the architect names the last threshold. Still stubbed
until the architect confirms the exact fail thresholds.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Never

from .base import Engine


@dataclass(frozen=True, slots=True)
class DataIntegrityReport:
    entries_disabled: bool
    failing_checks: tuple[str, ...]


class DataIntegrityEngine(Engine[object, DataIntegrityReport]):
    name = "DataIntegrityEngine"
    blocker = "Fail thresholds per check (max quote age, max WS-heartbeat gap, ...)"

    def compute(self, inputs: object) -> Never:
        raise self._not_yet_implemented()

    def reasoning(self) -> Never:
        raise self._not_yet_implemented()
