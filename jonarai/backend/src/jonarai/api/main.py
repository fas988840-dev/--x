"""FastAPI application entry point.

Only ``GET /health`` responds meaningfully right now. Every other
future endpoint (scan, score, entry, exit, alerts, evidence, ...) is
either not registered yet or registered as a placeholder that returns
a 503 with a clear architect-blocker message.

This exists so the API surface is deployable and observable from Phase
A.1 onward, without pretending any trading logic is available.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI

from jonarai import __version__

# Module-level so uvicorn can find it as ``jonarai.api.main:app``.
app = FastAPI(
    title="JONARAI API",
    version=__version__,
    description=(
        "JONARAI — SPX/SPXW 0DTE options trading intelligence. "
        "Selectivity-first; TIME as P0. Confidence score, not probability. "
        "This build is Phase A.1: scaffold only. No engine responds yet."
    ),
    docs_url="/docs",
    redoc_url=None,
    openapi_url="/openapi.json",
)


# The single always-fresh endpoint. Never depends on the DB or a provider.
@app.get("/health", tags=["meta"])
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "app": "jonarai",
        "version": __version__,
        "phase": "A.1 — scaffold",
        "engines_ready": False,
        "note": (
            "All trading engines are stubs. "
            "See jonarai/docs/BLOCKED_ON_ARCHITECT.md."
        ),
    }


@app.get("/", tags=["meta"])
async def root() -> dict[str, Any]:
    return {
        "message": (
            "JONARAI API — Phase A.1 scaffold. "
            "See /health for status and /docs for the OpenAPI surface. "
            "Trading endpoints will land once the architect delivers the "
            "corresponding spec content."
        ),
        "disclaimer": (
            "JONARAI outputs are trading intelligence, not financial "
            "advice. Options trading carries substantial risk of loss."
        ),
    }
