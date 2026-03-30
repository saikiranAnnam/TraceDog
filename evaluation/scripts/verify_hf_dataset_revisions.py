#!/usr/bin/env python3
"""
Verify Hugging Face dataset **pins** in ``evaluation/sources/registry.py``.

Loads each registered dataset with ``revision=<pin>`` and ``streaming=True``, then
reads one example. Intended for CI (network required).

Usage (repo root)::

    pip install -r evaluation/requirements.txt
    PYTHONPATH=. python evaluation/scripts/verify_hf_dataset_revisions.py
"""

from __future__ import annotations

import gc
import os
import sys
from pathlib import Path

# Before Hugging Face / Arrow / tokenizers load: avoids rare native abort() on exit in CI
# ("terminate called without an active exception" / core dump after successful OK lines).
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from datasets import load_dataset

from evaluation.sources.registry import list_registry_entries


def _pick_split(entry: object) -> str:
    splits = getattr(entry, "supported_splits", ()) or ()
    if "validation" in splits:
        return "validation"
    return splits[0] if splits else "validation"


def main() -> int:
    ok = True
    for entry in list_registry_entries():
        rev = entry.huggingface_revision
        name = entry.huggingface_dataset_name
        if not rev or not name:
            continue
        cfg = entry.huggingface_config_name
        split = _pick_split(entry)
        label = f"{entry.source_id} ({name}" + (f", config={cfg}" if cfg else "") + f", rev={rev[:12]}…)"
        try:
            if cfg:
                ds = load_dataset(
                    name, cfg, split=split, streaming=True, revision=rev
                )
            else:
                ds = load_dataset(name, split=split, streaming=True, revision=rev)
            _ = next(iter(ds))
            del ds
            gc.collect()
        except Exception as e:
            print(f"FAIL {label}\n  {e}", file=sys.stderr)
            ok = False
        else:
            print(f"OK   {label} split={split}")
    code = 0 if ok else 1
    gc.collect()
    sys.stdout.flush()
    sys.stderr.flush()
    # Bypass flaky C++ teardown in pyarrow/datasets (abort after successful run in some CI envs).
    os._exit(code)


if __name__ == "__main__":
    raise SystemExit(main())
