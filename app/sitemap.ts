import type { MetadataRoute } from "next"
import { SITE_URL, MARKETING_PATHS } from "@/lib/site"

// Public sitemap. Marketing/landing pages are listed in lib/site.ts so this
// stays in sync as new SEO pages are added.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return MARKETING_PATHS.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }))
}
