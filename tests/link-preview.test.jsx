import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { cloneElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import CustomLink from '../src/components/custom-link'
import { LinkPreview } from '../src/components/link-preview'

// Control the real Radix root to exercise its conditional rendering without
// adding a test-only open prop to the public preview component.
function renderPreview(url, open) {
  const preview = LinkPreview({ url, children: 'Read more' })
  return renderToStaticMarkup(cloneElement(preview, { open }))
}

describe('On-demand link previews', () => {
  it('renders a link-heavy article without screenshot images or resource hints', () => {
    const html = renderToStaticMarkup(
      <article>
        {Array.from({ length: 100 }, (_, index) => (
          <CustomLink key={index} href={`https://example.com/${index}`}>
            Link {index}
          </CustomLink>
        ))}
      </article>
    )

    assert.equal([...html.matchAll(/<a\b/g)].length, 100)
    assert.doesNotMatch(
      html,
      /<img\b|rel="preload"|api\.microlink|images\.weserv/
    )
  })

  it('mounts one screenshot only while its card is open', () => {
    const url = 'https://example.com/article'
    const closed = renderPreview(url, false)
    const open = renderPreview(url, true)

    assert.equal(closed, `<a data-state="closed" href="${url}">Read more</a>`)
    assert.equal([...open.matchAll(/<img\b/g)].length, 1)
    assert.match(open, /width="200" height="125"/)
    assert.match(open, /data-side="top" data-align="center"/)
    assert.doesNotMatch(renderPreview(url, false), /<img\b|rel="preload"/)
  })

  it('preserves screenshot parameters and its destination for internal links', () => {
    const html = renderPreview('/blog/example', true)
    const src = html.match(/<img\b[^>]*\bsrc="([^"]+)"/)?.[1]
    assert.ok(src)
    const imageUrl = new URL(src.replaceAll('&amp;', '&'))
    const screenshotUrl = new URL(imageUrl.searchParams.get('url'))

    assert.equal(imageUrl.hostname, 'images.weserv.nl')
    assert.equal(screenshotUrl.hostname, 'api.microlink.io')
    assert.equal(
      screenshotUrl.searchParams.get('url'),
      'https://axeldelafosse.com/blog/example'
    )
    assert.equal(screenshotUrl.searchParams.get('screenshot'), 'true')
    assert.equal(screenshotUrl.searchParams.get('viewport.width'), '600')
    assert.equal(screenshotUrl.searchParams.get('viewport.height'), '375')
    assert.match(
      html,
      /<a href="\/blog\/example" target="_blank" rel="noopener noreferrer"/
    )
  })

  it('keeps the trigger and preview links separate when the card opens', () => {
    const preview = LinkPreview({
      url: 'https://example.com',
      asChild: true,
      children: (
        <a href="https://example.com" title="Read the original" tabIndex={0}>
          Original
        </a>
      )
    })
    const html = renderToStaticMarkup(cloneElement(preview, { open: true }))

    assert.equal([...html.matchAll(/<a\b/g)].length, 2)
    assert.equal([...html.matchAll(/<\/a>/g)].length, 2)
    assert.match(html, /title="Read the original" tabindex="0"/)
    assert.doesNotMatch(html, /<a\b[^>]*>(?:(?!<\/a>).)*<a\b/s)
  })
})
