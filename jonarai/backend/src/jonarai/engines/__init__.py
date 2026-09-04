"""Engine layer.

Every engine in this package is a **stub** — it raises
:class:`~jonarai.domain.errors.SpecNotYetProvidedError` from every
public method until the architect (ChatGPT) supplies the corresponding
spec content and numeric constants.

The stubs exist because:

* Their public shape (constructor, method names, return types) is
  already fixed by ``JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md``.
* Downstream code (the entry orchestrator, the API layer, the tests)
  needs to compile against those shapes now, so filling in the
  architect's logic later is a body-swap, not a redesign.
* The ``NotImplementedError`` is the enforcement mechanism for
  Guardrail #3: nobody can accidentally ship an engine with invented
  numbers.
"""

from .base import Engine

__all__ = ["Engine"]
