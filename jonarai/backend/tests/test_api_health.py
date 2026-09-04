"""Smoke test for the ``/health`` and ``/`` endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient

from jonarai.api.main import app


def test_health_endpoint() -> None:
    client = TestClient(app)
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["app"] == "jonarai"
    assert body["engines_ready"] is False
    assert "BLOCKED_ON_ARCHITECT.md" in body["note"]


def test_root_endpoint_carries_disclaimer() -> None:
    client = TestClient(app)
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert "not financial advice" in body["disclaimer"]
