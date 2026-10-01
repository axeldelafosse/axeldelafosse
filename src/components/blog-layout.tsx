import type { ReactNode } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import type { PostMetadata } from '@/lib/post-data'

import PostHead from '@/components/post-head'
import Footer from '@/components/footer'
import ThemeToggle from '@/components/theme-toggle'

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

interface BlogLayoutProps {
  post?: PostMetadata
  children: ReactNode
  onEdit?: () => void
}

function BlogLayout({ post, children, onEdit }: BlogLayoutProps) {
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
        <div className="px-5 h-16 grid grid-cols-[1fr_auto_1fr] items-center">
          <Link
            href={linkUrl}
            className="text-white w-17 flex items-center cursor-w-resize no-underline"
          >
            <span className="text-2xl pr-2">☜</span> {linkText}
          </Link>

          <Link href="/" aria-label="Home" passHref={true}>
            <svg
              className="fill-current text-white w-5 h-5 cursor-pointer"
              viewBox="0 0 80 80"
            >
              <polygon points="63.33 46.67 40 0 16.67 46.67 63.33 46.67" />
              <polygon points="13.33 53.33 0 80 80 80 66.67 53.33 13.33 53.33" />
            </svg>
          </Link>

          <div className="flex items-center justify-self-end gap-2">
            {isBlogPost && onEdit ? (
              <button
                type="button"
                className="text-white w-17 flex items-center cursor-pointer"
                onClick={onEdit}
              >
                edit <span className="text-2xl pl-2">✍︎</span>
              </button>
            ) : null}
            <ThemeToggle />
          </div>
        </div>

        <div
          data-aurora-occluder="true"
          className="z-10 px-5 flex flex-col min-h-[calc(100svh-8rem)] bg-white dark:bg-black border-gray-200 dark:border-white border-t border-b"
        >
          <div className="mx-auto w-full max-w-[580px]">
            {post && <PostHead {...post} />}
            {children}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default BlogLayout
