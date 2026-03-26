"""OpenAI Chat Completions — works with gpt-4o-mini, gpt-4o, etc."""

from __future__ import annotations

import time

from openai import OpenAI

from evaluation.runners.providers.base import BaseModelRunner, ModelResult


class OpenAIChatRunner(BaseModelRunner):
    def __init__(self, model_name: str, api_key: str | None = None):
        self.model_name = model_name
        self.client = OpenAI(api_key=api_key)

    def run(self, prompt: str) -> ModelResult:
        start = time.perf_counter()
        resp = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        latency_ms = int((time.perf_counter() - start) * 1000)
        text = (resp.choices[0].message.content or "").strip()
        return ModelResult(
            model_name=self.model_name,
            response_text=text,
            latency_ms=latency_ms,
        )
