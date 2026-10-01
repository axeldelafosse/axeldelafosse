import { createContext, type ReactNode, useContext } from 'react'
import type { SWRConfiguration } from 'swr'
import type { TweetAst } from './types'
export type { TweetAst } from './types'

export type TwitterContextValue = {
  // static tweet ast info
  tweetAstMap: TweetAstMap

  // SWR config for dynamically fetching tweet ast info
  swrOptions: SWRConfiguration<TweetAst>
}

export type TweetAstMap = {
  [tweetId: string]: TweetAst
}

export interface TwitterContextProviderProps {
  value: Partial<TwitterContextValue>
  children?: ReactNode
}

// Saves the tweets returned as props to the page
const TwitterContext = createContext<TwitterContextValue>({
  tweetAstMap: {},
  swrOptions: {
    fetcher: async (id: string) => {
      const response = await fetch(
        `https://twitter-search.vercel.app/api/get-tweet-ast/${encodeURIComponent(id)}`
      )
      if (!response.ok)
        throw new Error(`Tweet request failed: ${response.status}`)
      const ast: unknown = await response.json()
      if (!Array.isArray(ast)) throw new Error('Invalid tweet response')
      return ast as TweetAst
    }
  }
})

export function useTwitterContext() {
  return useContext(TwitterContext)
}

// allows partials that override outer providers
export function TwitterContextProvider({
  value,
  children
}: TwitterContextProviderProps) {
  const currentContext = useContext(TwitterContext)
  const { tweetAstMap, swrOptions, ...rest } = value
  const mergedContext = {
    ...currentContext,
    ...rest,
    tweetAstMap: {
      ...currentContext.tweetAstMap,
      ...tweetAstMap
    },
    swrOptions: {
      ...currentContext.swrOptions,
      ...swrOptions
    }
  }

  return (
    <TwitterContext.Provider value={mergedContext}>
      {children}
    </TwitterContext.Provider>
  )
}

export const TwitterContextConsumer = TwitterContext.Consumer
