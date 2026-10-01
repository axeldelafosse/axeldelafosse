import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import Node from '../src/components/static-tweet/html/node'
import components from '../src/components/static-tweet/twitter-layout/components'
import { Tweet } from '../src/components/static-tweet/tweet'
import { ImageConfigContext } from 'next/dist/shared/lib/image-config-context.shared-runtime'
import { imageConfigDefault } from 'next/dist/shared/lib/image-config'

const render = (node) =>
  renderToStaticMarkup(
    <ImageConfigContext.Provider
      value={{ ...imageConfigDefault, qualities: [75, 80, 100] }}
    >
      <Node components={components} node={node} />
    </ImageConfigContext.Provider>
  )

describe('typed tweet rendering', () => {
  it('renders normal blockquotes and nested text', () => {
    const html = render({
      tag: 'blockquote',
      nodes: [{ tag: 'p', nodes: ['A quote.'] }]
    })
    assert.match(
      html,
      /<blockquote class="static-tweet-blockquote"><p class="static-tweet-p">A quote\.<\/p><\/blockquote>/
    )
  })
  it('renders complete cached tweets during SSR without fetching', () => {
    const html = renderToStaticMarkup(
      <Tweet
        id="123"
        ast={[
          {
            tag: 'div',
            data: {
              type: 'tweet',
              id: '123',
              username: 'example',
              name: 'Example',
              avatar: { normal: 'https://example.com/avatar.png' },
              createdAt: '2026-01-01',
              likes: 42
            },
            nodes: [{ tag: 'p', nodes: ['Cached text'] }]
          }
        ]}
      />
    )
    assert.match(html, /Cached text/)
    assert.match(html, /static-tweet-header-name/)
    assert.match(html, /42/)
  })
  it('keeps an unfetched quote as an ordinary link', () => {
    const html = render({
      tag: 'a',
      props: {
        dataType: 'quote-tweet',
        href: 'https://x.com/example/status/123'
      }
    })
    assert.match(html, /View quoted tweet/)
    assert.match(html, /href="https:\/\/x.com\/example\/status\/123"/)
  })
  it('renders poll proportions as percentages', () => {
    const html = render({
      tag: 'div',
      props: { dataType: 'poll-container' },
      data: {
        endsAt: '2020-01-01',
        options: [
          { position: 1, label: 'A', votes: 3 },
          { position: 2, label: 'B', votes: 1 }
        ]
      }
    })
    assert.match(html, /width:75%/)
    assert.match(html, /width:25%/)
    assert.match(html, /Final results/)
  })
  it('handles empty poll totals and formats an active poll duration', () => {
    const html = render({
      tag: 'div',
      props: { dataType: 'poll-container' },
      data: {
        endsAt: '2099-01-01',
        options: [{ position: 1, label: 'A', votes: 0 }]
      }
    })
    assert.match(html, /width:1%/)
    assert.match(html, /left/)
    assert.doesNotMatch(html, /NaN|Infinity/)
  })
  it('preserves media alt text and safely renders empty mentions', () => {
    assert.match(
      render({
        tag: 'img',
        props: {
          dataType: 'media-image',
          src: 'https://example.com/photo.jpg',
          alt: 'A photograph',
          width: 400,
          height: 300
        }
      }),
      /alt="A photograph"/
    )
    assert.doesNotThrow(() =>
      render({
        tag: 'a',
        props: { dataType: 'mention', href: 'https://x.com/example' }
      })
    )
  })
})
