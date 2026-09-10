"""HTTP API layer.

Wraps the engine layer behind FastAPI. In Phase A.1 the only endpoint
that responds is ``GET /health``; every other route documented in the
Master Spec returns a 503 with a clear message identifying the
architect blocker.
"""
