"""Enforcement test: every engine must be a stub until the architect ships its spec.

This test is the mechanical enforcement of Guardrail #3 (``CLAUDE.md``):
"Never hardcode weights that ChatGPT has not signed off on." If any
engine's :meth:`compute` returns a value instead of raising
:class:`~jonarai.domain.errors.SpecNotYetProvidedError`, this test
fails — proving somebody added trading logic without the architect
resolving the corresponding item in ``docs/BLOCKED_ON_ARCHITECT.md``.

Remove or narrow this test **only** when the architect's spec for that
particular engine lands.
"""

from __future__ import annotations

import inspect
import pkgutil
from importlib import import_module

import pytest

from jonarai import engines
from jonarai.domain.errors import SpecNotYetProvidedError
from jonarai.engines.base import Engine


def _iter_engine_classes() -> list[type[Engine]]:
    """Walk ``jonarai.engines.*`` and collect every concrete Engine subclass."""
    found: list[type[Engine]] = []
    for module_info in pkgutil.iter_modules(engines.__path__):
        module = import_module(f"{engines.__name__}.{module_info.name}")
        for _, cls in inspect.getmembers(module, inspect.isclass):
            if (
                cls is not Engine
                and issubclass(cls, Engine)
                and cls.__module__ == module.__name__
                and not inspect.isabstract(cls)
            ):
                found.append(cls)
    return found


ENGINE_CLASSES = _iter_engine_classes()


def test_at_least_one_engine_discovered() -> None:
    """Sanity: the discovery mechanism itself finds engines."""
    assert ENGINE_CLASSES, "no Engine subclasses were discovered under jonarai.engines"


@pytest.mark.parametrize("engine_cls", ENGINE_CLASSES, ids=lambda c: c.__name__)
def test_engine_compute_raises_spec_not_yet_provided(engine_cls: type[Engine]) -> None:
    """Every engine's ``compute`` must raise ``SpecNotYetProvidedError``.

    If you are here after adding a real implementation for one engine,
    remove that engine from this parametrize list rather than deleting
    the test — the remaining stubs must still be enforced.
    """
    engine = engine_cls()
    # Any input shape works because the stub raises before touching it.
    with pytest.raises(SpecNotYetProvidedError) as excinfo:
        engine.compute(object())  # type: ignore[arg-type]

    # The error must name the engine and the exact blocker item.
    assert excinfo.value.engine == engine_cls.__name__
    assert excinfo.value.blocker == engine.blocker
    assert "BLOCKED_ON_ARCHITECT.md" in str(excinfo.value)
