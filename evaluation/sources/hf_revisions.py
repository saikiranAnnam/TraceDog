"""
Pinned Hugging Face **dataset repo** revisions for ``datasets.load_dataset(..., revision=...)``.

These are full git commit SHAs from the Hugging Face Hub (``main`` at time of pin).
Bump **intentionally** when you accept a new snapshot; CI verifies each pin loads.

To refresh pins (requires network)::

    python -c \"from huggingface_hub import HfApi; api=HfApi();
    print('squad_v2', api.dataset_info('squad_v2', revision='main').sha);
    print('hotpot_qa', api.dataset_info('hotpot_qa', revision='main').sha)\"
"""

# squad_v2 @ https://huggingface.co/datasets/squad_v2
HF_REVISION_SQUAD_V2 = "3ffb306f725f7d2ce8394bc1873b24868140c412"

# hotpot_qa @ https://huggingface.co/datasets/hotpot_qa (config fullwiki)
HF_REVISION_HOTPOT_QA = "1908d6afbbead072334abe2965f91bd2709910ab"
