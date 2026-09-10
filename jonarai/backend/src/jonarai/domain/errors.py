"""Domain errors used across the JONARAI backend.

These are the shapes the API layer maps to HTTP status codes; every
error stays semantic (never a bare ``Exception``).
"""

from __future__ import annotations


class JonaraiError(Exception):
    """Base class for every JONARAI-raised error."""


class SpecNotYetProvidedError(JonaraiError, NotImplementedError):
    """Raised by every engine stub until the architect supplies the spec.

    Subclasses ``NotImplementedError`` so the test harness in
    ``tests/test_engines_are_stubs.py`` can assert the "no engine
    implements anything yet" invariant with a standard exception type.

    The message always references the exact blocker section in
    ``docs/BLOCKED_ON_ARCHITECT.md`` so a caller (or a log reader)
    knows what is missing.
    """

    def __init__(self, engine: str, blocker: str) -> None:
        super().__init__(
            f"{engine!s} is not implemented yet. "
            f"Blocked on architect item: {blocker!r}. "
            f"See jonarai/docs/BLOCKED_ON_ARCHITECT.md."
        )
        self.engine = engine
        self.blocker = blocker


class DataIntegrityError(JonaraiError):
    """Raised when critical data quality fails per Master Spec §2.6.

    The engine must refuse to emit an entry signal when this is raised.
    """


class ValidationError(JonaraiError):
    """Raised when a domain object fails validation (e.g. bad symbol)."""


class ProviderError(JonaraiError):
    """Raised when a data provider adapter fails."""

    def __init__(self, provider: str, detail: str) -> None:
        super().__init__(f"provider {provider!r} failed: {detail}")
        self.provider = provider
        self.detail = detail
