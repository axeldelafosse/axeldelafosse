/** Minimal DOM shape so the reader can be tested without a browser dependency. */
export type InlineEditableNode = {
  nodeType: number
  nodeName: string
  nodeValue: string | null
  childNodes: ArrayLike<InlineEditableNode>
}

const blockNames = new Set(['DIV', 'P'])

function isBlock(node: InlineEditableNode) {
  return node.nodeType === 1 && blockNames.has(node.nodeName.toUpperCase())
}

function isBreak(node: InlineEditableNode) {
  return node.nodeType === 1 && node.nodeName.toUpperCase() === 'BR'
}

function terminalBreak(node: InlineEditableNode): InlineEditableNode | null {
  if (isBreak(node)) return node
  if (node.nodeType === 3) return null
  for (let index = node.childNodes.length - 1; index >= 0; index--) {
    const child = node.childNodes[index]
    if (child.nodeType === 8 || (child.nodeType === 3 && !child.nodeValue))
      continue
    return terminalBreak(child)
  }
  return null
}

/**
 * Read a normal-white-space contenteditable while keeping its native undo DOM.
 * Browsers keep a final BR as a caret placeholder, not an extra logical line.
 * The caller must also render that placeholder when initially mounting a value
 * ending in a newline, in addition to its real authored BR elements.
 */
export function readInlineEditableText(root: InlineEditableNode): string {
  function readChildren(
    parent: InlineEditableNode,
    placeholder: InlineEditableNode | null
  ): string {
    let result = ''
    let hasContent = false
    let previousWasBlock = false
    for (let index = 0; index < parent.childNodes.length; index++) {
      const node = parent.childNodes[index]
      if (node === placeholder || node.nodeType === 8) continue
      if (isBlock(node)) {
        // Mobile editing may create DIV/P lines instead of inline BRs. Each
        // block can have its own final caret placeholder, including empty lines.
        const value = readChildren(node, terminalBreak(node))
        if (hasContent && (previousWasBlock || !result.endsWith('\n')))
          result += '\n'
        result += value
        hasContent = true
        previousWasBlock = true
        continue
      }
      const value =
        node.nodeType === 3
          ? (node.nodeValue ?? '')
          : isBreak(node)
            ? '\n'
            : node.nodeType === 1
              ? readChildren(node, placeholder)
              : ''
      if (!value) continue
      if (previousWasBlock) result += '\n'
      result += value
      hasContent = true
      previousWasBlock = false
    }
    return result
  }

  return readChildren(root, terminalBreak(root)).replace(/\r\n|\r/g, '\n')
}
