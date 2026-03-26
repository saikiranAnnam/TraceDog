"""Integration tests: GET /api/v1/traces/{id}"""

import pytest

from tests.fixtures.sample_trace_payloads import SUPPORTED_RESPONSE


@pytest.mark.integration
def test_detail_returns_full_trace(client):
    create = client.post("/api/v1/traces", json=SUPPORTED_RESPONSE)
    tid = create.json()["trace_id"]
    r = client.get(f"/api/v1/traces/{tid}")
    assert r.status_code == 200
    data = r.json()
    assert data["trace_id"] == tid
    assert data["prompt"] == SUPPORTED_RESPONSE["prompt"]
    assert data["response"] == SUPPORTED_RESPONSE["response"]
    assert data["retrieved_docs"]
    assert data["retrieved_docs"][0].get("similarity_score") is not None
    assert "explanation" in data
    assert data["explanation"]
    assert "spans" in data
    assert isinstance(data["spans"], list)
    assert len(data["spans"]) >= 1


@pytest.mark.integration
def test_detail_unknown_404(client):
    r = client.get("/api/v1/traces/00000000-0000-0000-0000-000000000099")
    assert r.status_code == 404
