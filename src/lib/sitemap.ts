import type { PostMetadata } from './post-data'
import { canonicalUrl } from './site'

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export function createSitemap(posts: PostMetadata[]): string {
  const latest = posts
    .map((post) => post.dateLastModified.slice(0, 10))
    .sort()
    .pop()
  const routes = [
    { path: '/', modified: latest },
    { path: '/blog', modified: latest },
    { path: '/talks', modified: undefined },
    ...posts.map((post) => ({
      path: `/blog/${post.slug}`,
      modified: post.dateLastModified.slice(0, 10)
    }))
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
    .map(
      ({ path, modified }) =>
        `  <url><loc>${escapeXml(canonicalUrl(path))}</loc>${modified ? `<lastmod>${escapeXml(modified)}</lastmod>` : ''}</url>`
    )
    .join('\n')}\n</urlset>`
}
