import { GetStaticProps } from 'next'
import Link from 'next/link'

import { allPosts } from 'contentlayer2/generated'
import type { Post } from 'contentlayer2/generated'

import Header from '@/components/header'
import Footer from '@/components/footer'
import Logo from '@/components/logo'

function Home({ posts }: { posts: Post[] }) {
  return (
    <div className="h-svh w-screen flex flex-col justify-between items-center">
      <Header />
      <div className="z-10 flex flex-col justify-center items-center">
        <Link
          href="/blog"
          aria-label="View all blog posts"
          data-aurora-gravity="logo"
          className="aurora-gravity-target block rounded-full"
        >
          <div className="aurora-gravity-visual h-48 w-48 sm:h-96 sm:w-96 cursor-zoom-in">
            <Logo color="#fff" />
          </div>
        </Link>
        <div className="pt-12 px-5">
          <Link
            href={`/blog/${posts[0].slug}`}
            data-aurora-gravity="post"
            className="aurora-gravity-target text-white text-lg min-h-11 flex items-center justify-center cursor-pointer break-words text-center no-underline"
          >
            <span className="aurora-gravity-visual flex items-baseline justify-center">
              <strong className="pr-2">New: </strong>
              {posts[0].title}
            </span>
          </Link>
        </div>
      </div>
      <Footer color="white" />
    </div>
  )
}

export default Home

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
