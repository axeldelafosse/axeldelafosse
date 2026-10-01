import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

// Run after `bun run build`. Asset sizes are reproducible build measurements,
// not browser timings; deferred GPU/code/tweet chunks are not initial JS.
const build = JSON.parse(await readFile('.next/build-manifest.json', 'utf8'))
const sourcePosts = JSON.parse(
  await readFile('.contentlayer/generated/Post/_index.json', 'utf8')
)
  .filter((post) => post._raw.sourceFileDir === '.')
  .sort((a, b) => new Date(b.date) - new Date(a.date))
const report = {}

async function measure(route, file, manifestRoute = route) {
  const html = await readFile(`.next/server/pages/${file}.html`, 'utf8')
  const data = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  )?.[1]
  assert.ok(data, `${route} has server-rendered page data`)
  const files = [
    ...new Set([...build.pages['/_app'], ...build.pages[manifestRoute]])
  ].filter((file) => file.endsWith('.js'))
  const scripts = await Promise.all(
    files.map((file) => readFile(`.next/${file}`))
  )
  report[route] = {
    htmlBytes: Buffer.byteLength(html),
    htmlGzipBytes: gzipSync(html).length,
    pageDataBytes: Buffer.byteLength(data),
    initialJsBytes: scripts.reduce((sum, script) => sum + script.length, 0),
    initialJsGzipBytes: scripts.reduce(
      (sum, script) => sum + gzipSync(script).length,
      0
    )
  }
  return { props: JSON.parse(data).props.pageProps, html }
}

const home = await measure('/', 'index')
assert.deepEqual(Object.keys(home.props), ['post'])
assert.deepEqual(
  home.props.post,
  sourcePosts[0]
    ? { slug: sourcePosts[0].slug, title: sourcePosts[0].title }
    : null
)

const blog = await measure('/blog', 'blog')
assert.deepEqual(
  blog.props.posts,
  sourcePosts.map(({ uid, slug, title, date, dateLastModified }) => ({
    uid,
    slug,
    title,
    date,
    dateLastModified
  }))
)
assert.match(blog.html, /data-aurora-occluder="true"/)
await measure('/talks', 'talks')

for (const post of sourcePosts) {
  const { props, html } = await measure(
    `/blog/${post.slug}`,
    `blog/${post.slug}`,
    '/blog/[slug]'
  )
  assert.deepEqual(Object.keys(props.post).sort(), [
    'body',
    'date',
    'dateLastModified',
    'description',
    'slug',
    'title',
    'uid'
  ])
  assert.deepEqual(
    props.post.body,
    { code: post.body.code },
    'article code is preserved without duplicate raw Markdown'
  )
  assert.match(html, /data-aurora-occluder="true"/)
  assert.doesNotMatch(
    html,
    /api\.microlink\.io|images\.weserv\.nl[^"<]*microlink/,
    'previews do not preload screenshots'
  )
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.table(
    Object.fromEntries(
      Object.entries(report).map(([route, values]) => [
        route,
        {
          'HTML (KB gzip)': (values.htmlGzipBytes / 1000).toFixed(1),
          'Page data (KB)': (values.pageDataBytes / 1000).toFixed(1),
          'Initial JS (KB gzip)': (values.initialJsGzipBytes / 1000).toFixed(1)
        }
      ])
    )
  )
  console.log(
    'Payload, content-preservation, and on-demand preview checks passed. These are build sizes, not browser speed scores.'
  )
}
