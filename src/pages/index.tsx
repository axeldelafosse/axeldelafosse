import { GetStaticProps } from 'next'
import Link from 'next/link'

import { allPosts } from 'contentlayer/generated'
import type { Post } from 'contentlayer/generated'

import Header from '@/components/header'
import Footer from '@/components/footer'
import Logo from '@/components/logo'

function Home({ posts }: { posts: Post[] }) {
  return (
    <div className="h-svh w-screen flex flex-col justify-between items-center">
      <Header />
      <div className="z-10 flex flex-col justify-center items-center">
        <Link href="/blog" passHref={true}>
          <div className="h-48 w-48 sm:h-96 sm:w-96 cursor-zoom-in">
            <Logo color="#fff" />
          </div>
        </Link>
        <Link
          href={`/blog/${posts[0].slug}`}
          className="text-white text-lg pt-12 px-5 flex justify-center cursor-pointer break-words text-center no-underline"
        >
          <strong className="pr-2">New: </strong>
          {posts[0].title}
        </Link>
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
