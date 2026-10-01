import type { PostSummary } from './post-data'

export type PostLink = Pick<PostSummary, 'slug' | 'title'>
export type AdjacentPosts = {
  previous: PostLink | null
  next: PostLink | null
}

// Summaries are newest first: previous is older, next is newer.
export function getAdjacentPosts(
  slug: string,
  posts: PostSummary[]
): AdjacentPosts {
  const index = posts.findIndex((post) => post.slug === slug)
  const link = (post?: PostSummary): PostLink | null =>
    post ? { slug: post.slug, title: post.title } : null

  if (index === -1) return { previous: null, next: null }
  return {
    previous: link(posts[index + 1]),
    next: link(posts[index - 1])
  }
}
