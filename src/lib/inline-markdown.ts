/** A rendered text fragment and its exact range in the full Markdown file. */
export type InlineMarkdownSpan = {
  id: string
  start: number
  end: number
  text: string
  source: string
  kind: 'text' | 'inlineCode'
  inTable?: boolean
}

type MarkdownNode = {
  type: string
  value?: string
  children?: MarkdownNode[]
  position?: { start: { offset?: number }; end: { offset?: number } }
  data?: Record<string, unknown> & { hProperties?: Record<string, unknown> }
  name?: string
  referenceType?: string
  attributes?: Array<{ type: string; name: string; value: string }>
}

const containers = new Set([
  'root',
  'paragraph',
  'heading',
  'blockquote',
  'list',
  'listItem',
  'table',
  'tableRow',
  'tableCell',
  'strong',
  'emphasis',
  'delete',
  'link',
  'linkReference'
])

function isLineBreak(node: MarkdownNode) {
  return (
    node.type === 'break' ||
    (node.type === 'mdxJsxTextElement' &&
      node.name === 'br' &&
      !node.attributes?.length &&
      !node.children?.length)
  )
}

function isProse(node: MarkdownNode) {
  return node.type === 'text' || isLineBreak(node)
}

// A soft source wrap is ordinary whitespace in rendered Markdown. Hard breaks
// have their own nodes and must remain explicit newlines in the editable text.
function proseText(node: MarkdownNode) {
  return isLineBreak(node)
    ? '\n'
    : (node.value ?? '').replace(/\r\n|\r|\n/g, ' ')
}

/**
 * Annotate only leaf prose, not a reserialized document. Positions from remark
 * are UTF-16 offsets, matching string.slice and the editor's source string.
 * Adjacent text and hard breaks share one fragment, so a newly inserted newline
 * is still editable after previewing, saving, or reopening. Other authored JSX,
 * embeds, images, and code blocks are left alone.
 */
export function createInlineMarkdownPlugin(
  source: string,
  bodyOffset: number,
  spans: InlineMarkdownSpan[]
) {
  return function inlineMarkdown() {
    return (tree: MarkdownNode) => {
      const visit = (parent: MarkdownNode, inTable = false) => {
        if (!containers.has(parent.type)) return
        // For automatic links, label and destination are the same source bytes.
        // An explicit [label](destination) or [label][reference] is safe to edit.
        if (parent.type === 'link') {
          const offset = parent.position?.start.offset
          if (offset === undefined || source[bodyOffset + offset] !== '[')
            return
        }
        // Shortcut/collapsed references derive their destination identifier
        // from the visible label. Changing that label would break the link.
        if (parent.type === 'linkReference' && parent.referenceType !== 'full')
          return
        const insideTable = inTable || parent.type === 'tableCell'
        const children = parent.children
        if (!children) return
        const result: MarkdownNode[] = []
        for (let index = 0; index < children.length; index++) {
          const node = children[index]
          if (!isProse(node) && node.type !== 'inlineCode') {
            visit(node, insideTable)
            result.push(node)
            continue
          }
          const group = [node]
          if (isProse(node)) {
            while (index + 1 < children.length && isProse(children[index + 1]))
              group.push(children[++index])
          }
          const kind = node.type === 'inlineCode' ? 'inlineCode' : 'text'
          const text =
            kind === 'inlineCode'
              ? proseText(node)
              : group.map(proseText).join('')
          const relativeStart = node.position?.start.offset
          const relativeEnd = group[group.length - 1].position?.end.offset
          if (
            relativeStart === undefined ||
            relativeEnd === undefined ||
            !Number.isInteger(relativeStart) ||
            !Number.isInteger(relativeEnd) ||
            relativeStart < 0 ||
            relativeEnd <= relativeStart ||
            bodyOffset + relativeEnd > source.length ||
            !text.trim()
          ) {
            result.push(...group)
            continue
          }
          const start = bodyOffset + relativeStart
          const end = bodyOffset + relativeEnd
          const original = source.slice(start, end)
          const span: InlineMarkdownSpan = {
            id: `inline-${spans.length}`,
            start,
            end,
            text,
            source: original,
            kind,
            ...(insideTable ? { inTable: true } : {})
          }
          spans.push(span)
          result.push({
            type: 'mdxJsxTextElement',
            name: 'LocalInlineText',
            attributes: [
              {
                type: 'mdxJsxAttribute',
                name: 'spanId',
                value: span.id
              }
            ],
            // Match the editable value: soft wraps are spaces, while real line
            // breaks are explicit BRs (without an extra rehype newline).
            children: group.map((child) =>
              child.type === 'text' || child.type === 'inlineCode'
                ? { ...child, value: proseText(child) }
                : child.type === 'break'
                  ? {
                      type: 'mdxJsxTextElement',
                      name: 'br',
                      attributes: [],
                      children: []
                    }
                  : child
            )
          })
        }
        parent.children = result
      }
      visit(tree)
    }
  }
}

function markdownText(text: string) {
  // Escape Markdown/MDX syntax, including entities, table pipes and link text.
  // Periods/parentheses prevent new numbered-list markers at a block's start.
  // Quotes, commas, colons and slashes can remain readable in the source.
  return (
    text
      .split('\n')
      .map((line) =>
        line
          .replace(/[\\`*_[\]{}<>|&~#!+=().-]/g, '\\$&')
          .replace(/^[ \t]+|[ \t]+$/g, (spaces) =>
            [...spaces]
              .map((space) => (space === '\t' ? '&#9;' : '&#32;'))
              .join('')
          )
      )
      // Inline breaks work within headings, tables, lists and quotes without
      // introducing new block syntax or needing to reconstruct their prefixes.
      .join('<br />')
  )
}

function markdownCode(text: string, inTable: boolean) {
  if (
    inTable &&
    [...text.matchAll(/(\\+)\|/g)].some((match) => match[1].length % 2)
  ) {
    throw new Error(
      'Use the Markdown editor for backslashes before pipes in table code.'
    )
  }
  const runs = text.match(/`+/g) ?? []
  const fence = '`'.repeat(Math.max(0, ...runs.map((run) => run.length)) + 1)
  const padding =
    text.startsWith('`') ||
    text.endsWith('`') ||
    (text.startsWith(' ') && text.endsWith(' ') && /[^ ]/.test(text))
      ? ' '
      : ''
  // GFM table parsing happens before code-span parsing, so even code pipes
  // need their table escape. It is removed again from the rendered code value.
  const value = inTable ? text.replace(/\|/g, '\\|') : text
  return `${fence}${padding}${value}${padding}${fence}`
}

/** Patch one still-current fragment; all bytes outside its range stay intact. */
export function applyInlineTextEdit(
  source: string,
  span: InlineMarkdownSpan,
  text: string
) {
  if (
    !Number.isInteger(span.start) ||
    !Number.isInteger(span.end) ||
    span.start < 0 ||
    span.end <= span.start ||
    span.end > source.length ||
    typeof span.source !== 'string' ||
    source.slice(span.start, span.end) !== span.source
  ) {
    throw new Error(
      'The preview has changed. Wait for it to refresh and try again.'
    )
  }
  text = text.replace(/\r\n|\r/g, '\n')
  if (text === span.text) return source
  if (span.kind === 'inlineCode' && text.includes('\n')) {
    throw new Error('Use the Markdown editor for multiline code.')
  }
  if (!text.trim() || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) {
    throw new Error('Use the Markdown editor to remove a whole text fragment.')
  }
  // With intraword emphasis (a**word**b), new edge punctuation/whitespace
  // cannot retain the delimiters' Markdown meaning through a leaf-only patch.
  // Reject that rare structural change instead of silently dropping emphasis.
  if (
    span.kind === 'text' &&
    ((/^[\s\p{P}\p{S}]/u.test(text) &&
      /[^\s\p{P}\p{S}][*_~]+$/u.test(source.slice(0, span.start))) ||
      (/[\s\p{P}\p{S}]$/u.test(text) &&
        /^[*_~]+[^\s\p{P}\p{S}]/u.test(source.slice(span.end))))
  ) {
    throw new Error(
      'Use the Markdown editor to change punctuation at this formatting boundary.'
    )
  }
  const replacement =
    span.kind === 'inlineCode'
      ? markdownCode(text, Boolean(span.inTable))
      : markdownText(text)
  return source.slice(0, span.start) + replacement + source.slice(span.end)
}

/** Apply a preview's pending edits against the same immutable source snapshot. */
export function applyInlineTextEdits(
  source: string,
  spans: InlineMarkdownSpan[],
  edits: Record<string, string>
) {
  const edited = Object.entries(edits).map(([id, text]) => {
    const matches = spans.filter((span) => span.id === id)
    if (matches.length !== 1) {
      throw new Error(
        'The preview has changed. Wait for it to refresh and try again.'
      )
    }
    const span = matches[0]
    // Validate every fragment against the original, even before applying the
    // descending edits. This also leaves no partially applied result on error.
    applyInlineTextEdit(source, span, text)
    return { span, text }
  })
  edited.sort((a, b) => b.span.start - a.span.start)
  for (let index = 1; index < edited.length; index++) {
    if (edited[index].span.end > edited[index - 1].span.start) {
      throw new Error(
        'Overlapping preview edits need a refresh. Use the Markdown editor.'
      )
    }
  }
  return edited.reduce(
    (result, { span, text }) => applyInlineTextEdit(result, span, text),
    source
  )
}
