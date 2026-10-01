import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import Blog from '../src/pages/blog'
import PostNavigation from '../src/components/post-navigation'
import PostDates from '../src/components/post-dates'
import { getAdjacentPosts } from '../src/lib/post-navigation'

describe('simple reading navigation', () => {
  it('renders quiet directional links with descriptive accessible names', () => {
    const html = renderToStaticMarkup(
      <PostNavigation
        previous={{ slug: 'older-essay', title: 'Older essay' }}
        next={{ slug: 'newer-essay', title: 'Newer essay' }}
      />
    )
    assert.match(html, /href="\/blog\/older-essay"/)
    assert.match(html, /href="\/blog\/newer-essay"/)
    assert.match(html, /aria-label="Previous post: Older essay"/)
    assert.match(html, /aria-label="Next post: Newer essay"/)
    assert.match(html, /rel="prev"/)
    assert.match(html, /rel="next"/)
    assert.match(html, /lg:-mx-36/)
    assert.equal([...html.matchAll(/<a /g)].length, 2)
    const visibleText = html.replace(/<[^>]*>/g, '')
    assert.doesNotMatch(visibleText, /essay|Read next|All posts/)
    assert.doesNotMatch(html, /rss|subscribe|iframe|button|border-t/i)
  })
  it('omits absent directions instead of rendering disabled or fake links', () => {
    assert.equal(
      renderToStaticMarkup(<PostNavigation previous={null} next={null} />),
      ''
    )
    const html = renderToStaticMarkup(
      <PostNavigation
        previous={null}
        next={{ slug: 'newer', title: 'Newer' }}
      />
    )
    assert.equal([...html.matchAll(/<a /g)].length, 1)
    assert.doesNotMatch(html, /rel="prev"/)
    assert.match(html, /col-start-2/)
  })
  it('selects chronological neighbors without sending their article bodies', () => {
    const posts = ['newest', 'middle', 'oldest'].map((slug) => ({
      slug,
      title: slug,
      body: 'not sent'
    }))
    const newest = { slug: 'newest', title: 'newest' }
    const middle = { slug: 'middle', title: 'middle' }
    const oldest = { slug: 'oldest', title: 'oldest' }
    assert.deepEqual(getAdjacentPosts('middle', posts), {
      previous: oldest,
      next: newest
    })
    assert.deepEqual(getAdjacentPosts('newest', posts), {
      previous: middle,
      next: null
    })
    assert.deepEqual(getAdjacentPosts('oldest', posts), {
      previous: null,
      next: middle
    })
    for (const [slug, list] of [
      ['gone', posts],
      ['only', [{ slug: 'only' }]],
      ['gone', []]
    ]) {
      assert.deepEqual(getAdjacentPosts(slug, list), {
        previous: null,
        next: null
      })
    }
  })
  it('separates index titles from dates without changing the plain list', () => {
    const html = renderToStaticMarkup(
      <RouterContext.Provider value={{ pathname: '/blog' }}>
        <Blog
          posts={[
            {
              uid: 'essay',
              slug: 'essay',
              title: 'Long title',
              date: '2020-01-01',
              dateLastModified: '2021-02-03'
            }
          ]}
        />
      </RouterContext.Provider>
    )
    assert.match(html, /<h2[^>]*><a[^>]*>Long title<\/a><\/h2><div/)
    assert.doesNotMatch(html, /Jan 1, 2020|· updated/)
    assert.match(html, /<time dateTime="2021-02-03"[^>]*>Feb 3, 2021/)
    assert.equal([...html.matchAll(/<time /g)].length, 1)
    assert.doesNotMatch(html, /<h2[^>]*>[\s\S]*?<time[^>]*>[\s\S]*?<\/h2>/)
  })
  it('shows only the latest-updated date without an extra label', () => {
    const html = renderToStaticMarkup(
      <PostDates
        dateLastModified="2026-10-01T00:00:00.000Z"
      />
    )
    assert.doesNotMatch(html, /updated/)
    assert.equal([...html.matchAll(/<time /g)].length, 1)
  })
})
