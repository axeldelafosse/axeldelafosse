import { isPollData, isTweetData, type TweetHandler } from '../types'

function getContainerClassName(dataType?: string) {
  if (!dataType) return

  const [type, count] = dataType.split(' ')

  switch (type) {
    case 'image-container':
      return `image-container image-count-${count}`
    case 'gif-container':
    case 'video-container':
      return type
  }
}

const handlers: Record<string, TweetHandler> = {
  div(props, components, i) {
    const { data } = props
    const type = props.dataType || (data && data.type)

    if (type === 'tweet' && isTweetData(data)) {
      return (
        <components.Tweet key={i} data={data}>
          {props.children}
        </components.Tweet>
      )
    }

    if (type === 'poll-container' && isPollData(data)) {
      return <components.Poll key={i} data={data} />
    }

    const className = getContainerClassName(type)

    return (
      <components.div key={i} className={className}>
        {props.children}
      </components.div>
    )
  },

  img({ dataType, ...props }, components, i) {
    if (dataType === 'emoji-for-text') {
      return <components.Emoji key={i} src={props.src} alt={props.alt} />
    }

    if (dataType === 'media-image' && props.src) {
      return <components.img key={i} {...props} src={props.src} />
    }

    return null
  },

  a(props, components, i) {
    const type = props.dataType

    if (type === 'mention') {
      return (
        <components.Mention key={i} href={props.href}>
          {props.children}
        </components.Mention>
      )
    }

    if (type === 'hashtag') {
      return (
        <components.Hashtag key={i} href={props.href}>
          {props.children}
        </components.Hashtag>
      )
    }

    if (type === 'cashtag') {
      return (
        <components.Cashtag key={i} href={props.href}>
          {props.children}
        </components.Cashtag>
      )
    }

    if (type === 'quote-tweet') {
      return <components.EmbeddedTweet key={i} href={props.href} />
    }

    return (
      <components.a key={i} href={props.href} title={props.title}>
        {props.children}
      </components.a>
    )
  },

  blockquote(props, components, i) {
    if (process.env.NEXT_PUBLIC_TWITTER_LOAD_WIDGETS === 'true') {
      const isEmbeddedTweet = props.className?.includes('twitter-tweet')

      if (isEmbeddedTweet) {
        return (
          <components.EmbeddedTweet
            key={i}
            ast={props.data?.ast?.[0]}
            href={props.href}
          />
        )
      }
    } else {
      const ast = props.data?.ast

      if (ast) {
        return <components.EmbeddedTweet key={i} ast={ast[0]} />
      }
    }

    return (
      <components.blockquote key={i}>{props.children}</components.blockquote>
    )
  }
}

export default handlers
