"""Integration tests: admin experiment jobs (Bearer ADMIN_API_KEY)."""

import time

import pytest

from app.core import config
from app.experiments import jobs


@pytest.fixture(autouse=True)
def _clear_jobs():
    jobs.clear_job_store_for_tests()
    yield
    jobs.clear_job_store_for_tests()


@pytest.mark.integration
def test_admin_smoke_disabled_without_key(client, monkeypatch):
    monkeypatch.setattr(config.settings, "admin_api_key", None)
    r = client.post("/api/v1/admin/experiments/smoke-score/run", headers={"Authorization": "Bearer x"})
    assert r.status_code == 503


@pytest.mark.integration
def test_admin_smoke_rejects_bad_token(client, monkeypatch):
    monkeypatch.setattr(config.settings, "admin_api_key", "secret")
    r = client.post("/api/v1/admin/experiments/smoke-score/run", headers={"Authorization": "Bearer wrong"})
    assert r.status_code == 403


@pytest.mark.integration
def test_admin_smoke_enqueue_and_poll(client, monkeypatch):
    monkeypatch.setattr(config.settings, "admin_api_key", "secret")
    r = client.post("/api/v1/admin/experiments/smoke-score/run", headers={"Authorization": "Bearer secret"})
    assert r.status_code == 200
    job_id = r.json()["job_id"]
    assert job_id

    deadline = time.monotonic() + 5.0
    last = None
    while time.monotonic() < deadline:
        last = client.get(
            f"/api/v1/admin/experiments/jobs/{job_id}",
            headers={"Authorization": "Bearer secret"},
        )
        if last.status_code != 200:
            break
        body = last.json()
        if body["status"] in ("succeeded", "failed"):
            break
        time.sleep(0.05)

    assert last is not None and last.status_code == 200
    data = last.json()
    assert data["status"] == "succeeded"
    assert data["result"]["experiment"] == "smoke-score"
    assert "grounding_score" in data["result"]
