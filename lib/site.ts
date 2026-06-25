// Central site constants used by metadata, sitemap, robots and structured data.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bundla.vercel.app").replace(
  /\/$/,
  ""
)
export const SITE_NAME = "Bundla"
export const SITE_TAGLINE = "Två produktbilder. En färdig bundle."
export const SITE_DESCRIPTION =
  "Bundla friställer två produktbilder automatiskt och slår ihop dem till en färdig bundle-bild för e-handel. Ingen Photoshop, inga lager."
export const CONTACT_EMAIL = "jakob.radback@markable.se"

// Public, indexable marketing pages (used by the sitemap).
export const MARKETING_PATHS = ["/", "/docs", "/villkor", "/integritetspolicy"] as const
