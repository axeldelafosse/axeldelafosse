import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const buildDirectory = resolve('.next')
const previewUrl = process.argv[2] ? new URL(process.argv[2]) : null
async function readPreview(path) {
  const response = await fetch(new URL(path, previewUrl))
  assert.ok(response.ok, `preview returned ${response.status} for ${path}`)
  return response.text()
}
const html = previewUrl
  ? await readPreview(previewUrl.href)
  : await readFile(resolve(buildDirectory, 'server/pages/index.html'), 'utf8')
const stylesheetLinks = [...html.matchAll(/<link\b[^>]*>/g)]
  .map(([tag]) => tag)
  .filter((tag) => /\brel="stylesheet"/.test(tag))

assert.ok(stylesheetLinks.length > 0, 'home page has no stylesheet')
for (const tag of stylesheetLinks) {
  assert.ok(!/\bmedia="print"|\bonload=/.test(tag), 'layout CSS is deferred')
}
assert.match(html, /class="home-page\s/, 'viewport shell is missing from SSR')
assert.doesNotMatch(html, /\bh-svh\b/, 'home still uses a fixed small viewport')

const styles = await Promise.all(
  stylesheetLinks.map(async (tag) => {
    const href = tag.match(/\bhref="([^"]+)"/)?.[1]
    assert.ok(href?.startsWith('/_next/'), 'unexpected stylesheet location')
    if (previewUrl) return readPreview(href)
    return readFile(
      resolve(buildDirectory, href.slice('/_next/'.length)),
      'utf8'
    )
  })
)
const css = styles.join('\n')
const homeRule = css.match(/\.home-page\s*\{([^}]+)\}/)?.[1]
assert.ok(homeRule, 'viewport shell styles are missing')
// The production minifier may remove 100vh for targets that support dvh.
assert.match(
  homeRule,
  /min-height:\s*100dvh/,
  'visible viewport height is missing'
)
assert.match(
  css,
  /\.home-page\s*>\s*\*\s*\{[^}]*flex-shrink:\s*0/,
  'home header/footer can shrink'
)
console.log(
  `${previewUrl ? 'Live preview' : 'Production HTML'} includes the viewport shell and render-blocking layout CSS.`
)
