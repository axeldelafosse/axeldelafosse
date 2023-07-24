// From https://mdxjs.com/guides/syntax-highlighting

import React, { ReactNode } from 'react'
import { Highlight, Language } from 'prism-react-renderer'
import type { PrismTheme } from 'prism-react-renderer'
import * as ScrollArea from '@radix-ui/react-scroll-area'

var theme: PrismTheme = {
  plain: {
    color: '#F8F8F2',
    backgroundColor: '#282A36'
  },
  styles: [
    {
      types: ['prolog', 'constant', 'builtin'],
      style: {
        color: 'rgb(189, 147, 249)'
      }
    },
    {
      types: ['inserted', 'function'],
      style: {
        color: 'rgb(80, 250, 123)'
      }
    },
    {
      types: ['deleted'],
      style: {
        color: 'rgb(255, 85, 85)'
      }
    },
    {
      types: ['changed'],
      style: {
        color: 'rgb(255, 184, 108)'
      }
    },
    {
      types: ['punctuation', 'symbol'],
      style: {
        color: 'rgb(248, 248, 242)'
      }
    },
    {
      types: ['string', 'char', 'tag', 'selector'],
      style: {
        color: 'rgb(255, 121, 198)'
      }
    },
    {
      types: ['keyword', 'variable'],
      style: {
        color: 'rgb(189, 147, 249)'
        // fontStyle: "italic",
      }
    },
    {
      types: ['comment'],
      style: {
        color: 'rgb(98, 114, 164)'
      }
    },
    {
      types: ['attr-name'],
      style: {
        color: 'rgb(241, 250, 140)'
      }
    }
  ]
}

interface CodeBlockProps {
  className: string
  children: ReactNode
}

function CodeBlock({ className, children }: CodeBlockProps) {
  const language = className?.replace(/language-/, '') as Language

  if (!language) {
    return <code>{children}</code>
  }

  return (
    <Highlight
      code={children as string}
      language={language}
      theme={theme}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <ScrollArea.Root>
          <ScrollArea.Viewport />
          <ScrollArea.Scrollbar orientation="horizontal">
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
          <pre
            className={className}
            style={{
              ...style,
              paddingTop: '20px',
              paddingLeft: '15px',
              paddingRight: '15px',
              overflow: 'scroll'
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line, key: i })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </pre>
          <ScrollArea.Corner />
        </ScrollArea.Root>
      )}
    </Highlight>
  )
}

export default CodeBlock
