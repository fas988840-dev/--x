"""Provider adapter layer.

Every data provider (SPX ticks, options chain, options flow, GEX, ...)
is accessed through an adapter that implements
:class:`~jonarai.providers.base.DataProvider`. Adapters are registered
with :class:`~jonarai.providers.registry.ProviderRegistry`; downstream
engines never import a provider directly.

This lets us swap ThetaData for Polygon (for example) without touching
engine code.

Blocked on architect items in ``docs/BLOCKED_ON_ARCHITECT.md``:
* The provider matrix (primary + backup per data class).
* Licensing decisions per provider.
"""

from .base import DataProvider, ProviderCapability
from .registry import ProviderRegistry

__all__ = ["DataProvider", "ProviderCapability", "ProviderRegistry"]
