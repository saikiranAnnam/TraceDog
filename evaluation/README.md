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

## Run (start small)

```bash
cd /path/to/TraceDog
cp evaluation/.env.example evaluation/.env
# Edit evaluation/.env: OPENAI_API_KEY, EVAL_LLM_PROVIDER, models, TRACEDOG_URL, etc.

PYTHONPATH=. python -m evaluation.runners.run_squad_eval \
  --limit 10 \
  --experiment squad-v2-smoke
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
