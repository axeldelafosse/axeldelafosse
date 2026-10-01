import Link from 'next/link'
import type { AdjacentPosts } from '@/lib/post-navigation'

const linkClass =
  'inline-flex min-h-11 items-center text-gray-500 dark:text-gray-400 no-underline hover:text-gray-900 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4'

export default function PostNavigation({ previous, next }: AdjacentPosts) {
  if (!previous && !next) return null

  return (
    <nav
      aria-label="More writing"
      className="mt-10 mb-8 grid grid-cols-2 gap-x-6 text-sm lg:-mx-36"
    >
      {previous && (
        <Link
          href={`/blog/${previous.slug}`}
          rel="prev"
          title={previous.title}
          aria-label={`Previous post: ${previous.title}`}
          className={`${linkClass} col-start-1 row-start-1 justify-self-start`}
        >
          <span aria-hidden="true">←&nbsp;</span>previous
        </Link>
      )}
      {next && (
        <Link
          href={`/blog/${next.slug}`}
          rel="next"
          title={next.title}
          aria-label={`Next post: ${next.title}`}
          className={`${linkClass} col-start-2 row-start-1 justify-self-end`}
        >
          next<span aria-hidden="true">&nbsp;→</span>
        </Link>
      )}
    </nav>
  )
}
