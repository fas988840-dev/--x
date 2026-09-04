"""Provider registry.

Holds the process-wide mapping of provider names to their adapter
instances, and answers "which providers offer capability X". Engines
depend on this, never on a specific adapter module.

The registry starts **empty**: no provider is registered by default,
because the provider matrix is a Phase C decision the architect must
make (see ``docs/BLOCKED_ON_ARCHITECT.md``).
"""

from __future__ import annotations

from .base import DataProvider, ProviderCapability


class ProviderRegistry:
    """Process-wide, capability-indexed provider registry."""

    def __init__(self) -> None:
        self._providers: dict[str, DataProvider] = {}

    def register(self, provider: DataProvider) -> None:
        """Register a provider under its ``name``. Idempotent by name."""
        if provider.name in self._providers:
            raise ValueError(f"provider {provider.name!r} is already registered")
        self._providers[provider.name] = provider

    def unregister(self, name: str) -> None:
        self._providers.pop(name, None)

    def all_providers(self) -> tuple[DataProvider, ...]:
        return tuple(self._providers.values())

    def for_capability(self, capability: ProviderCapability) -> tuple[DataProvider, ...]:
        """Return every registered provider that advertises ``capability``.

        Engines pick the first (primary) and fall back to the next
        (backup) — the ordering is registration order.
        """
        return tuple(p for p in self._providers.values() if capability in p.capabilities)
