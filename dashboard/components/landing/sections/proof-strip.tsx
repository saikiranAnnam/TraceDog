export function ProofStrip() {
  return (
    <section className="ld-proof" aria-label="Trust and proof">
      <div className="ld-proof-inner">
        <ul className="ld-proof-list">
          <li>Tested on real LLM outputs</li>
          <li>Built with real evaluation traces</li>
          <li>Supports RAG and agent workflows</li>
          <li>Open-source, developer-first</li>
        </ul>
        <div className="ld-pills" aria-hidden>
          <span className="ld-pill">GPT-4o-mini</span>
          <span className="ld-pill">Claude</span>
          <span className="ld-pill">SQuAD v2</span>
          <span className="ld-pill">FastAPI</span>
          <span className="ld-pill">Next.js</span>
          <span className="ld-pill">PostgreSQL</span>
        </div>
      </div>
    </section>
  );
}
