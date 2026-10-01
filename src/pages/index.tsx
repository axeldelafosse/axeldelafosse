import type { GetStaticProps } from 'next'
import Link from 'next/link'

import { allPosts } from 'contentlayer2/generated'
import { getPostSummaries, type PostSummary } from '@/lib/post-data'

import Header from '@/components/header'
import Footer from '@/components/footer'
import Logo from '@/components/logo'

type HomeProps = { post: Pick<PostSummary, 'slug' | 'title'> | null }

function Home({ post }: HomeProps) {
  return (
    <div className="home-page w-screen flex flex-col justify-between items-center">
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
        {post && (
          <div className="pt-12 px-5">
            <Link
              href={`/blog/${post.slug}`}
              data-aurora-gravity="post"
              className="aurora-gravity-target text-white text-lg min-h-11 flex items-center justify-center cursor-pointer break-words text-center no-underline"
            >
              <span className="aurora-gravity-visual flex items-baseline justify-center">
                <strong className="pr-2">New: </strong>
                {post.title}
              </span>
            </Link>
          </div>
        )}
      </div>
      <Footer color="white" />
    </div>
  )
}

export default Home

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const [latestPost] = getPostSummaries(allPosts)
  const post = latestPost
    ? { slug: latestPost.slug, title: latestPost.title }
    : null
  return { props: { post } }
}
