"""Lightweight numeric / token signals for contradiction (v1 heuristic)."""

from __future__ import annotations

import re


def extract_numbers(text: str) -> set[str]:
    """Digit sequences (e.g. 7, 2, 820)."""
    return set(re.findall(r"\d+", text))


def numeric_contradiction_hint(response: str, doc_contents: list[str]) -> bool:
    """
    True if response and docs each contain numbers but share none — weak signal only.
    Pairs with similarity to reduce false positives.
    """
    r = extract_numbers(response)
    if not r:
        return False
    for content in doc_contents:
        d = extract_numbers(content)
        if d and r.isdisjoint(d):
            return True
    return False
