import type { GetStaticProps } from 'next'
import Link from 'next/link'

import { allPosts } from 'contentlayer2/generated'
import { getPostSummaries, type PostSummary } from '@/lib/post-data'
import { formatShortPostDate } from '@/lib/post-date'

import BlogLayout from '@/components/blog-layout'

function Blog({ posts }: { posts: PostSummary[] }) {
  return (
    <BlogLayout>
      <h1>Blog</h1>
      <div className="mb-8 space-y-6">
        {posts.map((post) => (
          <div key={post.uid}>
            <h2 className="m-0 text-2xl">
              <Link
                href={`/blog/${post.slug}`}
                className="no-underline cursor-pointer text-gray-900 hover:underline dark:text-white"
              >
                {post.title}
              </Link>
            </h2>
            <div className="mt-1">
              <time
                dateTime={post.dateLastModified}
                title="Last updated"
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                {formatShortPostDate(post.dateLastModified)}
              </time>
            </div>
          </div>
        ))}
      </div>
    </BlogLayout>
  )
}

export default Blog

export const getStaticProps: GetStaticProps<{
  posts: PostSummary[]
}> = async () => {
  const posts = getPostSummaries(allPosts)

  return { props: { posts } }
}
