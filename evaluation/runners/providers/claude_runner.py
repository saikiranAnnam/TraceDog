"""Anthropic Messages API — Claude 3.5 / Sonnet / Haiku, etc."""

from __future__ import annotations

import time

import anthropic

from evaluation.runners.providers.base import BaseModelRunner, ModelResult


def _message_text(content: list) -> str:
    parts: list[str] = []
    for block in content:
        t = getattr(block, "text", None)
        if isinstance(t, str):
            parts.append(t)
    return "".join(parts).strip()


class ClaudeMessagesRunner(BaseModelRunner):
    def __init__(self, model_name: str, api_key: str | None = None):
        self.model_name = model_name
        self.client = anthropic.Anthropic(api_key=api_key)

    def run(self, prompt: str) -> ModelResult:
        start = time.perf_counter()
        try:
            msg = self.client.messages.create(
                model=self.model_name,
                max_tokens=2048,
                temperature=0.2,
                messages=[{"role": "user", "content": prompt}],
            )
        except anthropic.APIStatusError as e:
            raise RuntimeError(
                f"Anthropic HTTP {e.status_code}: {e.message}. "
                f"model={self.model_name!r}. "
                "Set EVAL_ANTHROPIC_MODEL to a current id (e.g. claude-haiku-4-5 or "
                "claude-sonnet-4-6); see Anthropic models overview."
            ) from e
        except anthropic.APIError as e:
            raise RuntimeError(
                f"Anthropic API error: {e}. model={self.model_name!r}."
            ) from e
        latency_ms = int((time.perf_counter() - start) * 1000)
        text = _message_text(list(msg.content))
        return ModelResult(
            model_name=self.model_name,
            response_text=text,
            latency_ms=latency_ms,
        )
