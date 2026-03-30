# TraceDog evaluation — SQuAD v2 → real LLM → TraceDog

Runs **SQuAD 2.0** examples through a **live LLM** (OpenAI or **Anthropic Claude**), then **POSTs each run** to TraceDog so you can compare models in the dashboard.

## Prereqs

1. **TraceDog API up** (e.g. `docker compose` in `infra/`) — default `http://localhost:8000`
2. **API keys and defaults** — easiest: copy `evaluation/.env.example` to `evaluation/.env` (or put the same variables in the **repo root** `.env`). The runner loads **root `.env` first**, then **`evaluation/.env`** (eval file wins on duplicate keys).

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | OpenAI |
| `ANTHROPIC_API_KEY` | Claude |
| `EVAL_LLM_PROVIDER` | `openai` or `anthropic` (default provider) |
| `EVAL_OPENAI_MODEL` | OpenAI model id |
| `EVAL_ANTHROPIC_MODEL` | Anthropic model id |
| `TRACEDOG_URL` | TraceDog base URL |

CLI flags `--provider` and `--model` override these. You can still `export ...` in the shell if you prefer.

## Install

From the **repo root** (`TraceDog/`):

```bash
pip install -r evaluation/requirements.txt
```

First Hugging Face dataset download can take a minute.

## Test the data pipeline (no dashboard required)

From the **repo root**, with **`evaluation/requirements.txt`** installed:

```bash
cd /path/to/TraceDog
pip install -r evaluation/requirements.txt

# 1) Unit / offline-friendly tests (registry, pipeline, canonical, events, adapters)
PYTHONPATH=. python -m pytest evaluation/tests/ -q

# 2) One-shot script: pytest + optional HF pin verification (needs network unless skipped)
bash evaluation/scripts/run_data_pipeline_tests.sh

# Offline-only (skip Hugging Face hub check)
SKIP_HF_VERIFY=1 bash evaluation/scripts/run_data_pipeline_tests.sh

# 3) Optional smoke: fetch slice + build prompts, no TraceDog POST
PYTHONPATH=. python -m evaluation.runners.run_squad_eval --limit 2 --dry-run --experiment pipeline-smoke

# 4) Structured pipeline events (JSONL) while smoke-running
export TRACE_EVAL_PIPELINE_EVENTS_JSONL=/tmp/tracedog-pipeline-events.jsonl
PYTHONPATH=. python -m evaluation.runners.run_squad_eval --limit 1 --dry-run --experiment pipeline-events-smoke
```

CI also runs **HF revision pins** (`.github/workflows/ci.yml`, job `eval-hf-pins`).

The **Data** page in the dashboard links here, summarizes **fetch latency** from recent eval traces, and can **run** checks on the API host when `PIPELINE_TESTS_REPO_ROOT` is set.

## Data sources (where rows come from)

Benchmark loading lives in **`evaluation/sources/`**: **registry** (`squad_v2`, `hotpot_qa_fullwiki`), **pinned HF revisions**, **versioned** `SourceDescriptor`, **fetch pipeline** (retries, validation, optional **slice cache**), **canonical JSONL materialization**, **`ingest_metadata.eval_lineage`** (incl. **`run_id`**), and optional **pipeline event JSONL** via **`TRACE_EVAL_PIPELINE_EVENTS_JSONL`**. Runners support **`--source-cache`**, **`--materialized`**, and env **`TRACE_EVAL_USE_SOURCE_CACHE`** / **`TRACE_EVAL_SOURCE_CACHE`** / **`TRACE_EVAL_GIT_SHA`** / **`TRACE_EVAL_RUN_ID`**. See **[`evaluation/sources/README.md`](sources/README.md)**.

## Run (start small)

```bash
cd /path/to/TraceDog
cp evaluation/.env.example evaluation/.env
# Edit evaluation/.env: OPENAI_API_KEY, EVAL_LLM_PROVIDER, models, TRACEDOG_URL, etc.

PYTHONPATH=. python -m evaluation.runners.run_squad_eval \
  --limit 10 \
  --experiment squad-v2-smoke

# Same, plus aggregate **chunk + CGGE + hybrid** metrics at the end:
PYTHONPATH=. python -m evaluation.runners.run_squad_eval \
  --limit 25 \
  --summary \
  --experiment squad-cgge-smoke

# Save aggregate JSON for diffing against another commit or config (same metrics as --summary):
PYTHONPATH=. python -m evaluation.runners.run_squad_eval \
  --limit 25 \
  --summary \
  --write-summary-json /tmp/squad-summary-after.json \
  --experiment my-benchmark
```

**Claude** — set `EVAL_LLM_PROVIDER=anthropic`, `ANTHROPIC_API_KEY`, and optionally `EVAL_ANTHROPIC_MODEL` in `.env` (default in code is `claude-haiku-4-5`; older ids like `claude-3-5-haiku-20241022` may be rejected by the API), or pass `--provider anthropic` for a one-off run.

### Useful flags

| Flag | Default | Meaning |
|------|---------|--------|
| `--limit` | `10` | Max examples (validation split) |
| `--offset` | `0` | Skip first N rows |
| `--split` | `validation` | `train` or `validation` |
| `--provider` | `EVAL_LLM_PROVIDER` or `openai` | `openai` or `anthropic` |
| `--model` | `EVAL_*_MODEL` or built-in default | OpenAI or Anthropic model id |
| `--tracedog-url` | env or `http://localhost:8000` | TraceDog base URL |
| `--experiment` | `squad-v2-eval` | Stored in `ingest_metadata.experiment_name` |
| `--dry-run` | off | Build prompts + call LLM but do not POST to TraceDog |
| `--summary` | off | After a successful run, print batch averages: chunk grounding, CGGE groundedness / unsupported ratio, **hybrid** answer hallucination & trace reliability |
| `--write-summary-json` | off | Write one JSON file with the same aggregates as `--summary` (for before/after comparison) |
| `--output-jsonl` | off | Append one JSON object per row (scores + hybrid fields when the API returns `reliability_insights`) |

**HotpotQA** (`python -m evaluation.runners.run_hotpot_eval`) supports the same **`--summary`**, **`--write-summary-json`**, and **`--output-jsonl`** behavior.

### Comparing metrics before vs after a change

1. **Baseline run** — pin the same `--limit`, `--offset`, dataset, and model; save artifacts:

   ```bash
   PYTHONPATH=. python -m evaluation.runners.run_squad_eval \
     --limit 50 --summary \
     --output-jsonl evaluation/runs/baseline.jsonl \
     --write-summary-json evaluation/runs/baseline-summary.json \
     --experiment compare-baseline
   ```

2. **After your code or scorer change** — same command with different file names (or a different `--experiment` tag).

3. **Compare the two JSONL batches** (per-trace rows, not just the summary file):

   ```bash
   PYTHONPATH=. python scripts/compare_jsonl_runs.py \
     evaluation/runs/baseline.jsonl \
     evaluation/runs/after.jsonl \
     --label-a baseline --label-b after-change
   ```

   The script prints a table with **Δ** for each metric and marks which side is better (↑ chunk grounding / hybrid trace reliability; ↓ hybrid answer hallucination / CGGE unsupported ratio).

4. **Quick smoke without the full eval** — with the API running, one POST shows chunk vs CGGE vs hybrid on a fixed payload:

   ```bash
   TRACEDOG_API_URL=http://127.0.0.1:8000 python scripts/compare_grounding_metrics.py
   ```

## CGGE metrics on each trace

After `POST /api/v1/traces`, the runner records (and prints on stderr) TraceDog’s **claim-level** output alongside legacy scores:

- `failure_reason` — v1 root-cause hint (`partial_claim_hallucination`, `missing_retrieval`, …)
- `cgge_response_groundedness`, `cgge_unsupported_ratio`, `cgge_claim_count`
- Optional `chunk_max_similarity`, `cgge_label_counts` from `grounding_layers`
- **`hybrid_answer_hallucination`**, **`hybrid_trace_reliability`**, **`rca_primary`**, **`repair_steps_count`** when the API returns `reliability_insights`

Use **`--output-jsonl runs.jsonl`** to analyze distributions offline; use **`--summary`** for a quick headline over the batch.

## What gets stored

Each trace includes **`ingest_metadata`** (JSON) with:

- `run_type`: `evaluation`
- `dataset_name`: `squad_v2`
- `case_id`: SQuAD example id
- `experiment_name`: your `--experiment`
- `llm_provider`: `openai` or `anthropic`
- `is_answerable`, `reference_answer` (if any), `title`

Filter in the UI later via environment `evaluation` and agent `squad-eval-runner`.

## Compare models

Run the same `--limit` / `--offset` with different `--model`, then sort traces in the dashboard by model / scores.
