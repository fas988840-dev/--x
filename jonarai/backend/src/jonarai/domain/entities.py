"""Domain entities.

Only the fields the architect has explicitly named in
``JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md`` are modeled here. No invented
attributes; when the architect later names more, they land here.

Every numeric domain value that represents money or a Greek stays as a
:class:`~decimal.Decimal` — never a :class:`float` — to preserve
precision (mirrors FactLedger's "Preserve precision for on-chain
amounts" invariant, applied to trading premiums here).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Literal


# ---------------------------------------------------------------------------
# Session regimes — from Time/Entry Spec §2
# ---------------------------------------------------------------------------


class SessionRegime(str, Enum):
    """Classification of the current intraday market session."""

    PREMARKET = "PREMARKET"
    OPENING_AUCTION = "OPENING_AUCTION"
    OPENING_EXPANSION = "OPENING_EXPANSION"
    MORNING_TREND = "MORNING_TREND"
    MIDDAY = "MIDDAY"
    AFTERNOON_EXPANSION = "AFTERNOON_EXPANSION"
    POWER_HOUR = "POWER_HOUR"
    CLOSING_RISK = "CLOSING_RISK"


# ---------------------------------------------------------------------------
# Entry state machine — from Time/Entry Spec §7
# ---------------------------------------------------------------------------


class EntryState(str, Enum):
    """States a candidate trade traverses. Never skip a state."""

    SCAN = "SCAN"
    WATCH = "WATCH"
    ARMED = "ARMED"
    CONFIRMED = "CONFIRMED"
    ENTRY = "ENTRY"
    MANAGE = "MANAGE"
    EXIT = "EXIT"


# ---------------------------------------------------------------------------
# Score buckets — from Time/Entry Spec §4 (operating policy) and §21 (calibration)
# ---------------------------------------------------------------------------

ScoreBucket = Literal[
    "NO_TRADE",       # 0-79
    "WATCH",          # 80-87
    "HIGH_QUALITY",   # 88-92
    "ELITE",          # 93-100
]

CalibrationBucket = Literal[
    "80-84",
    "85-89",
    "90-92",
    "93-95",
    "96-97",
    "98-100",
]


# ---------------------------------------------------------------------------
# Reversal / Exit risk tiers — from Time/Entry Spec §15
# ---------------------------------------------------------------------------


class ReversalRiskTier(str, Enum):
    LOW = "LOW_REVERSAL_RISK"
    MODERATE = "MODERATE_REVERSAL_RISK"
    HIGH = "HIGH_REVERSAL_RISK"
    CRITICAL = "CRITICAL_REVERSAL_RISK"


# ---------------------------------------------------------------------------
# Noise / stop-hunt classification — from Time/Entry Spec §10
# ---------------------------------------------------------------------------


class NoiseClassification(str, Enum):
    NORMAL_NOISE = "NORMAL_NOISE"
    PULLBACK = "PULLBACK"
    LIQUIDITY_SWEEP = "LIQUIDITY_SWEEP"
    POSSIBLE_STOP_HUNT = "POSSIBLE_STOP_HUNT"
    REAL_REVERSAL = "REAL_REVERSAL"


# ---------------------------------------------------------------------------
# Contract identity
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class OptionContract:
    """Identity of one SPX/SPXW option contract.

    Field list restricted to what identifies a contract; live-quote
    fields (bid/ask/greeks/etc.) live on :class:`ContractSnapshot`,
    which is populated by a provider adapter.
    """

    underlying: str            # "SPX" or "SPXW"
    expiry: datetime            # UTC
    strike: Decimal
    right: Literal["C", "P"]


@dataclass(frozen=True, slots=True)
class ContractSnapshot:
    """A point-in-time snapshot of one contract.

    Populated by a provider adapter; every field is optional so the
    snapshot can be built up incrementally. Consumers must check for
    ``None`` and refuse to score a contract whose critical fields are
    missing (data-integrity failsafe, Master Spec §2.6).
    """

    contract: OptionContract
    quote_time: datetime

    bid: Decimal | None = None
    ask: Decimal | None = None
    mid: Decimal | None = None
    last: Decimal | None = None
    bid_size: int | None = None
    ask_size: int | None = None
    volume: int | None = None
    open_interest: int | None = None

    # Greeks — architect will confirm which are provider-supplied vs.
    # derived by us in Phase G.
    delta: Decimal | None = None
    gamma: Decimal | None = None
    theta: Decimal | None = None
    vega: Decimal | None = None
    rho: Decimal | None = None
    vanna: Decimal | None = None
    charm: Decimal | None = None

    iv: Decimal | None = None


# ---------------------------------------------------------------------------
# Score — from Time/Entry Spec §4 and §Q of the roadmap
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class ComponentScore:
    """One component that contributes to :class:`JonaraiScore`."""

    name: str                  # e.g. "MTF_ALIGNMENT", "TIME_QUALITY"
    value: int                 # 0..100
    weight: Decimal | None = None  # architect-provided weight; None until supplied
    reasoning: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True, slots=True)
class JonaraiScore:
    """The composite JONARAI selectivity score.

    .. warning::

        This is a **selectivity score**, not a probability of profit.
        The Master Spec §2.1 forbids presenting it otherwise.
    """

    score: int                 # 0..100
    bucket: ScoreBucket
    components: tuple[ComponentScore, ...]
    computed_at: datetime
    reasoning: tuple[str, ...]

    def __post_init__(self) -> None:  # pragma: no cover — trivial guard
        if not 0 <= self.score <= 100:
            from .errors import ValidationError
            raise ValidationError(f"JonaraiScore.score out of range: {self.score}")


# ---------------------------------------------------------------------------
# Entry / exit signals — the outward-facing shapes the API returns.
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class EntrySignal:
    """A confirmed entry signal.

    Emitted only when the full pipeline has cleared:
    ``Score → Gates → Time → Contract → Entry State Machine → ENTRY``.
    Every field the caller needs to act is present.
    """

    contract: OptionContract
    state: EntryState
    score: JonaraiScore
    session_regime: SessionRegime
    entry_range_low: Decimal | None
    entry_range_high: Decimal | None
    spx_invalidation_level: Decimal | None
    option_execution_stop: Decimal | None
    targets: tuple[Decimal, ...]
    time_to_prove_seconds: int | None
    reversal_risk: int          # 0..100
    exit_risk: int              # 0..100
    reversal_tier: ReversalRiskTier
    reasoning: tuple[str, ...]
    generated_at: datetime


@dataclass(frozen=True, slots=True)
class NoTradeDecision:
    """A veto record. Emitted whenever ``ENTRY`` was suppressed.

    ``NO TRADE`` is a first-class output (Master Spec §2.3). This record
    exists so the reason is auditable, not silent.
    """

    veto_reasons: tuple[str, ...]
    would_have_scored: int | None
    session_regime: SessionRegime
    generated_at: datetime


@dataclass(frozen=True, slots=True)
class ExitDecision:
    """An exit-management action recommendation."""

    action: Literal["HOLD", "TIGHTEN_STOP", "PARTIAL_EXIT", "EXIT_RUNNER", "FULL_EXIT"]
    exit_risk_score: int         # 0..100
    reversal_tier: ReversalRiskTier
    reasoning: tuple[str, ...]
    generated_at: datetime
