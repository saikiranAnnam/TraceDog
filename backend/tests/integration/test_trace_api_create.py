"""Integration tests: POST /api/v1/traces"""

import pytest

from tests.fixtures.sample_trace_payloads import INVALID_PAYLOAD_MISSING_FIELDS, SUPPORTED_RESPONSE


@pytest.mark.integration
def test_create_trace_returns_200_and_payload(client):
    r = client.post("/api/v1/traces", json=SUPPORTED_RESPONSE)
    assert r.status_code == 200
    data = r.json()
    assert "trace_id" in data
    assert data["status"] == "processed"
    assert "reliability_score" in data
    assert "grounding_score" in data
    assert "hallucination_risk" in data
    assert "explanation" in data
    assert data["explanation"]


@pytest.mark.integration
def test_create_trace_validation_error(client):
    r = client.post("/api/v1/traces", json=INVALID_PAYLOAD_MISSING_FIELDS)
    assert r.status_code == 422


@pytest.mark.integration
def test_create_trace_with_ingest_metadata(client):
    body = {
        **SUPPORTED_RESPONSE,
        "ingest_metadata": {
            "run_type": "evaluation",
            "dataset_name": "squad_v2",
            "case_id": "test-1",
            "experiment_name": "unit",
        },
    }
    r = client.post("/api/v1/traces", json=body)
    assert r.status_code == 200
    tid = r.json()["trace_id"]
    d = client.get(f"/api/v1/traces/{tid}").json()
    assert d["ingest_metadata"]["case_id"] == "test-1"
