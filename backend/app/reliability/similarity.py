"""
Per-document grounding: best matching sentence/span vs response, plus keyword overlap.

Short QA answers ("Rollo", "France") align poorly with whole-paragraph embeddings; we take
max similarity over sentences and blend with lexical overlap.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from functools import lru_cache
from typing import Literal

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.core.config import settings

logger = logging.getLogger(__name__)

BackendName = Literal["tfidf", "sentence_transformers", "auto"]

_SENT_BOUNDARY = re.compile(r"(?<=[.!?])\s+")

# Short extractive QA answers: rely more on keyword overlap with the blended score.
SHORT_ANSWER_MAX_WORDS = 5
SHORT_ANSWER_MAX_CHARS = 48


@dataclass(frozen=True)
class PerDocSimilarityBreakdown:
    """Per retrieved chunk after answer-aware scoring."""

    hybrid: float
    best_sentence: float
    keyword: float


def is_short_answer(response: str) -> bool:
    r = response.strip()
    if not r:
        return False
    return len(r.split()) <= SHORT_ANSWER_MAX_WORDS or len(r) <= SHORT_ANSWER_MAX_CHARS


def split_into_sentences(text: str) -> list[str]:
    if not text or not text.strip():
        return []
    t = text.strip()
    parts = _SENT_BOUNDARY.split(t)
    out = [p.strip() for p in parts if p.strip()]
    if len(out) <= 1 and "\n" in t:
        out = [ln.strip() for ln in t.split("\n") if ln.strip()]
    if not out:
        return [t]
    return out


def keyword_overlap_score(response: str, doc: str) -> float:
    """Share of substantive response tokens (or whole phrase) found in doc. Range [0, 1]."""
    r = response.strip().lower()
    d = doc.lower()
    if not r:
        return 0.0
    if r in d:
        return 1.0
    words = [w for w in r.split() if len(w) > 1]
    if not words:
        return 1.0 if r in d else 0.0
    hits = sum(1 for w in words if w in d)
    return float(hits / len(words))


def hybrid_blend(best_sentence_sim: float, keyword_sim: float, short_answer: bool) -> float:
    if short_answer:
        return 0.45 * best_sentence_sim + 0.55 * keyword_sim
    return 0.7 * best_sentence_sim + 0.3 * keyword_sim


def _backend() -> str:
    b = (settings.similarity_backend or "auto").lower()
    if b not in ("auto", "tfidf", "sentence_transformers"):
        return "auto"
    return b


def _best_sentence_tfidf(response: str, sentences: list[str]) -> float:
    if not sentences:
        return 0.0
    corpus = [response] + sentences
    vec = TfidfVectorizer(min_df=1, lowercase=True)
    try:
        mat = vec.fit_transform(corpus)
        resp = mat[0:1]
        sims = cosine_similarity(resp, mat[1:])[0]
        return float(max(0.0, min(1.0, float(sims.max()))))
    except ValueError:
        return 0.0


@lru_cache(maxsize=1)
def _sentence_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(settings.sentence_transformer_model)


def _best_sentence_sentence_transformers(response: str, sentences: list[str]) -> float:
    if not sentences:
        return 0.0
    model = _sentence_model()
    texts = [response] + sentences
    emb = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    resp = emb[0:1]
    doc_emb = emb[1:]
    sims = (doc_emb @ resp.T).flatten()
    return float(max(0.0, min(1.0, float(sims.max()))))


def _best_sentence_one_doc(
    response: str, doc: str, *, use_sentence_transformers: bool
) -> float:
    sents = split_into_sentences(doc)
    if not sents:
        sents = [doc] if doc.strip() else [""]
    if not use_sentence_transformers:
        return _best_sentence_tfidf(response, sents)
    try:
        return _best_sentence_sentence_transformers(response, sents)
    except Exception as e:
        logger.warning("sentence_transformers sentence match failed (%s); tf-idf fallback", e)
        return _best_sentence_tfidf(response, sents)


def compute_per_doc_breakdowns(
    response: str, doc_contents: list[str]
) -> list[PerDocSimilarityBreakdown]:
    """
    For each document: max similarity over sentences, keyword overlap, hybrid score.
    """
    if not doc_contents:
        return []

    r = (response or "").strip()
    if not r:
        return [
            PerDocSimilarityBreakdown(hybrid=0.0, best_sentence=0.0, keyword=0.0)
            for _ in doc_contents
        ]

    short = is_short_answer(r)
    backend = _backend()

    if backend == "tfidf":
        return _breakdowns_tfidf(r, doc_contents, short)
    if backend == "sentence_transformers":
        try:
            return _breakdowns_st(r, doc_contents, short)
        except Exception as e:
            logger.warning("sentence_transformers failed (%s); falling back to tf-idf", e)
            return _breakdowns_tfidf(r, doc_contents, short)

    try:
        return _breakdowns_st(r, doc_contents, short)
    except Exception:
        return _breakdowns_tfidf(r, doc_contents, short)


def _breakdowns_tfidf(
    response: str, doc_contents: list[str], short: bool
) -> list[PerDocSimilarityBreakdown]:
    out: list[PerDocSimilarityBreakdown] = []
    for doc in doc_contents:
        bs = _best_sentence_one_doc(response, doc, use_sentence_transformers=False)
        kw = keyword_overlap_score(response, doc)
        hy = hybrid_blend(bs, kw, short)
        out.append(
            PerDocSimilarityBreakdown(
                hybrid=round(hy, 6),
                best_sentence=round(bs, 6),
                keyword=round(kw, 6),
            )
        )
    return out


def _breakdowns_st(
    response: str, doc_contents: list[str], short: bool
) -> list[PerDocSimilarityBreakdown]:
    out: list[PerDocSimilarityBreakdown] = []
    for doc in doc_contents:
        bs = _best_sentence_one_doc(response, doc, use_sentence_transformers=True)
        kw = keyword_overlap_score(response, doc)
        hy = hybrid_blend(bs, kw, short)
        out.append(
            PerDocSimilarityBreakdown(
                hybrid=round(hy, 6),
                best_sentence=round(bs, 6),
                keyword=round(kw, 6),
            )
        )
    return out


def per_document_similarities(response: str, doc_contents: list[str]) -> list[float]:
    """Cosine-style grounding scores in [0, 1] per doc (hybrid), API-stable."""
    return [b.hybrid for b in compute_per_doc_breakdowns(response, doc_contents)]


def aggregate_grounding(per_doc: list[float]) -> float:
    """v1: best supporting doc drives grounding (max hybrid similarity)."""
    if not per_doc:
        return 0.0
    return float(max(per_doc))
