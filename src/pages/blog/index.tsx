import React from 'react'
import { GetStaticProps } from 'next'
import Link from 'next/link'

import { allPosts } from 'contentlayer2/generated'
import type { Post } from 'contentlayer2/generated'

import BlogLayout from '@/components/blog-layout'
// import Switch from '@/components/switch'

function Blog({ posts }: { posts: Post[] }) {
  // const [hideTechPosts, setHideTechPosts] = useState(false)

  return (
    <BlogLayout>
      <div className="flex items-center justify-between">
        <h1>Blog</h1>
        {/* <div className="flex items-center">
          <h4 className="mr-2 font-bold">Hide tech posts</h4>
          <Switch
            enabled={hideTechPosts}
            setEnabled={setHideTechPosts}
            accessibility="Hide tech posts"
          />
        </div> */}
      </div>
      {posts
        // .filter((post) =>
        //   hideTechPosts ? post.tags.includes('tech') === false : true
        // )
        .map((post) => (
          <Link
            key={post.uid}
            href={`/blog/${post.slug}`}
            passHref={true}
            className="no-underline cursor-pointer text-white"
          >
            <h3>
              {post.title}{' '}
              <span className="text-lg text-gray-400 font-normal">
                {new Date(post.dateLastModified).toDateString()}
              </span>
            </h3>
          </Link>
        ))}
    </BlogLayout>
  )
}

export default Blog

export const getStaticProps: GetStaticProps = async () => {
  const posts = allPosts
    .filter((post: Post) => post._raw.sourceFileDir === '.')
    .sort(
      (a: Post, b: Post) =>
        Number(new Date(b.dateLastModified)) -
        Number(new Date(a.dateLastModified))
    )

  return { props: { posts } }
}
