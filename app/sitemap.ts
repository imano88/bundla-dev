import type { MetadataRoute } from "next"
import { SITE_URL, MARKETING_PATHS } from "@/lib/site"
import { SOLUTIONS } from "@/lib/landing-pages"

// Public sitemap. Core pages live in lib/site.ts; solution/landing pages are
// derived from lib/landing-pages.ts so this stays in sync automatically.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const core: MetadataRoute.Sitemap = MARKETING_PATHS.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }))
  const solutions: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/losningar`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...SOLUTIONS.map((s) => ({
      url: `${SITE_URL}/losningar/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ]
  return [...core, ...solutions]
}
