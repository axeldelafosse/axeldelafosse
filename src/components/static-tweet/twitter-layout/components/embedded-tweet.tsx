import type { ReactNode } from 'react'
import type { TweetNode } from '../../types'

import Node from '../../html/node'
import components from './index'

export default function EmbeddedTweet({
  ast,
  href
}: {
  ast?: TweetNode
  href?: string
}): ReactNode {
  return ast ? (
    <Node components={components} node={ast} />
  ) : href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      View quoted tweet
    </a>
  ) : null
}
