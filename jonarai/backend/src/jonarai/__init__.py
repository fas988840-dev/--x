"""JONARAI — SPX/SPXW 0DTE options trading intelligence.

Selectivity-first. TIME as P0. Confidence score, not probability.

See:
- ``jonarai/README.md``           for the product overview.
- ``jonarai/docs/JONARAI_MASTER_SPEC.md`` for the binding spec index.
- ``jonarai/CLAUDE.md``           for the ten Design Guardrails.

.. warning::

    All ``jonarai.engines.*`` engine classes are **stubs** until the
    architect (ChatGPT) supplies the corresponding trading logic and
    numeric constants. Calling any engine method raises
    :class:`~jonarai.domain.errors.SpecNotYetProvidedError`. See
    ``jonarai/docs/BLOCKED_ON_ARCHITECT.md`` for the exact list of items
    the architect must resolve.
"""

from __future__ import annotations

__version__ = "0.1.0"
__all__ = ["__version__"]
