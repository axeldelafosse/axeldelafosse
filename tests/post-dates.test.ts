import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import PostHead from '../src/components/post-head'
import {
  formatPostDate,
  formatShortPostDate,
  hasPostUpdate
} from '../src/lib/post-date'

const cases = [
  ['2026-10-01', 'Thu Oct 01 2026'],
  ['2026-10-01T00:00:00.000Z', 'Thu Oct 01 2026'],
  ['2026-01-01T00:00:00.000Z', 'Thu Jan 01 2026'],
  ['2024-02-29T00:00:00.000Z', 'Thu Feb 29 2024'],
  ['2026-03-08T00:00:00.000Z', 'Sun Mar 08 2026'],
  ['2026-11-01T00:00:00.000Z', 'Sun Nov 01 2026']
]

describe('authored post dates', () => {
  it('keeps calendar dates, month/year boundaries, leap days and DST dates', () => {
    for (const [value, expected] of cases) {
      assert.equal(formatPostDate(value), expected)
    }
  })

  for (const timezone of [
    'UTC',
    'America/Los_Angeles',
    'Pacific/Honolulu',
    'Asia/Tokyo',
    'Pacific/Kiritimati'
  ]) {
    it(`is unchanged when rendered in ${timezone}`, () => {
      const moduleUrl = new URL('../src/lib/post-date.ts', import.meta.url).href
      const script = `import { formatPostDate, formatShortPostDate } from ${JSON.stringify(moduleUrl)};
        console.log(JSON.stringify({ full: ${JSON.stringify(cases)}.map(([value]) => formatPostDate(value)), short: formatShortPostDate('2026-10-01T00:00:00.000Z') }));`
      const result = spawnSync(process.execPath, ['-e', script], {
        env: { ...process.env, TZ: timezone },
        encoding: 'utf8'
      })
      assert.equal(result.status, 0, result.stderr)
      assert.deepEqual(JSON.parse(result.stdout), {
        full: cases.map(([, expected]) => expected),
        short: 'Oct 1, 2026'
      })
    })
  }

  it('renders the modified calendar date in the post header with its machine-readable value', () => {
    const html = renderToStaticMarkup(
      createElement(PostHead, {
        uid: 'example-post',
        slug: 'example-post',
        title: 'Example post',
        description: 'Date regression test',
        date: '2026-08-29T00:00:00.000Z',
        dateLastModified: '2026-10-01T00:00:00.000Z'
      })
    )
    assert.match(
      html,
      /<time[^>]*dateTime="2026-10-01T00:00:00.000Z"[^>]*>Oct 1, 2026<\/time>/i
    )
    assert.doesNotMatch(html, /Aug 29, 2026|updated|Wed Sep 30 2026/)
    assert.equal([...html.matchAll(/<time /g)].length, 1)
  })

  it('only labels a separate update when the calendar day differs', () => {
    assert.equal(formatShortPostDate('2026-10-01'), 'Oct 1, 2026')
    assert.equal(hasPostUpdate('2026-10-01', '2026-10-01T00:00:00.000Z'), false)
    assert.equal(hasPostUpdate('2026-08-29', '2026-10-01'), true)
  })
})
