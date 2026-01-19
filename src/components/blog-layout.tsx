import React, { ReactNode } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'

import type { Post } from 'contentlayer2/generated'

import { Tweet } from '@/components/static-tweet'
import PostHead from '@/components/post-head'
import CustomLink from '@/components/custom-link'
import CodeBlock from '@/components/code-block'
import Footer from '@/components/footer'
import { LinkPreview } from '@/components/link-preview'
import { weservLoader } from '@/lib/weserv-loader'

function getGithubUrl(slug: string) {
  return `https://github.com/${process.env.NEXT_PUBLIC_ID}/${process.env.NEXT_PUBLIC_ID}/tree/master/blog/${slug}.mdx`
}

function getBackButtonProps(
  isBlogPost: boolean,
  isStartupNotebookPost: boolean
) {
  let linkUrl = '/'
  let linkText = 'home'

  if (isBlogPost) {
    linkUrl = '/blog'
    linkText = 'blog'
  }

  if (isStartupNotebookPost) {
    linkUrl = '/blog/startup-notebook'
    linkText = 'back'
  }

  return { linkUrl, linkText }
}

export const components = {
  a: CustomLink,
  code: CodeBlock,
  img: ({ src }: { src: string }) => (
    <Image
      src={src}
      width={500}
      height={500}
      layout="responsive"
      objectFit="contain"
      loader={weservLoader}
      quality={100}
    />
  ),
  Tweet: ({ id }: { id: string }) => (
    <div className="flex justify-center">
      <Tweet id={id} />
    </div>
  ),
  LinkPreview
}

interface BlogLayoutProps {
  post?: Post
  children: ReactNode
}

function BlogLayout({ post, children }: BlogLayoutProps) {
  const router = useRouter()
  const isBlogPost = router.pathname.includes('blog/')
  const isStartupNotebookPost = router.pathname.includes('startup-notebook/')
  const { linkUrl, linkText } = getBackButtonProps(
    isBlogPost,
    isStartupNotebookPost
  )

  return (
    <div className="flex flex-col justify-between min-h-dvh overscroll-none">
      <div className="z-10 flex flex-col text-black dark:text-white">
        <div className="px-5 h-16 w-100 flex justify-between items-center">
          <Link
            href={linkUrl}
            className="text-white w-17 flex items-center cursor-w-resize no-underline"
          >
            <span className="text-2xl pr-2">☜</span> {linkText}
          </Link>

          <Link href="/" passHref={true}>
            <svg
              className="fill-current text-white w-5 h-5 cursor-pointer"
              viewBox="0 0 80 80"
            >
              <polygon points="63.33 46.67 40 0 16.67 46.67 63.33 46.67" />
              <polygon points="13.33 53.33 0 80 80 80 66.67 53.33 13.33 53.33" />
            </svg>
          </Link>

          {isBlogPost ? (
            <a
              className="no-underline"
              href={getGithubUrl(post?.slug ?? '')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="text-white w-17 flex items-center cursor-alias">
                edit <div className="text-2xl pl-2">✍︎</div>
              </div>
            </a>
          ) : (
            <div className="w-16" />
          )}
        </div>

        <div className="z-10 px-5 flex flex-col min-h-[calc(100svh-8rem)] bg-white dark:bg-black border-gray-200 dark:border-white border-t border-b">
          <div className="lg:mx-auto lg:w-5xl lg:max-w-5xl xl:w-6xl xl:max-w-6xl">
            {post && <PostHead {...post} />}
            {children}
          </div>
        </div>
      </div>
      <Footer shouldShowSubscribeEmbed={isBlogPost} />
    </div>
  )
}

export default BlogLayout
