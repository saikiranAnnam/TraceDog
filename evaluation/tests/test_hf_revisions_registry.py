"""Registry HF pins stay aligned with hf_revisions module."""

from __future__ import annotations

from evaluation.sources.hf_revisions import HF_REVISION_HOTPOT_QA, HF_REVISION_SQUAD_V2
from evaluation.sources.registry import SOURCE_REGISTRY


def test_registry_revisions_match_imported_pins() -> None:
    assert SOURCE_REGISTRY["squad_v2"].huggingface_revision == HF_REVISION_SQUAD_V2
    assert SOURCE_REGISTRY["hotpot_qa_fullwiki"].huggingface_revision == HF_REVISION_HOTPOT_QA
    assert SOURCE_REGISTRY["squad_v2"].huggingface_dataset_name == "squad_v2"
    assert SOURCE_REGISTRY["hotpot_qa_fullwiki"].huggingface_config_name == "fullwiki"
