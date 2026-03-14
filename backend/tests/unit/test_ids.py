"""Unit tests: app.utils.ids"""

import uuid

from app.utils.ids import new_trace_id


def test_new_trace_id_is_uuid_v4_string():
    tid = new_trace_id()
    assert len(tid) == 36
    parsed = uuid.UUID(tid)
    assert parsed.version == 4


def test_new_trace_ids_are_unique():
    ids = {new_trace_id() for _ in range(100)}
    assert len(ids) == 100
