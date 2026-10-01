import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import * as runtime from 'react/jsx-runtime'
import { evaluate } from '@mdx-js/mdx'
import rehypeCodeTitles from 'rehype-code-titles'
import Loadable from 'next/dist/shared/lib/loadable.shared-runtime'

import { components } from '../src/components/mdx-components'
import { TwitterContextProvider } from '../src/components/static-tweet/twitter'

async function compileMarkdown(source) {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    rehypePlugins: [rehypeCodeTitles]
  })

  // Next's Pages Router preloads registered dynamic imports before SSR.
  // Use that same runtime so this exercises the production component map.
  await Loadable.preloadAll()
  return <Content components={components} />
}

const textOnly = (html) => html.replace(/<[^>]*>/g, '')

describe('Dynamic MDX components during server rendering', () => {
  it('renders highlighted and unknown-language fences with their complete text', async () => {
    const source =
      'const message = "<hello> & world"\n\n  console.log(message)\n'
    const plainSource = '  keep this\n\nand this\n'
    const content = await compileMarkdown(
      [
        '```ts:example.ts',
        source + '```',
        '',
        '```unknown-language',
        plainSource + '```'
      ].join('\n')
    )
    const html = renderToStaticMarkup(content)
    const blocks = [...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)]

    assert.equal(blocks.length, 2)
    assert.equal([...html.matchAll(/<code\b/g)].length, 2)
    assert.match(html, /rehype-code-title[^>]*>example.ts/)
    assert.match(html, /class="token keyword"/)
    assert.equal([...html.matchAll(/tabindex="0"/g)].length, 2)
    for (const [index, expected] of [source, plainSource].entries()) {
      assert.equal(
        textOnly(blocks[index][1]),
        textOnly(renderToStaticMarkup(<code>{expected}</code>))
      )
    }
  })

  it('resolves the dynamic Tweet export and renders cached content without fetching', async () => {
    const content = await compileMarkdown('<Tweet id="1234567890123456789" />')
    const tweetText = 'A cached tweet is visible during server rendering.'
    let fetchCalls = 0
    const html = renderToStaticMarkup(
      <TwitterContextProvider
        value={{
          swrOptions: {
            fallbackData: [{ tag: 'p', nodes: [tweetText] }],
            fetcher: () => {
              fetchCalls += 1
              throw new Error('The SSR test must not fetch tweets')
            }
          }
        }}
      >
        {content}
      </TwitterContextProvider>
    )

    assert.match(html, /^<div class="flex justify-center">/)
    assert.match(html, /<article class="static-tweet">/)
    assert.match(html, /<p class="static-tweet-p">/)
    assert.equal(textOnly(html), tweetText)
    assert.equal(fetchCalls, 0)
  })
})
