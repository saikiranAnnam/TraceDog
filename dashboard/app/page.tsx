import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <h1>TraceDog</h1>
      <p>Observability for AI agent traces.</p>
      <ul>
        <li>
          <Link href="/traces">View traces</Link>
        </li>
        <li>
          API: <code>POST /api/v1/traces</code> on the backend (port 8000)
        </li>
      </ul>
    </div>
  );
}
