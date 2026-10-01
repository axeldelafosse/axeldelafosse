import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { canonicalUrl, SITE_NAME, SITE_URL } from '../src/lib/site'
import { validatePostMetadata } from '../src/lib/post-validation'
import { createSitemap } from '../src/lib/sitemap'
import type { PostMetadata } from '../src/lib/post-data'

const post: PostMetadata = {
  uid: 'stable-id',
  slug: 'essay',
  title: 'An essay',
  description: 'About something.',
  date: '2020-01-01',
  dateLastModified: '2021-03-11'
}

describe('site metadata checks', () => {
  it('uses real defaults and one URL for queries, fragments and trailing slashes', () => {
    assert.ok(SITE_NAME)
    assert.doesNotMatch(SITE_URL, /undefined/)
    for (const path of [
      '/blog/essay',
      '/blog/essay/',
      '/blog/essay?ref=home#intro'
    ])
      assert.equal(canonicalUrl(path), `${SITE_URL}/blog/essay`)
    assert.equal(canonicalUrl('/'), `${SITE_URL}/`)
  })
  it('accepts authored dates, including future dates, without rewriting them', () => {
    assert.deepEqual(validatePostMetadata([post]), [])
    const future = {
      ...post,
      date: '2099-01-01',
      dateLastModified: '2099-01-01'
    }
    assert.deepEqual(validatePostMetadata([future]), [])
  })
  it('rejects empty descriptions, duplicate identities, bad dates and reversed updates', () => {
    assert.ok(
      validatePostMetadata([{ ...post, description: ' ' }]).some((error) =>
        error.includes('description')
      )
    )
    assert.ok(
      validatePostMetadata([post, post]).some((error) =>
        error.includes('duplicate')
      )
    )
    assert.ok(
      validatePostMetadata([{ ...post, date: '2020-02-31' }]).some((error) =>
        error.includes('invalid date')
      )
    )
    assert.ok(
      validatePostMetadata([{ ...post, dateLastModified: '2019-01-01' }]).some(
        (error) => error.includes('predates')
      )
    )
  })
  it('uses slugs and canonical URLs in the sitemap, includes talks, and handles no posts', () => {
    const xml = createSitemap([post])
    assert.ok(xml.includes(`<loc>${canonicalUrl('/blog/essay')}</loc>`))
    assert.ok(xml.includes(`<loc>${canonicalUrl('/talks')}</loc>`))
    assert.doesNotMatch(xml, /stable-id|undefined|Invalid Date/)
    assert.doesNotMatch(createSitemap([]), /lastmod|Invalid Date/)
  })
})
