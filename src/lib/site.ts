export const SITE_ID = process.env.NEXT_PUBLIC_ID || 'axeldelafosse'
export const SITE_NAME = process.env.NEXT_PUBLIC_FULL_NAME || 'Axel Delafosse'
export const SITE_URL = `https://${SITE_ID}.com`

/** One URL convention for metadata, internal links, and the sitemap. */
export function canonicalUrl(path: string) {
  const pathname = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  return new URL(pathname, SITE_URL).href
}
