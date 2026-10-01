import { createContext, useContext, type ReactNode } from 'react'
import type { InlineMarkdownSpan } from '@/lib/inline-markdown'
import { readInlineEditableText } from '@/lib/inline-editable-dom'

export const InlineTextContext = createContext<{
  spans: Map<string, InlineMarkdownSpan>
  enabled: boolean
  onStart: () => void
  onChange: (id: string, text: string) => void
  onFinish: () => void
} | null>(null)

/** The compiler adds this only to source-mapped text in the local preview. */
export function LocalInlineText({
  spanId,
  children
}: {
  spanId: string
  children: ReactNode
}) {
  const editor = useContext(InlineTextContext)
  const span = editor?.spans.get(spanId)
  if (!editor || !span) return <>{children}</>

  return (
    <span
      data-local-edit={spanId}
      contentEditable={editor.enabled}
      suppressContentEditableWarning
      role={editor.enabled ? 'textbox' : undefined}
      aria-label={`Edit text: ${span.text.slice(0, 60)}`}
      aria-multiline={span.kind === 'text'}
      tabIndex={editor.enabled ? 0 : undefined}
      title={
        span.kind === 'text'
          ? 'Click to edit text. Enter for a new line. Escape to finish.'
          : 'Click to edit code. Escape to finish. Multiline code uses Markdown.'
      }
      className="whitespace-normal rounded-sm outline-none empty:inline-block empty:min-w-[2ch] empty:before:text-gray-400 empty:before:content-['…'] hover:bg-purple-500/10 focus:bg-purple-500/10 focus:ring-1 focus:ring-purple-400 [&>br[data-local-caret]]:hidden [&:focus>br[data-local-caret]]:inline"
      onFocus={editor.onStart}
      onInput={(event) =>
        editor.onChange(spanId, readInlineEditableText(event.currentTarget))
      }
      onBlur={editor.onFinish}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          event.currentTarget.blur()
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          event.stopPropagation()
          if (span.kind === 'text') {
            // A native break retains the caret and undo history. Do not turn
            // Enter into a new contenteditable block or finish the edit.
            document.execCommand('insertLineBreak')
          } else {
            event.currentTarget.blur()
          }
        }
        // Formatting stays in the Markdown; don't introduce browser-generated HTML.
        if (
          (event.metaKey || event.ctrlKey) &&
          ['b', 'i', 'u'].includes(event.key.toLowerCase())
        )
          event.preventDefault()
      }}
      onPaste={(event) => {
        event.preventDefault()
        const text = event.clipboardData
          .getData('text/plain')
          .replace(/\r\n|\r/g, '\n')
        // Native insertion preserves the browser's undo stack and selection.
        document.execCommand('insertText', false, text)
      }}
      onDrop={(event) => event.preventDefault()}
    >
      {children}
      {/* Match the browser's terminal caret placeholder, not a saved break. */}
      {span.text.endsWith('\n') && <br data-local-caret="true" />}
    </span>
  )
}
