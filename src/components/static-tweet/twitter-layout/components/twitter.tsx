import { Children, Fragment, type ComponentProps } from 'react'
import cs from 'classnames'
import type { PollData } from '../../types'

import { formatDistanceStrict } from 'date-fns/formatDistanceStrict'

export const TwitterLink = (p: ComponentProps<'a'> & { type: string }) => (
  <a
    href={p.href}
    target="_blank"
    rel="noopener noreferrer"
    title={p.title || p.href}
    className="static-tweet-twitter-link"
  >
    <s>{p.type}</s>

    {p.children}
  </a>
)

function withoutPrefix(children: React.ReactNode, prefix: string) {
  const [first, ...rest] = Children.toArray(children)
  return [
    typeof first === 'string' && first.startsWith(prefix)
      ? first.slice(1)
      : first,
    ...rest
  ]
}

export const Mention = (p: ComponentProps<'a'>) => (
  <TwitterLink href={p.href} type="@">
    {withoutPrefix(p.children, '@')}
  </TwitterLink>
)

export const Hashtag = (p: ComponentProps<'a'>) => (
  <TwitterLink href={p.href} type="#">
    {withoutPrefix(p.children, '#')}
  </TwitterLink>
)

export const Cashtag = (p: ComponentProps<'a'>) => (
  <TwitterLink href={p.href} type="$">
    {withoutPrefix(p.children, '$')}
  </TwitterLink>
)

export const Emoji = ({ className, ...p }: ComponentProps<'img'>) => (
  <img className={cs('static-tweet-emoji', className)} {...p} />
)

// Note: Poll data is most likely cached, so ongoing polls will not be updated
// until a revalidation happens
export const Poll = ({ data }: { data: PollData }) => {
  const votesCount = data.options.reduce(
    (count, option) => count + option.votes,
    0
  )
  const endsAt = new Date(data.endsAt)
  const now = new Date()

  return (
    <div className="static-tweet-poll">
      <div className="static-tweet-options">
        {data.options.map((option) => {
          const per = Math.round((option.votes / votesCount) * 100) || 0
          const width = `${per || 1}%`
          const widthLabel = per + '%'

          return (
            <Fragment key={option.position}>
              <span className="static-tweet-label">{option.label}</span>
              <span className="static-tweet-chart" style={{ width }}></span>
              <span>{widthLabel}</span>
            </Fragment>
          )
        })}
      </div>
      <hr />
      <div className="static-tweet-footer">
        <span className="static-tweet-votes-count">{votesCount} votes</span>
        <span>
          {now > endsAt
            ? 'Final results'
            : `${formatDistanceStrict(endsAt, now)} left`}
        </span>
      </div>
    </div>
  )
}
