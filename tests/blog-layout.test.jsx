import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import BlogLayout from '../src/components/blog-layout'

function renderLayout(pathname, onEdit) {
  return renderToStaticMarkup(
    createElement(
      RouterContext.Provider,
      { value: { pathname } },
      createElement(BlogLayout, { onEdit }, 'Post content')
    )
  )
}

describe('blog header edit control', () => {
  it('omits editing when the local-only handler is unavailable', () => {
    const html = renderLayout('/blog/[slug]')
    assert.doesNotMatch(html, /\bedit\b|✍︎|\/tree\/master\/blog\//)
    assert.match(html, /aria-label="Switch to light mode"/)
    assert.match(html, /Post content/)
  })

  it('retains the edit button when the localhost page supplies its handler', () => {
    const html = renderLayout('/blog/[slug]', () => {})
    assert.match(html, /<button[^>]*>edit <span/)
    assert.doesNotMatch(html, /\/tree\/master\/blog\//)
    assert.match(html, /aria-label="Switch to light mode"/)
  })

  it('does not show an edit button on listing pages', () => {
    for (const pathname of ['/blog', '/talks']) {
      assert.doesNotMatch(
        renderLayout(pathname, () => {}),
        /\bedit\b|✍︎/
      )
    }
  })
})
