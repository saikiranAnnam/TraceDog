"""Map HotpotQA rows (Hugging Face or official JSON) to TraceDog eval cases."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from evaluation.runners.adapters.squad_adapter import docs_for_tracedog_payload


@dataclass
class HotpotEvalCase:
    case_id: str
    question: str
    retrieved_docs: list[dict[str, Any]]
    reference_answer: str | None
    gold_supporting_doc_ids: list[str]
    question_type: str | None = None
    level: str | None = None


def _find_para_index(titles: list[str], title: str) -> int | None:
    """Match supporting_fact title to a context paragraph (exact, then loose)."""
    t_clean = title.strip()
    for i, t in enumerate(titles):
        if t == t_clean:
            return i
    for i, t in enumerate(titles):
        if t_clean in t or t in t_clean:
            return i
    return None


def _groups_from_hf_context(ctx: dict[str, Any]) -> tuple[list[str], list[list[str]]]:
    titles = list(ctx.get("title") or [])
    sentences = list(ctx.get("sentences") or [])
    return titles, sentences


def _groups_from_list_context(ctx: list[Any]) -> tuple[list[str], list[list[str]]]:
    titles: list[str] = []
    sentences: list[list[str]] = []
    for block in ctx:
        if not isinstance(block, (list, tuple)) or len(block) < 2:
            continue
        titles.append(str(block[0]).strip())
        paras = block[1]
        if isinstance(paras, list):
            sentences.append([str(p) for p in paras])
        else:
            sentences.append([str(paras)])
    return titles, sentences


def _parse_context(row: dict[str, Any]) -> tuple[list[str], list[list[str]]]:
    ctx = row.get("context")
    if isinstance(ctx, dict) and "title" in ctx and "sentences" in ctx:
        return _groups_from_hf_context(ctx)
    if isinstance(ctx, list):
        return _groups_from_list_context(ctx)
    return [], []


def _gold_doc_ids(
    titles: list[str],
    sentences: list[list[str]],
    supporting_facts: Any,
) -> list[str]:
    out: list[str] = []
    if isinstance(supporting_facts, dict):
        st_titles = supporting_facts.get("title") or []
        st_ids = supporting_facts.get("sent_id") or []
        for t, sid in zip(st_titles, st_ids):
            if not isinstance(sid, int):
                try:
                    sid = int(sid)
                except (TypeError, ValueError):
                    continue
            pi = _find_para_index(titles, str(t))
            if pi is None:
                continue
            if pi >= len(sentences) or sid < 0 or sid >= len(sentences[pi]):
                continue
            out.append(f"hotpot-{pi}-{sid}")
        return out

    if isinstance(supporting_facts, list):
        for item in supporting_facts:
            if not isinstance(item, (list, tuple)) or len(item) < 2:
                continue
            t, sid = item[0], item[1]
            try:
                sid = int(sid)
            except (TypeError, ValueError):
                continue
            pi = _find_para_index(titles, str(t))
            if pi is None:
                continue
            if pi >= len(sentences) or sid < 0 or sid >= len(sentences[pi]):
                continue
            out.append(f"hotpot-{pi}-{sid}")
    return out


def _build_retrieved_docs(
    titles: list[str],
    sentences: list[list[str]],
) -> list[dict[str, Any]]:
    docs: list[dict[str, Any]] = []
    for i, title in enumerate(titles):
        sents = sentences[i] if i < len(sentences) else []
        for j, sent in enumerate(sents):
            did = f"hotpot-{i}-{j}"
            content = (sent or "").strip()
            docs.append(
                {
                    "doc_id": did,
                    "content": f"{title}\n\n{content}" if title else content,
                    "source_name": title,
                    "source_type": "hotpot_qa",
                    "rank": len(docs) + 1,
                    "score": 1.0,
                    "metadata": {
                        "dataset": "hotpot_qa",
                        "title": title,
                        "para_index": i,
                        "sent_index": j,
                    },
                }
            )
    return docs


def hotpot_row_to_eval_case(row: dict[str, Any]) -> HotpotEvalCase:
    case_id = str(row.get("id") or row.get("_id") or "unknown")
    titles, sentences = _parse_context(row)
    retrieved = _build_retrieved_docs(titles, sentences)
    gold_ids = _gold_doc_ids(titles, sentences, row.get("supporting_facts"))
    ans = row.get("answer")
    ref = str(ans).strip() if ans is not None else None
    qtype = row.get("type")
    level = row.get("level")
    return HotpotEvalCase(
        case_id=case_id,
        question=str(row.get("question") or ""),
        retrieved_docs=retrieved,
        reference_answer=ref,
        gold_supporting_doc_ids=gold_ids,
        question_type=qtype if isinstance(qtype, str) else None,
        level=level if isinstance(level, str) else None,
    )


__all__ = [
    "HotpotEvalCase",
    "docs_for_tracedog_payload",
    "hotpot_row_to_eval_case",
]
