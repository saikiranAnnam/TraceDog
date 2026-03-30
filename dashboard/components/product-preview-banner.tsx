import { Construction } from "lucide-react";

/** Shown above dashboard + docs while the product surface is still evolving. */
export function ProductPreviewBanner() {
  return (
    <div className="td-product-banner" role="status" aria-live="polite">
      <Construction className="td-product-banner-icon" size={15} strokeWidth={2} aria-hidden />
      <p className="td-product-banner-text">
        <strong>In progress</strong> — we&apos;re building and shipping updates often. More features and insights for{" "}
        <strong>LLM evaluation</strong> and <strong>AI agent observability</strong> are on the way.
      </p>
    </div>
  );
}
