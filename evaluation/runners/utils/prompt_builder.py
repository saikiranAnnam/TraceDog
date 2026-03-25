"""Controlled QA prompt: context + question + abstention instruction (SQuAD 2.0 friendly)."""

from __future__ import annotations

from typing import Any


def build_prompt(question: str, retrieved_docs: list[dict[str, Any]]) -> str:
    context = "\n\n".join(
        f"[Document {i + 1}]\n{d['content']}" for i, d in enumerate(retrieved_docs)
    )

    return f"""You are a question-answering assistant.

Use only the provided context to answer the question.
If the answer is not supported by the context, say exactly:
"I don't have enough information from the provided context."

Context:
{context}

Question:
{question}

Answer:""".strip()
