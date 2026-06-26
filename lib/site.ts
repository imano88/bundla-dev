// Central site constants used by metadata, sitemap, robots and structured data.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bundla.vercel.app").replace(
  /\/$/,
  ""
)
export const SITE_NAME = "Bundla"
export const SITE_TAGLINE = "Två produktbilder. En färdig bundle."
export const SITE_DESCRIPTION =
  "Bundla frilägger två produktbilder automatiskt och slår ihop dem till en färdig bundle-bild för e-handel. Ingen Photoshop, inga lager."
export const CONTACT_EMAIL = "jakob.radback@markable.se"

// Operating company (shown in the footer / legal pages).
export const COMPANY_NAME = "Markable AB"
export const COMPANY_ORG_NR = "559476-3897"
export const COMPANY_VAT = "SE559476389701"
// TODO: confirm the exact LinkedIn company URL.
export const LINKEDIN_URL = "https://www.linkedin.com/company/markable-ab"

// Public, indexable marketing pages (used by the sitemap).
export const MARKETING_PATHS = ["/", "/docs", "/villkor", "/integritetspolicy"] as const
