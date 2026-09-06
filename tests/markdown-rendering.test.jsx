import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import * as runtime from 'react/jsx-runtime'
import { evaluate } from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeCodeTitles from 'rehype-code-titles'

import CodeBlock from '../src/components/code-block'
import CustomLink from '../src/components/custom-link'
import MarkdownTable from '../src/components/markdown-table'

async function renderMarkdown(source) {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      rehypeCodeTitles,
      [
        rehypeAutolinkHeadings,
        { behavior: 'wrap', properties: { className: ['anchor'] } }
      ]
    ]
  })
  return renderToStaticMarkup(
    <Content
      components={{ a: CustomLink, pre: CodeBlock, table: MarkdownTable }}
    />
  )
}

const textOnly = (html) => html.replace(/<[^>]*>/g, '')

describe('Markdown links', () => {
  it('keeps heading links on the page and preserves their attributes', async () => {
    const html = await renderMarkdown('## A heading')
    assert.match(
      html,
      /<h2 id="a-heading"><a class="anchor" href="#a-heading">A heading<\/a><\/h2>/
    )
    assert.doesNotMatch(html, /target=|aria-hidden=|data-state=/)
  })

  it('preserves footnote IDs and accessible labels without link previews', () => {
    const html = renderToStaticMarkup(
      <CustomLink
        href="#note"
        id="ref-note"
        aria-label="Back to note"
        data-footnote-backref=""
      >
        ↩
      </CustomLink>
    )
    assert.match(html, /id="ref-note"/)
    assert.match(html, /aria-label="Back to note"/)
    assert.match(html, /data-footnote-backref=""/)
    assert.doesNotMatch(html, /target=|data-state=/)
  })

  it('renders one anchor per internal or external preview link, never nested anchors', () => {
    for (const href of [
      '/blog/example',
      'https://axeldelafosse.com/blog/example',
      'https://example.com'
    ]) {
      const html = renderToStaticMarkup(
        <CustomLink href={href} title="Read more">
          Link
        </CustomLink>
      )
      assert.equal([...html.matchAll(/<a\b/g)].length, 1)
      assert.equal([...html.matchAll(/<\/a>/g)].length, 1)
      assert.match(html, /title="Read more"/)
      if (href === 'https://example.com')
        assert.match(html, /rel="noopener noreferrer"/)
    }
  })

  it('does not mistake another hostname for this site or preview mail links', () => {
    const external = renderToStaticMarkup(
      <CustomLink href="https://example.com/axeldelafosse.com">
        External
      </CustomLink>
    )
    assert.match(external, /target="_blank"/)
    const mail = renderToStaticMarkup(
      <CustomLink href="mailto:test@example.com">Email</CustomLink>
    )
    assert.equal(mail, '<a href="mailto:test@example.com">Email</a>')
  })
})

describe('Markdown code', () => {
  it('keeps inline code inline', async () => {
    const html = await renderMarkdown('Use `hello()` here.')
    assert.equal(html, '<p>Use <code>hello()</code> here.</p>')
  })

  it('uses a single pre/code pair and preserves blank lines, indentation, and escaping', () => {
    const source = 'const value = "<hello> & world"\n\n  console.log(value)\n'
    const html = renderToStaticMarkup(
      <CodeBlock>
        <code className="language-ts">{source}</code>
      </CodeBlock>
    )
    assert.equal([...html.matchAll(/<pre\b/g)].length, 1)
    assert.equal([...html.matchAll(/<code\b/g)].length, 1)
    assert.doesNotMatch(html, /<div\b/)
    assert.match(html, /tabindex="0"/)
    assert.equal(
      textOnly(html),
      textOnly(renderToStaticMarkup(<code>{source}</code>))
    )
  })

  it('renders named, unknown-language, and unlabelled fences without dropping text', async () => {
    const html = await renderMarkdown(
      [
        '```tsx:example.tsx',
        '<div>Hello</div>',
        '```',
        '',
        '```unknown-language',
        '  keep this',
        '',
        'and this',
        '```',
        '',
        '```',
        'plain text',
        '```'
      ].join('\n')
    )
    assert.equal([...html.matchAll(/<pre\b/g)].length, 3)
    assert.equal([...html.matchAll(/<code\b/g)].length, 3)
    assert.match(html, /rehype-code-title[^>]*>example.tsx/)
    assert.ok(textOnly(html).includes('  keep this\n\nand this\n'))
    assert.ok(textOnly(html).includes('plain text\n'))
  })
})

describe('Markdown structure', () => {
  it('preserves numbered starts, nested lists, and multi-paragraph list items', async () => {
    const html = await renderMarkdown(
      '3. First paragraph.\n\n   Another paragraph.\n\n   - Nested item\n\n4. Next item.'
    )
    assert.match(html, /<ol start="3">/)
    assert.match(
      html,
      /<li>\s*<p>First paragraph\.<\/p>\s*<p>Another paragraph\.<\/p>\s*<ul>/
    )
    assert.match(html, /<li>Nested item<\/li>/)
  })

  it('preserves quotes and disabled task checkboxes', async () => {
    const html = await renderMarkdown('> A quote.\n\n- [x] Done\n- [ ] To do')
    assert.match(html, /<blockquote>\s*<p>A quote\.<\/p>\s*<\/blockquote>/)
    assert.match(html, /class="contains-task-list"/)
    assert.equal([...html.matchAll(/type="checkbox" disabled=""/g)].length, 2)
  })

  it('wraps a semantic table in a keyboard-accessible scrolling region', async () => {
    const html = await renderMarkdown(
      '| Item | Count |\n| :--- | ---: |\n| Test | 2 |'
    )
    assert.match(html, /role="region" aria-label="Table" tabindex="0"/)
    assert.match(html, /<table><thead>/)
    assert.match(html, /<th style="text-align:right">Count<\/th>/)
    assert.match(html, /<td style="text-align:right">2<\/td>/)
  })
})
