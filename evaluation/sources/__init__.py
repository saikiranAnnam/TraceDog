"""
Evaluation **data sources** — registry, fetch pipeline, canonical rows, materialization.

Runners: **source → adapter → LLM → tracedog_client**. See ``evaluation/sources/README.md``.
"""

from evaluation.sources.canonical import (
    CANONICAL_SCHEMA_VERSION,
    CanonicalEvalRow,
    descriptor_from_materialized_jsonl,
    iter_materialized_jsonl,
    load_materialized_rows,
    normalize_raw_row,
)
from evaluation.sources.hf_revisions import HF_REVISION_HOTPOT_QA, HF_REVISION_SQUAD_V2
from evaluation.sources.hotpot_qa import HotpotQARowSource
from evaluation.sources.lineage import EvalRunLineage, collect_lineage
from evaluation.sources.materialize import materialize_to_jsonl
from evaluation.sources.pipeline_events import (
    build_source_fetch_complete_event,
    emit_pipeline_event,
)
from evaluation.sources.pipeline import (
    PipelineStats,
    SourceFetchResult,
    enriched_descriptor_for_materialized,
    fetch_rows_pipeline,
    log_pipeline_stats,
    short_hash_rows,
    validate_raw_row,
)
from evaluation.sources.registry import (
    SOURCE_REGISTRY,
    DatasetRegistryEntry,
    build_registered_source,
    get_registry_entry,
    list_registry_entries,
)
from evaluation.sources.squad_v2 import SquadV2RowSource
from evaluation.sources.types import EvalRowSource, SourceDescriptor, with_slice_and_hash

__all__ = [
    "CANONICAL_SCHEMA_VERSION",
    "CanonicalEvalRow",
    "DatasetRegistryEntry",
    "EvalRowSource",
    "EvalRunLineage",
    "HF_REVISION_HOTPOT_QA",
    "HF_REVISION_SQUAD_V2",
    "HotpotQARowSource",
    "PipelineStats",
    "SOURCE_REGISTRY",
    "SourceDescriptor",
    "SourceFetchResult",
    "SquadV2RowSource",
    "build_registered_source",
    "build_source_fetch_complete_event",
    "collect_lineage",
    "descriptor_from_materialized_jsonl",
    "emit_pipeline_event",
    "emit_source_fetch_complete",
    "enriched_descriptor_for_materialized",
    "fetch_rows_pipeline",
    "get_registry_entry",
    "iter_materialized_jsonl",
    "list_registry_entries",
    "load_materialized_rows",
    "log_pipeline_stats",
    "materialize_to_jsonl",
    "normalize_raw_row",
    "short_hash_rows",
    "validate_raw_row",
    "with_slice_and_hash",
]
