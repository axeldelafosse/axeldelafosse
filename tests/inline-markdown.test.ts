import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { compile } from '@mdx-js/mdx'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getMDXComponent } from 'next-contentlayer2/hooks'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import {
  applyInlineTextEdit,
  applyInlineTextEdits,
  createInlineMarkdownPlugin,
  type InlineMarkdownSpan
} from '../src/lib/inline-markdown'

async function render(source: string, prefix = '', annotate = true) {
  const spans: InlineMarkdownSpan[] = []
  const compiled = await compile(source.slice(prefix.length), {
    outputFormat: 'function-body',
    remarkPlugins: [
      remarkGfm,
      ...(annotate
        ? [createInlineMarkdownPlugin(source, prefix.length, spans)]
        : [])
    ],
    rehypePlugins: [rehypeSlug]
  })
  const Component = getMDXComponent(
    `return (function () {\n${String(compiled)}\n}).call(null, _jsx_runtime);`
  )
  const html = renderToStaticMarkup(
    createElement(Component, {
      components: {
        LocalInlineText: ({
          spanId,
          children
        }: {
          spanId: string
          children: ReactNode
        }) => createElement('span', { 'data-local-edit': spanId }, children),
        Tweet: () => createElement('span', {}, 'An embedded tweet')
      }
    })
  )
  return { spans, html }
}

function withText(spans: InlineMarkdownSpan[], text: string) {
  const span = spans.find((entry) => entry.text === text)
  assert.ok(span, `Missing fragment ${JSON.stringify(text)}`)
  return span
}

describe('source-preserving inline Markdown edits', () => {
  it('keeps no-op edits byte-identical including BOM, CRLF, frontmatter and escapes', async () => {
    const prefix = '\uFEFF---\r\ntitle: "Untouched"\r\n---\r\n'
    const original = `${prefix}# 🪩 Heading\r\n\r\nA &amp; B and **bold** and \\*literal\\*.\r\n`
    const { spans, html } = await render(original, prefix)
    assert.match(html, /id="-heading"/)
    assert.ok(spans.length >= 4)
    for (const span of spans) {
      assert.equal(original.slice(span.start, span.end), span.source)
      assert.ok(span.start >= prefix.length)
      assert.equal(applyInlineTextEdit(original, span, span.text), original)
    }
    assert.equal(
      applyInlineTextEdits(
        original,
        spans,
        Object.fromEntries(spans.map((span) => [span.id, span.text]))
      ),
      original
    )
  })

  it('preserves formatting, link destinations, list prefixes and all unrelated bytes', async () => {
    const original =
      '# A **bold** _gentle_ ~~older~~ heading\n\n- A label\n\n> A quote\n\n[Example](https://example.com/a?q=b#part "Keep this title")\n'
    const { spans } = await render(original)
    for (const text of [
      'bold',
      'gentle',
      'older',
      'A label',
      'A quote',
      'Example'
    ]) {
      const span = withText(spans, text)
      const changed = applyInlineTextEdit(original, span, 'Changed')
      assert.equal(
        changed,
        original.slice(0, span.start) + 'Changed' + original.slice(span.end)
      )
    }
    const label = withText(spans, 'Example')
    assert.ok(
      applyInlineTextEdit(original, label, 'A new label').endsWith(
        '[A new label](https://example.com/a?q=b#part "Keep this title")\n'
      )
    )
  })

  it('retains visible heading text for generated heading IDs', async () => {
    const { html } = await render('# An **important** heading')
    assert.match(html, /<h1 id="an-important-heading">/)
    assert.match(
      html,
      /<strong><span data-local-edit="inline-1">important<\/span><\/strong>/
    )
  })

  it('escapes new Markdown, MDX, entities and punctuation as literal visible text', async () => {
    const original = 'Old text'
    const { spans } = await render(original)
    const text =
      '# Hello *new* [label](url) <div> {alert(1)} &amp; C:\\foo | ~~gone~~ — é 🪩'
    const changed = applyInlineTextEdit(original, spans[0], text)
    assert.equal(
      (await render(changed, '', false)).html,
      renderToStaticMarkup(createElement('p', {}, text))
    )
  })

  it('preserves emphasis boundaries when edits introduce leading or trailing spaces', async () => {
    const original = '**bold**'
    const { spans } = await render(original)
    for (const text of [' leading', 'trailing ', ' both ']) {
      const changed = applyInlineTextEdit(original, spans[0], text)
      assert.equal(
        (await render(changed, '', false)).html,
        renderToStaticMarkup(
          createElement('p', {}, createElement('strong', {}, text))
        )
      )
    }
  })

  it('keeps a link reference and its destination unchanged', async () => {
    const original =
      '[Original][destination]\n\n[destination]: https://example.com/path "Original title"\n'
    const { spans } = await render(original)
    assert.equal(spans.length, 1)
    const changed = applyInlineTextEdit(original, spans[0], 'New label')
    assert.equal(changed, original.replace('Original]', 'New label]'))
    assert.match(
      (await render(changed)).html,
      /href="https:\/\/example.com\/path" title="Original title"/
    )
  })

  it('does not expose collapsed or shortcut link labels whose text is also their destination key', async () => {
    const original =
      '[Reference][] and [Shortcut]\n\n[Reference]: https://example.com/a\n[Shortcut]: https://example.com/b'
    const { spans } = await render(original)
    assert.deepEqual(
      spans.map((span) => span.text),
      [' and ']
    )
  })

  it('keeps GFM table delimiters intact when text or code contains pipes', async () => {
    const original = '| Text | Code |\n| --- | --- |\n| Plain | `value` |\n'
    const { spans } = await render(original)
    const textSpan = withText(spans, 'Plain')
    const codeSpan = withText(spans, 'value')
    assert.equal(codeSpan.inTable, true)
    const changed = applyInlineTextEdits(original, spans, {
      [textSpan.id]: 'one | two',
      [codeSpan.id]: 'a | b'
    })
    const { html } = await render(changed, '', false)
    assert.equal((html.match(/<td>/g) ?? []).length, 2)
    assert.match(html, /<td>one \| two<\/td>/)
    assert.match(html, /<td><code>a \| b<\/code><\/td>/)
  })

  it('chooses inline-code fences without losing backticks or edge whitespace', async () => {
    const original = '`old`'
    const { spans, html } = await render(original)
    assert.equal(spans[0].kind, 'inlineCode')
    assert.match(
      html,
      /<span data-local-edit="inline-0"><code>old<\/code><\/span>/
    )
    for (const text of [
      '`',
      'a `` b',
      '`edge',
      'edge`',
      ' both ',
      ' leading',
      'trailing ',
      '<>{}&*'
    ]) {
      const changed = applyInlineTextEdit(original, spans[0], text)
      assert.equal(
        (await render(changed, '', false)).html,
        renderToStaticMarkup(
          createElement('p', {}, createElement('code', {}, text))
        ),
        text
      )
    }
  })

  it('rejects unrepresentable table-code escapes and intraword emphasis changes safely', async () => {
    const table = '| C |\n|---|\n| `old` |'
    const tableSpan = withText((await render(table)).spans, 'old')
    assert.throws(
      () => applyInlineTextEdit(table, tableSpan, 'a \\| b'),
      /Markdown editor/
    )
    const representable = 'a \\\\| b'
    assert.ok(
      (
        await render(
          applyInlineTextEdit(table, tableSpan, representable),
          '',
          false
        )
      ).html.includes(
        renderToStaticMarkup(createElement('code', {}, representable))
      )
    )
    const emphasis = 'a**old**b'
    const emphasisSpan = withText((await render(emphasis)).spans, 'old')
    for (const text of ['!', ' punctuation', 'word!']) {
      assert.throws(
        () => applyInlineTextEdit(emphasis, emphasisSpan, text),
        /formatting boundary/
      )
    }
    assert.equal(
      applyInlineTextEdit(emphasis, emphasisSpan, 'new'),
      'a**new**b'
    )
  })

  it('does not make JSX, embeds, images, definitions, fences or automatic links editable', async () => {
    const original =
      'Editable\n\n<div>JSX text **still not editable**</div>\n\n<Tweet id="123" />\n\n![Image alt](https://example.com/image.png)\n\n```js\nconsole.log("code")\n```\n\nhttps://example.com\n\n[ref]: https://example.com\n'
    const { spans } = await render(original)
    assert.deepEqual(
      spans.map((span) => span.text),
      ['Editable']
    )
  })

  it('edits soft-wrapped text without exposing list or quote continuation prefixes', async () => {
    const original =
      '- first line\n  second line\n\n  **still editable**\n\n> quote on\n> two lines\n\n`multiple\nlines`'
    const { spans } = await render(original)
    assert.deepEqual(
      spans.map((span) => span.text),
      [
        'first line second line',
        'still editable',
        'quote on two lines',
        'multiple lines'
      ]
    )
    for (const span of spans)
      assert.equal(applyInlineTextEdit(original, span, span.text), original)
    assert.equal(
      applyInlineTextEdit(
        original,
        withText(spans, 'still editable'),
        'new words'
      ),
      original.replace('still editable', 'new words')
    )
    assert.equal(
      applyInlineTextEdit(
        original,
        withText(spans, 'first line second line'),
        'new\nwords'
      ),
      original.replace('first line\n  second line', 'new<br />words')
    )
    assert.equal(
      applyInlineTextEdit(
        original,
        withText(spans, 'quote on two lines'),
        'new\nquote'
      ),
      original.replace('quote on\n> two lines', 'new<br />quote')
    )
  })

  it('keeps inserted breaks inside headings, formatting, lists, quotes, links and table cells', async () => {
    const examples = [
      { source: '# Original', before: '<h1', after: '</h1>' },
      { source: '**Original**', before: '<strong>', after: '</strong>' },
      { source: '_Original_', before: '<em>', after: '</em>' },
      { source: '~~Original~~', before: '<del>', after: '</del>' },
      { source: '- Original', before: '<li>', after: '</li>' },
      { source: '> Original', before: '<p>', after: '</p>' },
      {
        source: '[Original](https://example.com/unchanged "Keep")',
        before: '<a href="https://example.com/unchanged" title="Keep">',
        after: '</a>'
      },
      {
        source: '| Column |\n| --- |\n| Original |',
        before: '<td>',
        after: '</td>'
      }
    ]
    for (const { source, before, after } of examples) {
      const span = withText((await render(source)).spans, 'Original')
      const changed = applyInlineTextEdit(source, span, 'First\nsecond')
      assert.equal(changed, source.replace('Original', 'First<br />second'))
      const { html } = await render(changed, '', false)
      assert.ok(html.includes(before), html)
      assert.ok(html.includes(`First<br/>second${after}`), html)
      const next = withText((await render(changed)).spans, 'First\nsecond')
      assert.equal(next.source, 'First<br />second')
      assert.equal(applyInlineTextEdit(changed, next, next.text), changed)
      assert.equal(
        applyInlineTextEdit(changed, next, 'Still\neditable'),
        source.replace('Original', 'Still<br />editable')
      )
    }
  })

  it('round-trips leading, trailing, repeated and pasted line breaks as one editable fragment', async () => {
    const original = '**Original**'
    const span = (await render(original)).spans[0]
    for (const text of [
      '\nFirst',
      'First\n',
      'First\n\nsecond',
      '\nFirst\n\nsecond\n'
    ]) {
      const changed = applyInlineTextEdit(original, span, text)
      const next = (await render(changed)).spans
      assert.equal(next.length, 1)
      assert.equal(next[0].text, text)
      assert.equal(applyInlineTextEdit(changed, next[0], text), changed)
      assert.equal(
        applyInlineTextEdit(changed, next[0], 'Back together'),
        '**Back together**'
      )
    }
    assert.equal(
      applyInlineTextEdit(original, span, 'First\r\nsecond\rthird'),
      '**First<br />second<br />third**'
    )
  })

  it('groups original Markdown hard breaks and plain br elements without changing no-op source', async () => {
    for (const original of [
      'First  \nsecond',
      '> First\\\n> second',
      '- First  \n  second',
      'First<br/>second',
      'First<br></br>second'
    ]) {
      const { spans, html } = await render(original)
      assert.equal(spans.length, 1, original)
      assert.equal(spans[0].text, 'First\nsecond')
      assert.ok(html.includes('First<br/>second'), html)
      assert.equal(
        applyInlineTextEdit(original, spans[0], spans[0].text),
        original
      )
      assert.ok(
        applyInlineTextEdit(original, spans[0], 'New\nline').endsWith(
          'New<br />line'
        )
      )
    }
  })

  it('never absorbs authored br attributes or other JSX into editable source ranges', async () => {
    const original = 'Before<br title="Keep" />after <span>JSX</span> end'
    const { spans } = await render(original)
    assert.deepEqual(
      spans.map((span) => span.text),
      ['Before', 'after ', ' end']
    )
    const changed = applyInlineTextEdit(original, spans[0], 'New\nline')
    assert.equal(
      changed,
      'New<br />line<br title="Keep" />after <span>JSX</span> end'
    )
  })

  it('escapes literal Markdown separately on each inserted line', async () => {
    const original = '**Original**'
    const span = (await render(original)).spans[0]
    const text =
      'First\n# not a heading\n- not a list\n<br /> {notCode} | &amp;'
    const changed = applyInlineTextEdit(original, span, text)
    const { html } = await render(changed, '', false)
    assert.equal(
      html,
      renderToStaticMarkup(
        createElement(
          'p',
          {},
          createElement(
            'strong',
            {},
            'First',
            createElement('br'),
            '# not a heading',
            createElement('br'),
            '- not a list',
            createElement('br'),
            '<br /> {notCode} | &amp;'
          )
        )
      )
    )
    assert.equal((await render(changed)).spans[0].text, text)
  })

  it('applies different-length edits against a shared source without shifting later ranges', async () => {
    const original = '**First** and _second_ and `third`'
    const { spans } = await render(original)
    const edits = Object.fromEntries(
      ['First', 'second', 'third'].map((text, index) => [
        withText(spans, text).id,
        ['Longer beginning', 'x', 'much longer code'][index]
      ])
    )
    assert.equal(
      applyInlineTextEdits(original, spans, edits),
      '**Longer beginning** and _x_ and `much longer code`'
    )
  })

  it('rejects stale, invalid, ambiguous and overlapping ranges rather than patching another fragment', async () => {
    const original = '**First** and _second_'
    const { spans } = await render(original)
    const span = spans[0]
    for (const invalid of [
      { ...span, start: -1 },
      { ...span, start: 1.2 },
      { ...span, end: original.length + 1 },
      { ...span, end: span.start },
      { ...span, source: 'wrong' }
    ])
      assert.throws(
        () => applyInlineTextEdit(original, invalid, 'new'),
        /preview has changed/
      )
    assert.throws(
      () =>
        applyInlineTextEdit(original.replace('First', 'Other'), span, 'new'),
      /preview has changed/
    )
    assert.throws(
      () => applyInlineTextEdits(original, spans, { missing: 'new' }),
      /preview has changed/
    )
    assert.throws(
      () =>
        applyInlineTextEdits(original, [...spans, span], { [span.id]: 'new' }),
      /preview has changed/
    )
    const duplicate = { ...span, id: 'overlap' }
    assert.throws(
      () =>
        applyInlineTextEdits(original, [...spans, duplicate], {
          [span.id]: 'new',
          overlap: 'other'
        }),
      /Overlapping/
    )
  })

  it('requires source editing for multiline code and whole-fragment deletion', async () => {
    const original = '**Words**'
    const { spans } = await render(original)
    const code = '`Words`'
    const codeSpan = (await render(code)).spans[0]
    for (const text of ['new\nline', 'new\rline']) {
      assert.throws(
        () => applyInlineTextEdit(code, codeSpan, text),
        /multiline code/
      )
    }
    for (const text of ['', ' ', 'bad\u0000text']) {
      assert.throws(
        () => applyInlineTextEdit(original, spans[0], text),
        /Markdown editor/
      )
    }
  })
})
