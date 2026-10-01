import type { TweetNodeProps } from '../../types'
import Image from 'next/image'
import { useTweet } from './tweet/tweet'

import { weservLoader } from '@/lib/weserv-loader'

export const Img = ({
  width = 1,
  height = 1,
  src,
  alt = ''
}: TweetNodeProps & { src: string }) => {
  const tweet = useTweet()
  const tweetUrl = tweet
    ? `https://twitter.com/${tweet.username}/status/${tweet.id}`
    : src

  return (
    <details className="static-tweet-details">
      <summary
        className="static-tweet-summary"
        style={{
          paddingBottom: `${(height / width) * 100 || 0}%`
        }}
      >
        <a
          href={tweetUrl}
          className="avatar"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src={`${src}${src.includes('?') ? '&' : '?'}name=small`}
            alt={alt}
            fill
            sizes="(max-width: 600px) 100vw, 550px"
            style={{ objectFit: 'cover' }}
            quality={80}
            loader={weservLoader}
          />
        </a>
      </summary>
    </details>
  )
}
