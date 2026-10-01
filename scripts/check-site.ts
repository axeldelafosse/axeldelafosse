import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { canonicalUrl, SITE_URL } from '../src/lib/site'

// Validate the actual static output, including MDX-generated links and anchors.
// External checks are opt-in so third-party downtime cannot break a build.
const decode = (value: string) =>
  value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named: Record<string, string> = {
      '&amp;': '&',
      '&quot;': '"',
      '&apos;': "'",
      '&lt;': '<',
      '&gt;': '>'
    }
    return (
      named[entity] ??
      String.fromCodePoint(
        entity.startsWith('&#x')
          ? parseInt(entity.slice(3), 16)
          : parseInt(entity.slice(2), 10)
      )
    )
  })
function attributes(tag: string): Record<string, string> {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(
      (match) => [match[1], decode(match[2] ?? match[3])]
    )
  )
}
const directory = '.next/server/pages'
const pages = new Map<string, string>()
for (const file of readdirSync(directory, { recursive: true }) as string[]) {
  if (!file.endsWith('.html') || ['404.html', '500.html'].includes(file))
    continue
  const route = '/' + file.replace(/\.html$/, '').replace(/^index$/, '')
  pages.set(route, readFileSync(`${directory}/${file}`, 'utf8'))
}
assert.ok(pages.has('/blog'), 'Build the site before checking its output.')
const redirects = JSON.parse(readFileSync('.next/routes-manifest.json', 'utf8'))
  .redirects as { source: string }[]
const errors: string[] = []
const external = new Map<string, Set<string>>()
let links = 0

for (const [route, html] of pages) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? ''
  const tags = [...head.matchAll(/<(?:meta|link)\b[^>]*>/g)].map(([tag]) =>
    attributes(tag)
  )
  const canonicals = tags.filter((tag) => tag.rel === 'canonical')
  const meta = (name: string) =>
    tags.find((tag) => tag.name === name || tag.property === name)?.content
  if (canonicals.length !== 1 || canonicals[0].href !== canonicalUrl(route))
    errors.push(`${route}: missing or incorrect canonical URL`)
  if (meta('og:url') !== canonicalUrl(route))
    errors.push(`${route}: social URL differs from canonical`)
  if (!meta('description')?.trim()) errors.push(`${route}: missing description`)
  const title = head.match(/<title\b[^>]*>([^<]+)<\/title>/)?.[1]
  if (
    !title?.trim() ||
    title.includes('undefined') ||
    tags.some((tag) => /undefined/.test(tag.content ?? tag.href ?? ''))
  )
    errors.push(`${route}: incomplete metadata`)
  if (route.startsWith('/blog/')) {
    const json = head.match(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/
    )?.[1]
    const article = json ? JSON.parse(json) : null
    if (
      article?.mainEntityOfPage?.['@id'] !== canonicalUrl(route) ||
      !article?.author?.name ||
      !article?.datePublished ||
      !article?.dateModified
    )
      errors.push(`${route}: incomplete article metadata`)
    if (meta('twitter:card') !== 'summary_large_image')
      errors.push(`${route}: missing share-card metadata`)
    if (
      [...pages.keys()].filter((path) => path.startsWith('/blog/')).length >
        1 &&
      !html.includes('aria-label="More writing"')
    )
      errors.push(`${route}: missing post navigation`)
    if (/<button[^>]*>\s*edit\b/.test(html))
      errors.push(`${route}: local editor exposed in production`)
  }
  for (const [tag] of html.matchAll(/<a\b[^>]*>/g)) {
    const href = attributes(tag).href
    if (!href) continue
    links++
    let url: URL
    try {
      url = new URL(href, canonicalUrl(route))
    } catch {
      errors.push(`${route}: invalid link ${href}`)
      continue
    }
    if (['mailto:', 'tel:'].includes(url.protocol)) continue
    if (!['https:', 'http:'].includes(url.protocol)) {
      errors.push(`${route}: unsupported link ${href}`)
      continue
    }
    if (url.origin !== SITE_URL) {
      url.hash = ''
      if (!external.has(url.href)) external.set(url.href, new Set())
      external.get(url.href)!.add(route)
      continue
    }
    const path = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/'
    const target = pages.get(path)
    if (target) {
      if (url.hash) {
        const anchor = decodeURIComponent(url.hash.slice(1)).split(
          ':~:text='
        )[0]
        const ids = [...target.matchAll(/\b(?:id|name)="([^"]*)"/g)].map(
          (match) => decode(match[1])
        )
        if (anchor && !ids.includes(anchor))
          errors.push(`${route}: missing anchor ${href}`)
      }
    } else {
      const asset = resolve('public', path.slice(1))
      if (
        !redirects.some((redirect) => redirect.source === path) &&
        !(asset.startsWith(resolve('public') + '/') && existsSync(asset))
      )
        errors.push(`${route}: broken internal link ${href}`)
    }
  }
}
assert.deepEqual(errors, [], errors.join('\n'))
console.log(
  `Validated canonical URLs, metadata, and ${links} links across ${pages.size} built pages.`
)

if (process.argv.includes('--external')) {
  const queue = [...external.entries()]
  let checked = 0
  const unavailable: string[] = []
  const broken: string[] = []
  async function check(url: string, method: 'HEAD' | 'GET') {
    const response = await fetch(url, {
      method,
      redirect: 'follow',
      signal: AbortSignal.timeout(10000)
    })
    await response.body?.cancel()
    return response.status
  }
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let entry; (entry = queue.pop()); ) {
        const [url, sources] = entry
        try {
          let status = await check(url, 'HEAD')
          if (status >= 400) status = await check(url, 'GET')
          if (status === 404 || status === 410)
            broken.push(`${status} ${url} (from ${[...sources].join(', ')})`)
          else if (status >= 400) unavailable.push(`${status} ${url}`)
          else checked++
        } catch {
          unavailable.push(`Timeout or network error: ${url}`)
        }
      }
    })
  )
  console.log(
    `External links: ${checked} reachable, ${broken.length} broken, ${unavailable.length} inconclusive.`
  )
  for (const result of [...broken, ...unavailable]) console.log(result)
  if (broken.length) process.exitCode = 1
}
