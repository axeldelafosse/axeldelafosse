import { GetStaticProps } from 'next'
import { useMDXComponent } from 'next-contentlayer2/hooks'

import { allPosts } from 'contentlayer2/generated'
import type { Post } from 'contentlayer2/generated'

import BlogLayout, { components } from '@/components/blog-layout'

export default function Post({ post }: { post: Post }) {
  const Component = useMDXComponent(post.body.code)

  return (
    <BlogLayout post={post}>
      <article>
        <Component components={components} />
      </article>
    </BlogLayout>
  )
}

export async function getStaticPaths() {
  return {
    paths: allPosts.map((p) => ({ params: { slug: p.slug } })),
    fallback: false
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = allPosts.find((post) => post.slug === params?.slug)

  return { props: { post } }
}
