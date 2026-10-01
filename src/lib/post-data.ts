import type { Post } from 'contentlayer2/generated'

export type PostMetadata = Pick<
  Post,
  'uid' | 'slug' | 'title' | 'description' | 'date' | 'dateLastModified'
>

export type PostSummary = Pick<
  PostMetadata,
  'uid' | 'slug' | 'title' | 'date' | 'dateLastModified'
>

export type PostPageData = PostMetadata & { body: Pick<Post['body'], 'code'> }

// Keep full Contentlayer documents on the build side, not in page JSON.
export function getPostSummaries(posts: Post[]): PostSummary[] {
  return posts
    .filter((post) => post._raw.sourceFileDir === '.')
    .sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)))
    .map(({ uid, slug, title, date, dateLastModified }) => ({
      uid,
      slug,
      title,
      date,
      dateLastModified
    }))
}

export function getPostPageData(post: Post): PostPageData {
  const { uid, slug, title, description, date, dateLastModified } = post
  return {
    uid,
    slug,
    title,
    description,
    date,
    dateLastModified,
    body: { code: post.body.code }
  }
}
