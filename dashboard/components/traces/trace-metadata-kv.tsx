/** Key–value rows for run metadata (CloudWatch / console style). */

function formatScalar(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="tdv-json-block">{JSON.stringify(value, null, 2)}</pre>
  );
}

export function MetadataValueCell({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="tdv-muted">—</span>;
  }
  if (typeof value === "object") {
    return <JsonBlock value={value} />;
  }
  return <code className="tdv-code-inline">{formatScalar(value)}</code>;
}

export function TraceMetadataKvList({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <p className="tdv-muted tdv-empty-kv">No metadata keys.</p>;
  }
  return (
    <dl className="tdv-kv-list">
      {entries.map(([key, val]) => (
        <div key={key} className="tdv-kv-item">
          <dt className="tdv-kv-dt">{key}</dt>
          <dd className="tdv-kv-dd">
            <MetadataValueCell value={val} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
