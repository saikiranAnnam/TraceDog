"use client";

import { useCallback, useState } from "react";

type Tab = "curl" | "python" | "javascript";

const SNIPPETS: Record<
  Tab,
  { label: string; code: string; lang: string }
> = {
  curl: {
    label: "cURL",
    lang: "bash",
    code: `curl -sS -X POST "$TRACEDOG/api/v1/traces" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_name": "support-bot",
    "environment": "staging",
    "prompt": "What is the refund policy?",
    "response": "Refunds are available within 30 days...",
    "model_name": "gpt-4o-mini",
    "latency_ms": 1200,
    "retrieved_docs": [
      { "doc_id": "policy-1", "content": "Refund policy: 30-day window..." }
    ]
  }'`,
  },
  python: {
    label: "Python",
    lang: "python",
    code: `import os, requests

url = os.environ.get("TRACEDOG_URL", "http://localhost:8000").rstrip("/") + "/api/v1/traces"
payload = {
    "agent_name": "support-bot",
    "environment": "staging",
    "prompt": "What is the refund policy?",
    "response": "Refunds are available within 30 days...",
    "model_name": "gpt-4o-mini",
    "latency_ms": 1200,
    "retrieved_docs": [
        {"doc_id": "policy-1", "content": "Refund policy: 30-day window..."},
    ],
}
r = requests.post(url, json=payload, timeout=60)
r.raise_for_status()
print(r.json())`,
  },
  javascript: {
    label: "JavaScript",
    lang: "typescript",
    code: `const base = (process.env.TRACEDOG_URL ?? "http://localhost:8000").replace(/\\/$/, "");
const res = await fetch(\`\${base}/api/v1/traces\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    agent_name: "support-bot",
    environment: "staging",
    prompt: "What is the refund policy?",
    response: "Refunds are available within 30 days...",
    model_name: "gpt-4o-mini",
    latency_ms: 1200,
    retrieved_docs: [
      { doc_id: "policy-1", content: "Refund policy: 30-day window..." },
    ],
  }),
});
if (!res.ok) throw new Error(await res.text());
console.log(await res.json());`,
  },
};

export function DocsCodeTabs() {
  const [tab, setTab] = useState<Tab>("curl");
  const [copied, setCopied] = useState(false);
  const cur = SNIPPETS[tab];

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(cur.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [cur.code]);

  return (
    <div className="docs-code-tabs">
      <div className="docs-code-tabs-bar" role="tablist" aria-label="Code example format">
        {(Object.keys(SNIPPETS) as Tab[]).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            className={`docs-code-tab${tab === k ? " docs-code-tab--on" : ""}`}
            onClick={() => setTab(k)}
          >
            {SNIPPETS[k].label}
          </button>
        ))}
      </div>
      <div className="docs-code-block-wrap">
        <button type="button" className="docs-code-copy" onClick={copy} aria-label="Copy code">
          {copied ? "Copied" : "Copy"}
        </button>
        <pre className="docs-code-pre">
          <code className={`docs-code-code language-${cur.lang}`}>{cur.code}</code>
        </pre>
      </div>
    </div>
  );
}
