// From https://mdxjs.com/guides/syntax-highlighting

import { Fragment, isValidElement } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { Highlight, Language } from 'prism-react-renderer'
import type { PrismTheme } from 'prism-react-renderer'

const theme: PrismTheme = {
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
        color: 'rgb(154, 166, 202)'
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

type CodeBlockProps = ComponentPropsWithoutRef<'pre'>

function CodeBlock({ children, ...props }: CodeBlockProps) {
  const codeElement =
    isValidElement<ComponentPropsWithoutRef<'code'>>(children) &&
    children.type === 'code'
      ? children
      : null

  if (!codeElement || typeof codeElement.props.children !== 'string') {
    return <pre {...props}>{children}</pre>
  }

  const language = (codeElement.props.className?.match(
    /\blanguage-([\w-]+)/
  )?.[1] ?? 'text') as Language

  return (
    <Highlight
      code={codeElement.props.children}
      language={language}
      theme={theme}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          {...props}
          className={[className, props.className].filter(Boolean).join(' ')}
          style={{ ...style, ...props.style }}
          tabIndex={props.tabIndex ?? 0}
          aria-label={props['aria-label'] ?? 'Code example'}
        >
          <code {...codeElement.props}>
            {tokens.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && '\n'}
                <span {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })}>
                      {token.empty ? '' : token.content}
                    </span>
                  ))}
                </span>
              </Fragment>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  )
}

export default CodeBlock
