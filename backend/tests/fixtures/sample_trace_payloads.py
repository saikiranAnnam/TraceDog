"""Reusable trace payloads for unit and integration tests."""

from app.schemas.trace import RetrievedDoc, TraceCreate

# --- Dicts (API / JSON) ---

SUPPORTED_RESPONSE = {
    "agent_name": "support-bot",
    "environment": "dev",
    "prompt": "What is the refund window?",
    "response": "Refunds are processed within seven days after manager approval.",
    "model_name": "gpt-4",
    "latency_ms": 500,
    "retrieved_docs": [
        {
            "doc_id": "policy-1",
            "content": "All refunds require manager approval. Processing takes up to seven days.",
        }
    ],
}

UNSUPPORTED_RESPONSE = {
    "agent_name": "support-bot",
    "environment": "dev",
    "prompt": "Refund timing?",
    "response": "Refunds complete in two hours guaranteed.",
    "model_name": "gpt-4",
    "latency_ms": 300,
    "retrieved_docs": [
        {
            "doc_id": "policy-1",
            "content": "Refunds require manager approval and may take up to seven days.",
        }
    ],
}

EMPTY_DOCS = {
    "agent_name": "support-bot",
    "environment": "dev",
    "prompt": "Hello",
    "response": "Hello, how can I help?",
    "model_name": "gpt-4",
    "latency_ms": 100,
    "retrieved_docs": [],
}

LONG_RESPONSE = {
    "agent_name": "support-bot",
    "environment": "staging",
    "prompt": "Summarize policy",
    "response": " ".join(["refund"] * 80)
    + " manager approval seven days policy terms apply customer service.",
    "model_name": "gpt-4",
    "latency_ms": 2000,
    "retrieved_docs": [
        {
            "doc_id": "long-doc",
            "content": "Refunds need manager approval. Seven business days processing. " * 5,
        }
    ],
}

INVALID_PAYLOAD_MISSING_FIELDS = {
    "agent_name": "x",
    # missing prompt, response, etc.
}


def trace_create_supported() -> TraceCreate:
    return TraceCreate(**SUPPORTED_RESPONSE)


def trace_create_unsupported() -> TraceCreate:
    return TraceCreate(**UNSUPPORTED_RESPONSE)


def trace_create_empty_docs() -> TraceCreate:
    return TraceCreate(**EMPTY_DOCS)


def trace_create_long() -> TraceCreate:
    return TraceCreate(**LONG_RESPONSE)


def sample_retrieved_docs() -> list[RetrievedDoc]:
    return [
        RetrievedDoc(doc_id="a", content="alpha beta gamma"),
        RetrievedDoc(doc_id="b", content="delta epsilon"),
    ]
