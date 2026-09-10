"""Abstract base class every JONARAI engine inherits from.

Enforces three invariants at the type level:

1. **Determinism.** Subclasses implement :meth:`Engine.compute`; the
   base offers no default. Every call must return the same output for
   the same input.
2. **Reasoning.** :meth:`Engine.reasoning` returns a tuple of strings
   explaining why the last :meth:`compute` produced its output. An
   empty tuple is not allowed for a successful computation.
3. **Blocked-by-default.** :meth:`Engine.compute` on a bare subclass
   raises :class:`~jonarai.domain.errors.SpecNotYetProvidedError` until
   the architect ships the logic.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from jonarai.domain.errors import SpecNotYetProvidedError

TInput = TypeVar("TInput")
TOutput = TypeVar("TOutput")


class Engine(ABC, Generic[TInput, TOutput]):
    """Base class for every deterministic JONARAI engine.

    Concrete engines override :meth:`compute` once the architect
    supplies the corresponding logic.
    """

    #: The name the engine registers under in logs and reasoning strings.
    name: str = "engine"

    #: The exact blocker item (see ``docs/BLOCKED_ON_ARCHITECT.md``) that
    #: gates this engine's implementation.
    blocker: str = "unspecified"

    @abstractmethod
    def compute(self, inputs: TInput) -> TOutput:
        """Compute the engine's output.

        Subclasses that have not received their spec yet may implement
        this as a single call to :meth:`_not_yet_implemented`.
        """
        raise NotImplementedError

    @abstractmethod
    def reasoning(self) -> tuple[str, ...]:
        """Return the human-readable reasoning for the last compute call.

        Must be non-empty on a successful computation.
        """
        raise NotImplementedError

    def _not_yet_implemented(self) -> "SpecNotYetProvidedError":
        """Standard stub payload for engines still waiting on the architect."""
        return SpecNotYetProvidedError(engine=type(self).__name__, blocker=self.blocker)
