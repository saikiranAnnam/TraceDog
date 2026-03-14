"""Integration tests: GET /api/v1/traces"""

import pytest

from tests.fixtures.sample_trace_payloads import SUPPORTED_RESPONSE


@pytest.mark.integration
def test_list_traces_includes_created(client):
    client.post("/api/v1/traces", json=SUPPORTED_RESPONSE)
    r = client.get("/api/v1/traces")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["agent_name"] == "support-bot"
    assert "trace_id" in data[0]
