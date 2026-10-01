import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  readInlineEditableText,
  type InlineEditableNode
} from '../src/lib/inline-editable-dom'

function text(value: string): InlineEditableNode {
  return {
    nodeType: 3,
    nodeName: '#text',
    nodeValue: value,
    childNodes: []
  }
}

function element(
  name: string,
  ...children: InlineEditableNode[]
): InlineEditableNode {
  return {
    nodeType: 1,
    nodeName: name.toUpperCase(),
    nodeValue: null,
    childNodes: children
  }
}

const br = () => element('br')
const root = (...children: InlineEditableNode[]) => element('span', ...children)

describe('inline contenteditable DOM reader', () => {
  it('reads text and inline wrappers without changing spaces or punctuation', () => {
    assert.equal(
      readInlineEditableText(
        root(text(' A '), element('code', text('<code>')), text(' & B '))
      ),
      ' A <code> & B '
    )
  })

  it('ignores exactly the native trailing placeholder without trimming real breaks', () => {
    assert.equal(readInlineEditableText(root(text('First'), br())), 'First')
    assert.equal(
      readInlineEditableText(root(text('First'), br(), br())),
      'First\n'
    )
    assert.equal(
      readInlineEditableText(root(text('First'), br(), br(), br())),
      'First\n\n'
    )
    assert.equal(
      readInlineEditableText(root(text('First'), br(), text('Next'), br())),
      'First\nNext'
    )
  })

  it('keeps leading, interior, and repeated line breaks', () => {
    assert.equal(
      readInlineEditableText(
        root(br(), text('First'), br(), br(), text('Next'))
      ),
      '\nFirst\n\nNext'
    )
    assert.equal(readInlineEditableText(root(br(), br(), br())), '\n\n')
    assert.equal(readInlineEditableText(root(br())), '')
    assert.equal(readInlineEditableText(root()), '')
  })

  it('finds a nested terminal placeholder and tolerates empty text and comment nodes', () => {
    assert.equal(
      readInlineEditableText(
        root(text('First'), br(), element('span', br()), text(''), {
          nodeType: 8,
          nodeName: '#comment',
          nodeValue: '',
          childNodes: []
        })
      ),
      'First\n'
    )
  })

  it('reads mobile DIV and P lines, including empty initial and trailing lines', () => {
    for (const block of ['div', 'p']) {
      assert.equal(
        readInlineEditableText(
          root(text('First'), element(block, text('Next')))
        ),
        'First\nNext'
      )
      assert.equal(
        readInlineEditableText(root(text('First'), element(block, br()))),
        'First\n'
      )
      assert.equal(
        readInlineEditableText(
          root(element(block, br()), element(block, text('Next')))
        ),
        '\nNext'
      )
      assert.equal(
        readInlineEditableText(
          root(text('First'), element(block, br()), element(block, br()))
        ),
        'First\n\n'
      )
      assert.equal(readInlineEditableText(root(element(block, br()))), '')
    }
  })

  it('does not turn per-block caret placeholders into extra blank lines', () => {
    assert.equal(
      readInlineEditableText(
        root(
          element('div', text('First'), br()),
          element('div', text('Next'), br())
        )
      ),
      'First\nNext'
    )
    assert.equal(
      readInlineEditableText(
        root(element('div', text('First'), br(), br()), text('Next'))
      ),
      'First\n\nNext'
    )
    assert.equal(
      readInlineEditableText(
        root(text('First'), br(), element('div', text('Next')))
      ),
      'First\nNext'
    )
  })

  it('normalizes pasted CRLF without trimming meaningful trailing newlines', () => {
    assert.equal(
      readInlineEditableText(root(text('First\r\nNext\r\n'))),
      'First\nNext\n'
    )
  })
})
