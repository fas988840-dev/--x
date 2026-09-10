"""Provider adapter interface.

Every provider exposes a subset of :class:`ProviderCapability`. Engines
ask the :class:`~jonarai.providers.registry.ProviderRegistry` for a
provider that offers the capability they need — never for a provider
by name.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from enum import Enum


class ProviderCapability(str, Enum):
    """The data feeds a provider can serve."""

    SPX_TICKS = "SPX_TICKS"
    SPX_BARS = "SPX_BARS"
    OPTIONS_CHAIN = "OPTIONS_CHAIN"
    OPTIONS_TRADES = "OPTIONS_TRADES"
    GREEKS = "GREEKS"
    FLOW = "FLOW"
    GAMMA_LEVELS = "GAMMA_LEVELS"
    IV_SURFACE = "IV_SURFACE"


class DataProvider(ABC):
    """Base class for every data-provider adapter."""

    #: Short name for logs and registry keys.
    name: str = "provider"

    #: The capabilities this provider offers.
    capabilities: frozenset[ProviderCapability] = frozenset()

    @abstractmethod
    async def healthcheck(self) -> bool:
        """Return True iff the provider is reachable and returning fresh data."""
        raise NotImplementedError

    @abstractmethod
    async def close(self) -> None:
        """Release any open sockets/connections."""
        raise NotImplementedError
