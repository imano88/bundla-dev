// Renders a JSON-LD structured-data block. Used for SEO/GEO/AEO so search and
// answer engines can understand the product, brand and FAQ content.
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is static, app-controlled content (no user input).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
