import type { ReactNode } from 'react'
import type { TweetRenderProps } from '../../types'

const Permalink = ({ children, id }: { children?: ReactNode; id?: string }) =>
  id ? (
    <span className="static-tweet-permalink">
      <span id={id}></span>
      <a href={`#${id}`}>{children}</a>
      <span className="permalink">#</span>
    </span>
  ) : (
    <>{children}</>
  )

export const H1 = (p: TweetRenderProps) => (
  <h1 className="static-tweet-h1">
    <Permalink id={p.data?.id}>{p.children}</Permalink>
  </h1>
)

export const H2 = (p: TweetRenderProps) => (
  <h2 className="static-tweet-h2">
    <Permalink id={p.data?.id}>{p.children}</Permalink>
  </h2>
)

export const H3 = (p: TweetRenderProps) => (
  <h3 className="static-tweet-h3">
    <Permalink id={p.data?.id}>{p.children}</Permalink>
  </h3>
)

export const H4 = (p: TweetRenderProps) => (
  <h4 className="static-tweet-h4">
    <Permalink id={p.data?.id}>{p.children}</Permalink>
  </h4>
)

export const H5 = (p: TweetRenderProps) => (
  <h5 className="static-tweet-h5">
    <Permalink id={p.data?.id}>{p.children}</Permalink>
  </h5>
)

export const H6 = (p: TweetRenderProps) => (
  <h6 className="static-tweet-h6">
    <Permalink id={p.data?.id}>{p.children}</Permalink>
  </h6>
)
