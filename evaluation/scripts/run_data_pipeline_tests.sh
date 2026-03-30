#!/usr/bin/env bash
# Run all evaluation data-plane checks from the TraceDog repo root.
# Usage:
#   bash evaluation/scripts/run_data_pipeline_tests.sh
# Skip Hugging Face hub verification (no network):
#   SKIP_HF_VERIFY=1 bash evaluation/scripts/run_data_pipeline_tests.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
export PYTHONPATH=.

echo "== [1/2] evaluation/tests (pytest; mostly offline) =="
python -m pytest evaluation/tests/ -q

echo "== [2/2] HF dataset revision pins (network required) =="
if [[ "${SKIP_HF_VERIFY:-}" == "1" ]]; then
  echo "SKIP_HF_VERIFY=1 — skipping evaluation/scripts/verify_hf_dataset_revisions.py"
else
  python evaluation/scripts/verify_hf_dataset_revisions.py
fi

echo "OK — data pipeline test script finished."
