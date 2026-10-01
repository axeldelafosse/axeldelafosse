import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { describe, it } from 'node:test'

// Each process imports a fresh app with the same public environment variable
// that Next substitutes at build time. No browser or external requests are used.
const checkAnalytics = `
  import assert from 'node:assert/strict'
  import { Children, isValidElement } from 'react'
  import App, { reportWebVitals } from './src/pages/_app'
  import { LoadAnalytics, TrackPageView } from './src/lib/analytics'

  const id = process.env.NEXT_PUBLIC_GA
  const tree = App({
    Component: () => null,
    pageProps: {},
    router: { pathname: '/' }
  })

  function elements(node) {
    return Children.toArray(node).flatMap((child) =>
      isValidElement(child)
        ? [child, ...elements(child.props.children)]
        : []
    )
  }

  const nodes = elements(tree)
  const scripts = nodes.filter((node) => node.type === 'script')
  const loader = nodes.find((node) => node.type === LoadAnalytics)
  const tracker = nodes.find((node) => node.type === TrackPageView)
  const events = []
  globalThis.window = { gtag: (...event) => events.push(event) }
  reportWebVitals({ id: 'metric', name: 'CLS', label: 'web-vital', value: 0.1 })

  if (id) {
    assert.ok(loader, 'configured app must load analytics')
    assert.ok(tracker, 'configured app must mount the route listener')
    assert.equal(scripts.length, 1)
    assert.ok(scripts[0].props.dangerouslySetInnerHTML.__html.includes(id))
    const script = LoadAnalytics()
    assert.equal(script.props.src, 'https://www.googletagmanager.com/gtag/js?id=' + id)
    assert.equal(script.props.strategy, 'lazyOnload')
    assert.equal(events.length, 1)
    assert.equal(events[0][0], 'event')
    assert.equal(events[0][1], 'CLS')
    assert.equal(events[0][2].value, 100)
  } else {
    assert.equal(loader, undefined, 'unconfigured app must not load analytics')
    assert.equal(tracker, undefined, 'unconfigured app must not mount a route listener')
    assert.equal(scripts.length, 0, 'unconfigured app must not bootstrap gtag')
    assert.equal(LoadAnalytics(), null)
    assert.equal(events.length, 0)
  }
`

describe('Optional analytics', () => {
  for (const id of [undefined, '', 'G-TEST123']) {
    it(`initializes analytics only with a configured ID (${id ?? 'unset'})`, () => {
      const env = { ...process.env }
      if (id === undefined) delete env.NEXT_PUBLIC_GA
      else env.NEXT_PUBLIC_GA = id

      const result = spawnSync(process.execPath, ['--eval', checkAnalytics], {
        cwd: new URL('..', import.meta.url),
        env,
        encoding: 'utf8'
      })
      assert.equal(result.status, 0, result.stderr || result.stdout)
    })
  }
})
