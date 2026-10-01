import type { GetStaticProps } from 'next'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useMDXComponent } from 'next-contentlayer2/hooks'

import { allPosts } from 'contentlayer2/generated'
import {
  getPostPageData,
  getPostSummaries,
  type PostPageData
} from '@/lib/post-data'
import { getAdjacentPosts, type AdjacentPosts } from '@/lib/post-navigation'

import BlogLayout from '@/components/blog-layout'
import PostNavigation from '@/components/post-navigation'
import { components } from '@/components/mdx-components'
import styles from '../../styles/markdown.module.css'

// The development editor is never included in a production page bundle.
const LocalPostEditor =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@/components/local-post-editor'), { ssr: false })
    : null

type PostProps = { post: PostPageData; navigation: AdjacentPosts }

export default function Post({ post, navigation }: PostProps) {
  const [local, setLocal] = useState(false)
  const [editing, setEditing] = useState(false)
  const [savedPost, setSavedPost] = useState<PostPageData | null>(null)
  const displayPost = savedPost?.slug === post.slug ? savedPost : post
  const Component = useMDXComponent(displayPost.body.code)

  useEffect(() => {
    setLocal(
      process.env.NODE_ENV === 'development' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
    )
  }, [])

  useEffect(() => {
    setSavedPost(null)
  }, [post])

  useEffect(() => {
    setEditing(false)
  }, [post.slug])

  return (
    <BlogLayout
      post={displayPost}
      onEdit={local ? () => setEditing(true) : undefined}
    >
      <article className={styles.prose}>
        <Component components={components} />
      </article>
      <PostNavigation {...navigation} />
      {local && editing && LocalPostEditor && (
        <LocalPostEditor
          key={post.slug}
          post={post}
          onClose={() => setEditing(false)}
          onSaved={setSavedPost}
        />
      )}
    </BlogLayout>
  )
}

export async function getStaticPaths() {
  return {
    paths: allPosts.map((p) => ({ params: { slug: p.slug } })),
    fallback: false
  }
}

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const post = allPosts.find((post) => post.slug === params?.slug)

  if (!post) return { notFound: true }
  return {
    props: {
      post: getPostPageData(post),
      navigation: getAdjacentPosts(post.slug, getPostSummaries(allPosts))
    }
  }
}
