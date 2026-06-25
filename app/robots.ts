import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

// Allow crawling of the public site; keep the app, auth and API endpoints out
// of search indexes.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/studio", "/studio/", "/login", "/auth/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
