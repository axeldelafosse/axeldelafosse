import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getMDXComponent } from 'next-contentlayer2/hooks'
import type { NextApiRequest, NextApiResponse } from 'next'
import { applyInlineTextEdits } from '../src/lib/inline-markdown'
import {
  assertLocalEditorRequest,
  assertLocalPostSlug,
  LocalPostEditorError,
  localPostRevision,
  MAX_LOCAL_POST_BYTES,
  previewLocalPost,
  readLocalPost,
  saveLocalPost
} from '../src/lib/local-post-editor'
import handler from '../src/pages/api/local-posts/[slug]'

function source(body = '# A post\n\nHello, world!') {
  return `---\nuid: example-post\ntitle: A post\ndescription: An example post\ndate: '2026-09-01'\ndateLastModified: '2026-09-26'\ntags: [writing]\n---\n\n${body}\n`
}

function status(expected: number) {
  return (error: unknown) =>
    error instanceof LocalPostEditorError && error.status === expected
}

function request(method = 'GET') {
  return {
    method,
    headers: {
      host: 'localhost:3000',
      ...(method === 'GET'
        ? {}
        : {
            origin: 'http://localhost:3000',
            'content-type': 'application/json',
            'x-local-editor': '1'
          })
    } as Record<string, string | string[] | undefined>,
    socket: { remoteAddress: '127.0.0.1', encrypted: false }
  }
}

describe('local editor access guard', () => {
  it('is unavailable outside development before inspecting request details', () => {
    const inaccessible = new Proxy(
      {},
      {
        get() {
          throw new Error('Request inspected')
        }
      }
    )
    for (const environment of ['production', 'test', undefined]) {
      assert.throws(
        () =>
          assertLocalEditorRequest(
            inaccessible as ReturnType<typeof request>,
            environment ?? ''
          ),
        status(404)
      )
    }
  })

  it('accepts direct IPv4/IPv6 localhost requests and same-origin JSON writes', () => {
    for (const method of ['GET', 'POST', 'PUT']) {
      assert.doesNotThrow(() =>
        assertLocalEditorRequest(request(method), 'development')
      )
    }
    const ipv6 = request('PUT')
    ipv6.headers.host = '[::1]:3000'
    ipv6.headers.origin = 'http://[::1]:3000'
    ipv6.socket.remoteAddress = '::1'
    assert.doesNotThrow(() => assertLocalEditorRequest(ipv6, 'development'))
    const mapped = request()
    mapped.socket.remoteAddress = '::ffff:127.0.0.1'
    assert.doesNotThrow(() => assertLocalEditorRequest(mapped, 'development'))
  })

  it('rejects public hosts, forged proxy headers, remote peers, and rebinding hosts', () => {
    for (const host of [
      'example.com:3000',
      'localhost.evil.test:3000',
      'localhost:3000@evil.test',
      '127.0.0.1:3000/path',
      'localhost:3000#fragment'
    ]) {
      const req = request()
      req.headers.host = host
      req.headers['x-forwarded-host'] = 'localhost:3000'
      assert.throws(
        () => assertLocalEditorRequest(req, 'development'),
        status(403)
      )
    }
    const remote = request()
    remote.socket.remoteAddress = '192.168.1.2'
    remote.headers['x-forwarded-for'] = '127.0.0.1'
    assert.throws(
      () => assertLocalEditorRequest(remote, 'development'),
      status(403)
    )
  })

  it('rejects cross-origin requests, missing write guards, and non-JSON forms', () => {
    for (const method of ['GET', 'POST', 'PUT']) {
      const req = request(method)
      req.headers.origin = 'https://evil.example'
      assert.throws(
        () => assertLocalEditorRequest(req, 'development'),
        status(403)
      )
      req.headers.origin = 'http://localhost:3000'
      req.headers['sec-fetch-site'] = 'cross-site'
      assert.throws(
        () => assertLocalEditorRequest(req, 'development'),
        status(403)
      )
    }
    for (const field of ['origin', 'x-local-editor']) {
      const req = request('PUT')
      delete req.headers[field]
      assert.throws(
        () => assertLocalEditorRequest(req, 'development'),
        status(403)
      )
    }
    const form = request('POST')
    form.headers['content-type'] = 'text/plain'
    assert.throws(
      () => assertLocalEditorRequest(form, 'development'),
      status(415)
    )
    const multiple = request()
    multiple.headers.host = ['localhost:3000', 'evil.example']
    assert.throws(
      () => assertLocalEditorRequest(multiple, 'development'),
      status(403)
    )
    assert.throws(
      () => assertLocalEditorRequest(request('DELETE'), 'development'),
      status(405)
    )
  })

  it('only accepts one simple post slug, without traversal or encoded paths', () => {
    for (const slug of [
      '../secret',
      '%2e%2e%2fsecret',
      'archive/post',
      'post.mdx',
      'post\\name',
      ['example-post'],
      undefined,
      'x'.repeat(181)
    ]) {
      assert.throws(() => assertLocalPostSlug(slug), status(400))
    }
    assert.doesNotThrow(() => assertLocalPostSlug('example-post'))
  })
})

describe('local Markdown file editing', () => {
  let directory: string
  let filename: string
  let options: { blogDirectory: string }
  beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'local-post-editor-test-'))
    filename = path.join(directory, 'example-post.mdx')
    options = { blogDirectory: directory }
    await writeFile(filename, source())
  })
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  it('reads exact Markdown with a content-based revision', async () => {
    const original = `\uFEFF${source().replace(/\n/g, '\r\n')}`
    await writeFile(filename, original)
    assert.deepEqual(await readLocalPost('example-post', options), {
      source: original,
      revision: localPostRevision(original)
    })
  })

  it('never creates posts or follows symlinks, directories, or a symlinked blog root', async () => {
    await assert.rejects(readLocalPost('missing', options), status(404))
    await assert.rejects(
      previewLocalPost('missing', source(), options),
      status(404)
    )
    await assert.rejects(
      saveLocalPost('missing', source(), 'a'.repeat(64), options),
      status(404)
    )
    await symlink(filename, path.join(directory, 'linked-post.mdx'))
    await assert.rejects(readLocalPost('linked-post', options), status(404))
    await assert.rejects(
      saveLocalPost(
        'linked-post',
        source(),
        localPostRevision(source()),
        options
      ),
      status(404)
    )
    await mkdir(path.join(directory, 'directory-post.mdx'))
    await assert.rejects(readLocalPost('directory-post', options), status(404))
    const linkedRoot = path.join(directory, 'linked-root')
    await symlink(directory, linkedRoot)
    await assert.rejects(
      readLocalPost('example-post', { blogDirectory: linkedRoot }),
      status(404)
    )
  })

  it('previews headings, GFM, code titles, and static components without touching disk', async () => {
    const markdown = source(
      '# Heading\n\n| One | Two |\n| --- | --- |\n| A | B |\n\n~~deleted~~\n\n```js:example.js\nconst x = 1\n```\n\n<Tweet id="123" />'
    )
    const preview = await previewLocalPost('example-post', markdown, options)
    const Component = getMDXComponent(preview.code)
    const html = renderToStaticMarkup(
      createElement(Component, {
        components: {
          Tweet: ({ id }: { id: string }) => createElement('span', {}, id),
          LocalInlineText: ({ children }: { children: ReactNode }) => children
        }
      })
    )
    assert.match(html, /id="heading"/)
    assert.match(html, /class="anchor" href="#heading"/)
    assert.match(html, /<table>/)
    assert.match(html, /<del>deleted<\/del>/)
    assert.match(html, /rehype-code-title/)
    assert.match(html, /example\.js/)
    assert.match(html, /<span>123<\/span>/)
    assert.equal(preview.metadata.date, '2026-09-01T00:00:00.000Z')
    assert.equal(preview.metadata.dateLastModified, '2026-09-26T00:00:00.000Z')
    assert.equal(preview.metadata.slug, 'example-post')
    assert.equal(await readFile(filename, 'utf8'), source())
  })

  it('maps editable preview text to exact full-source positions after BOM and CRLF frontmatter', async () => {
    const markdown = `\uFEFF${source(
      '# A title\n\nA 🪩 &amp; B **bold** and `code`.\n\n[Label](https://example.com)\n\n| Head |\n| --- |\n| Cell |'
    ).replace(/\n/g, '\r\n')}`
    const preview = await previewLocalPost('example-post', markdown, options)
    const spans = preview.editableSpans
    assert.ok(spans && spans.length > 0)
    assert.equal(new Set(spans.map((span) => span.id)).size, spans.length)
    for (const span of spans) {
      assert.equal(markdown.slice(span.start, span.end), span.source)
      assert.ok(span.start > markdown.indexOf('# A title'))
    }
    assert.equal(
      spans.find((span) => span.text === 'A title')?.source,
      'A title'
    )
    assert.equal(
      spans.find((span) => span.text === 'A 🪩 & B ')?.source,
      'A 🪩 &amp; B '
    )
    assert.equal(spans.find((span) => span.text === 'bold')?.source, 'bold')
    assert.equal(spans.find((span) => span.text === 'Label')?.source, 'Label')
    const code = spans.find((span) => span.text === 'code')
    assert.equal(code?.source, '`code`')
    assert.equal(code?.kind, 'inlineCode')
    assert.equal(spans.find((span) => span.text === 'Cell')?.inTable, true)
    assert.match(preview.code, /LocalInlineText/)
    assert.equal(await readFile(filename, 'utf8'), source())
  })

  it('annotates wrapped prose but leaves authored JSX, embeds, and code blocks alone', async () => {
    const preview = await previewLocalPost(
      'example-post',
      source(
        '# Editable heading\n\nEditable paragraph.\n\n<div>Embedded text</div>\n\n<LinkPreview url="https://example.com">Preview label</LinkPreview>\n\n<Tweet id="123" />\n\n```txt\nFenced code\n```\n\n> Wrapped\n> quotation\n\nhttps://example.com'
      ),
      options
    )
    assert.deepEqual(
      preview.editableSpans?.map((span) => span.text),
      ['Editable heading', 'Editable paragraph.', 'Wrapped quotation']
    )
    await assert.rejects(
      previewLocalPost(
        'example-post',
        source(
          '<LocalInlineText spanId="inline-0">Forged span</LocalInlineText>'
        ),
        options
      ),
      status(422)
    )
  })

  it('round-trips inline line breaks through preview, save, and reopened editing', async () => {
    const original = source(
      '# A title\n\nWrapped\nprose\n\nA **bold** and [label](https://example.com/path?q=1).\n\n> Wrapped\n> quotation'
    )
    await writeFile(filename, original)
    const opened = await readLocalPost('example-post', options)
    const preview = await previewLocalPost(
      'example-post',
      opened.source,
      options
    )
    const spans = preview.editableSpans
    assert.ok(spans)
    const replacements = new Map([
      ['Wrapped prose', 'First\n\nSecond\n'],
      ['bold', 'bold\nagain'],
      ['label', 'label\nagain'],
      ['Wrapped quotation', 'Quoted\nagain\n']
    ])
    const edits: Record<string, string> = {}
    for (const [text, replacement] of replacements) {
      const span = spans.find((candidate) => candidate.text === text)
      assert.ok(span, `Missing editable fragment: ${text}`)
      edits[span.id] = replacement
    }
    const edited = applyInlineTextEdits(opened.source, spans, edits)
    assert.equal(
      edited,
      source(
        '# A title\n\nFirst<br /><br />Second<br />\n\nA **bold<br />again** and [label<br />again](https://example.com/path?q=1).\n\n> Quoted<br />again<br />'
      )
    )

    const nextPreview = await previewLocalPost('example-post', edited, options)
    for (const replacement of replacements.values()) {
      assert.ok(
        nextPreview.editableSpans?.some((span) => span.text === replacement),
        `Line breaks must remain in one editable fragment: ${replacement}`
      )
    }
    const saved = await saveLocalPost(
      'example-post',
      edited,
      opened.revision,
      options
    )
    assert.doesNotMatch(saved.code, /LocalInlineText/)
    assert.equal(saved.editableSpans, undefined)
    const SavedPost = getMDXComponent(saved.code)
    const html = renderToStaticMarkup(createElement(SavedPost))
    assert.match(html, /<p>First<br\/><br\/>Second<br\/><\/p>/)
    assert.match(html, /<strong>bold<br\/>again<\/strong>/)
    assert.match(
      html,
      /<a href="https:\/\/example\.com\/path\?q=1">label<br\/>again<\/a>/
    )
    assert.match(html, /<blockquote>\s*<p>Quoted<br\/>again<br\/><\/p>/)

    const reopened = await readLocalPost('example-post', options)
    assert.equal(reopened.source, edited)
    const reopenedPreview = await previewLocalPost(
      'example-post',
      reopened.source,
      options
    )
    const reopenedSpans = reopenedPreview.editableSpans
    assert.ok(reopenedSpans)
    const reopenedProse = reopenedSpans.find(
      (span) => span.text === 'First\n\nSecond\n'
    )
    assert.ok(reopenedProse)
    const editedAgain = applyInlineTextEdits(reopened.source, reopenedSpans, {
      [reopenedProse.id]: 'One line again'
    })
    assert.equal(
      editedAgain,
      edited.replace('First<br /><br />Second<br />', 'One line again')
    )
    const resaved = await saveLocalPost(
      'example-post',
      editedAgain,
      reopened.revision,
      options
    )
    assert.equal(await readFile(filename, 'utf8'), editedAgain)
    assert.doesNotMatch(resaved.code, /LocalInlineText/)
  })

  it('atomically saves exact validated source, preserves permissions, and returns the new preview', async () => {
    await chmod(filename, 0o664)
    const original = await readLocalPost('example-post', options)
    const edited = source('# A changed post\n\nMore writing — with unicode.')
    const result = await saveLocalPost(
      'example-post',
      edited,
      original.revision,
      options
    )
    assert.equal(result.revision, localPostRevision(edited))
    assert.equal(await readFile(filename, 'utf8'), edited)
    assert.equal((await stat(filename)).mode & 0o777, 0o664)
    assert.equal(result.metadata.title, 'A post')
    assert.match(result.code, /A changed post/)
    assert.doesNotMatch(result.code, /LocalInlineText/)
    assert.equal(result.editableSpans, undefined)
    assert.deepEqual(await readdir(directory), ['example-post.mdx'])
  })

  it('rejects stale revisions and serializes simultaneous saves', async () => {
    const opened = await readLocalPost('example-post', options)
    await writeFile(filename, source('Changed externally'))
    await assert.rejects(
      saveLocalPost(
        'example-post',
        source('Editor changes'),
        opened.revision,
        options
      ),
      status(409)
    )
    assert.equal(await readFile(filename, 'utf8'), source('Changed externally'))
    const current = await readLocalPost('example-post', options)
    const results = await Promise.allSettled([
      saveLocalPost(
        'example-post',
        source('First save'),
        current.revision,
        options
      ),
      saveLocalPost(
        'example-post',
        source('Second save'),
        current.revision,
        options
      )
    ])
    assert.equal(
      results.filter((result) => result.status === 'fulfilled').length,
      1
    )
    const failed = results.find((result) => result.status === 'rejected')
    assert.ok(failed?.status === 'rejected' && status(409)(failed.reason))
    assert.deepEqual(await readdir(directory), ['example-post.mdx'])
  })

  it('rejects invalid frontmatter and MDX without changing a byte', async () => {
    const invalidSources = [
      '# No frontmatter',
      source().replace('uid: example-post', 'uid: renamed-post'),
      source().replace('title: A post', 'title: []'),
      source().replace('title: A post', 'title: A post\ntitle: Duplicate'),
      source().replace('description: An example post', 'description: ""'),
      source().replace('2026-09-01', '2026-02-30'),
      source().replace('2026-09-01', 'not-a-date'),
      source().replace('tags: [writing]', 'unknown: value'),
      source().replace(
        'tags: [writing]',
        'tags: !!js/function "function () {}"'
      ),
      source().replace('tags: [writing]', 'tags: &x [*x]'),
      source('<div>'),
      source('<MissingComponent />'),
      source('<Tweet id={123} />'),
      source('<div {...props} />'),
      source('<div onClick="alert(1)" />'),
      source('<div style="color:red">No string styles</div>'),
      source('<div ref="invalid-ref" />'),
      source('<Tweet />'),
      source('<Tweet id="not-a-number" />'),
      source('<LinkPreview>Missing url</LinkPreview>'),
      source(
        '<LinkPreview url="https://example.com" asChild="false">Invalid boolean</LinkPreview>'
      ),
      source('<script>alert(1)</script>'),
      source('import secret from "../../.env"\n\n# Nope'),
      source('export const value = process.env.SECRET\n\n# Nope'),
      source('{globalThis.__localPostEditorExecuted = true}')
    ]
    const original = await readLocalPost('example-post', options)
    for (const invalidSource of invalidSources) {
      await assert.rejects(
        saveLocalPost(
          'example-post',
          invalidSource,
          original.revision,
          options
        ),
        status(422),
        invalidSource
      )
      assert.equal(await readFile(filename, 'utf8'), original.source)
    }
    assert.equal('__localPostEditorExecuted' in globalThis, false)
    assert.deepEqual(await readdir(directory), ['example-post.mdx'])
  })

  it('bounds source and file sizes and rejects invalid UTF-8', async () => {
    await assert.rejects(
      previewLocalPost(
        'example-post',
        'é'.repeat(MAX_LOCAL_POST_BYTES),
        options
      ),
      status(413)
    )
    await assert.rejects(
      saveLocalPost('example-post', null, 'a'.repeat(64), options),
      status(400)
    )
    await assert.rejects(
      saveLocalPost('example-post', source(), 'old revision', options),
      status(400)
    )
    await writeFile(filename, Buffer.alloc(MAX_LOCAL_POST_BYTES + 1))
    await assert.rejects(readLocalPost('example-post', options), status(413))
    await writeFile(filename, Buffer.from([0xff, 0xfe]))
    await assert.rejects(readLocalPost('example-post', options), status(422))
  })
})

describe('local editor API boundary', () => {
  async function responseFor(
    environment: string,
    chunks: string[],
    overrides: Partial<ReturnType<typeof request>> = {}
  ) {
    const oldEnvironment = process.env.NODE_ENV
    Object.assign(process.env, { NODE_ENV: environment })
    const req = Object.assign(
      Readable.from(chunks),
      request('PUT'),
      { query: { slug: 'example-post' } },
      overrides
    ) as unknown as NextApiRequest
    let responseStatus = 0
    let body: unknown
    const headers: Record<string, string> = {}
    const res = {
      setHeader(name: string, value: string) {
        headers[name] = value
      },
      status(value: number) {
        responseStatus = value
        return this
      },
      json(value: unknown) {
        body = value
      }
    } as unknown as NextApiResponse
    try {
      await handler(req, res)
      return { status: responseStatus, body, headers }
    } finally {
      if (oldEnvironment === undefined)
        Reflect.deleteProperty(process.env, 'NODE_ENV')
      else Object.assign(process.env, { NODE_ENV: oldEnvironment })
    }
  }

  it('returns production 404 with no-cache headers before parsing input or opening files', async () => {
    const result = await responseFor('production', ['not valid JSON'])
    assert.equal(result.status, 404)
    assert.deepEqual(result.body, { error: 'Not found' })
    assert.equal(result.headers['Cache-Control'], 'no-store')
  })

  it('rejects malformed or excessive JSON bodies before opening a post', async () => {
    for (const body of ['not JSON', '[]', 'null']) {
      assert.equal((await responseFor('development', [body])).status, 400)
    }
    assert.equal(
      (await responseFor('development', ['x'.repeat(MAX_LOCAL_POST_BYTES + 1)]))
        .status,
      413
    )
    assert.equal(
      (
        await responseFor('development', ['{}'], {
          headers: { host: 'public.example' }
        })
      ).status,
      403
    )
  })
})
