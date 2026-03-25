from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ModelResult:
    model_name: str
    response_text: str
    latency_ms: int


class BaseModelRunner:
    def run(self, prompt: str) -> ModelResult:
        raise NotImplementedError
