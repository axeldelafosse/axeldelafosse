import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Post } from 'contentlayer2/generated'

import { getPostPageData, getPostSummaries } from '../src/lib/post-data'

function post(uid: string, date: string, directory = '.'): Post {
  return {
    uid,
    slug: uid,
    title: uid,
    description: 'Description',
    date,
    dateLastModified: date,
    body: {
      raw: 'Original markdown must stay on the server',
      code: 'Compiled MDX'
    },
    _raw: { sourceFileDir: directory },
    tags: ['test'],
    readingTime: { minutes: 1 }
  } as Post
}

describe('static page payloads', () => {
  it('only sends listing fields, sorted by publication date even after an older post is updated', () => {
    const input = [
      post('older', '2020-01-01'),
      post('archive', '2026-01-01', 'archive'),
      post('newer', '2025-01-01')
    ]
    input[0].dateLastModified = '2026-02-01'
    const summaries = getPostSummaries(input)
    assert.deepEqual(
      summaries.map((summary) => summary.uid),
      ['newer', 'older']
    )
    assert.deepEqual(
      input.map((document) => document.uid),
      ['older', 'archive', 'newer']
    )
    for (const summary of summaries) {
      assert.deepEqual(Object.keys(summary).sort(), [
        'date',
        'dateLastModified',
        'slug',
        'title',
        'uid'
      ])
    }
    assert.deepEqual(getPostSummaries([]), [])
  })

  it('keeps article metadata and compiled MDX, but removes duplicate raw text and build metadata', () => {
    const document = post('article', '2026-01-01')
    const result = getPostPageData(document)
    assert.deepEqual(result, {
      uid: document.uid,
      slug: document.slug,
      title: document.title,
      description: document.description,
      date: document.date,
      dateLastModified: document.dateLastModified,
      body: { code: document.body.code }
    })
    assert.ok(document.body.raw, 'source document is not mutated')
  })
})
