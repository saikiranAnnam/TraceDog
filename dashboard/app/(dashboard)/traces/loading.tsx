export default function TracesLoading() {
  return (
    <div className="td-skeleton-wrap td-traces-page">
      <div className="td-skeleton-line" style={{ width: "40%" }} />
      <div className="td-skeleton-line td-skeleton-line--short" />
      <div
        className="td-summary-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="td-skeleton-block" style={{ height: 88 }} />
        ))}
      </div>
      <div className="td-skeleton-block" style={{ height: 200 }} />
    </div>
  );
}
