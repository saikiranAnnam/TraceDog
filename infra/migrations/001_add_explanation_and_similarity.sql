-- Run manually if you prefer not to rely on API startup patches:
-- docker compose exec postgres psql -U tracedog -d tracedog -f /path/to/this/file
-- Or:
-- docker compose exec postgres psql -U tracedog -d tracedog -c "ALTER TABLE ..."

ALTER TABLE reliability_results ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE retrieved_documents ADD COLUMN IF NOT EXISTS similarity_score DOUBLE PRECISION;
ALTER TABLE traces ADD COLUMN IF NOT EXISTS ingest_metadata JSONB;
