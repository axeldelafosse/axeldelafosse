import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { HeadManagerContext } from 'next/dist/shared/lib/head-manager-context.shared-runtime'
import PostHead from '../src/components/post-head'
import { canonicalUrl, SITE_NAME } from '../src/lib/site'

function headFor(title = 'An essay') {
  let head = []
  renderToStaticMarkup(
    <HeadManagerContext.Provider
      value={{
        mountedInstances: new Set(),
        updateHead: (elements) => {
          head = elements
        }
      }}
    >
      <PostHead
        uid="old-identity"
        slug="current-slug"
        title={title}
        description="A short description."
        date="2026-01-01"
        dateLastModified="2026-02-01"
      />
    </HeadManagerContext.Provider>
  )
  return renderToStaticMarkup(<>{head}</>)
}

describe('post head metadata', () => {
  it('renders a real title and uses the route slug for both canonical and social URLs', () => {
    const html = headFor()
    assert.ok(html.includes(`An essay - ${SITE_NAME}</title>`))
    assert.ok(
      html.includes(
        `rel="canonical" href="${canonicalUrl('/blog/current-slug')}"`
      )
    )
    assert.doesNotMatch(html, /old-identity|<title[^>]*><\/title>/)
  })
  it('keeps authored markup-like text inside JSON-LD without closing its script', () => {
    const html = headFor('Text </script><script>example</script>')
    const raw = html.match(
      /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/
    )[1]
    assert.ok(!raw.includes('<'))
    assert.equal(
      JSON.parse(raw).headline,
      'Text </script><script>example</script>'
    )
  })
})
