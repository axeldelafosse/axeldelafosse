import { forwardRef } from 'react'
import cs from 'classnames'
import useSWR from 'swr'

import { useTwitterContext } from './twitter'
import Node from './html/node'
import components from './twitter-layout/components'
import type { TweetAst } from './types'

type TweetProps = {
  id: string
  ast?: TweetAst
  caption?: string
  className?: string
  // TODO: understand what br is used for
  // br?: string
}

const Tweet = forwardRef<HTMLElement, TweetProps>(
  ({ id, ast, caption, className }: TweetProps, ref) => {
    const twitter = useTwitterContext()
    const { data: tweetAst } = useSWR<TweetAst>(
      id,
      (id: string) =>
        ast || twitter.tweetAstMap[id] || twitter.swrOptions.fetcher?.(id),
      {
        ...twitter.swrOptions,
        fallbackData:
          ast || twitter.tweetAstMap[id] || twitter.swrOptions.fallbackData
      }
    )

    return (
      <article ref={ref} className={cs('static-tweet', className)}>
        {tweetAst && (
          <>
            <Node components={components} node={tweetAst[0]} />

            {caption != null ? (
              <p className="static-tweet-caption">{caption}</p>
            ) : null}
          </>
        )}
      </article>
    )
  }
)

Tweet.displayName = 'Tweet'

export { Tweet }
