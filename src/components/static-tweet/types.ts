import type { Key, ReactNode } from 'react'

export interface TweetData {
  id: string
  username: string
  name: string
  avatar: { normal: string }
  createdAt: string
  likes?: number
  heartCount?: string | number
}

export interface PollData {
  endsAt: string
  options: { position: number; label: string; votes: number }[]
}

export type TweetNodeData = Partial<TweetData & PollData> & {
  type?: string
  ast?: TweetAst
}

export interface TweetNodeProps {
  className?: string | string[]
  dataType?: string
  href?: string
  title?: string
  src?: string
  alt?: string
  width?: number
  height?: number
  id?: string
}

export type TweetNode =
  | string
  | {
      tag: string
      props?: TweetNodeProps
      data?: TweetNodeData
      nodes?: TweetNode[]
    }
export type TweetAst = TweetNode[]
export type TweetRenderProps = Omit<TweetNodeProps, 'className'> & {
  className?: string
  children?: ReactNode
  data?: TweetNodeData
}
export type TweetComponents =
  typeof import('./twitter-layout/components').default
export type TweetHandler = (
  props: TweetRenderProps,
  components: TweetComponents,
  key?: Key
) => ReactNode

export function isTweetData(data?: TweetNodeData): data is TweetData {
  return (
    !!data &&
    typeof data.id === 'string' &&
    typeof data.username === 'string' &&
    typeof data.name === 'string' &&
    typeof data.avatar?.normal === 'string' &&
    typeof data.createdAt === 'string'
  )
}

export function isPollData(data?: TweetNodeData): data is PollData {
  return (
    !!data &&
    typeof data.endsAt === 'string' &&
    Array.isArray(data.options) &&
    data.options.every(
      (option) =>
        typeof option.position === 'number' &&
        typeof option.label === 'string' &&
        typeof option.votes === 'number'
    )
  )
}
