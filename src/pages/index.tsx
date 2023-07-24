import { GetStaticProps } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ErrorBoundary } from 'react-error-boundary'

import { allPosts } from 'contentlayer/generated'
import type { Post } from 'contentlayer/generated'

import Header from '@/components/header'
import Footer from '@/components/footer'

const CrystalBall = dynamic(() => import('@/components/crystal-ball'), {
  ssr: true
})

function Home({ posts }: { posts: Post[] }) {
  return (
    <div className="h-screen w-screen flex flex-col justify-between items-center">
      <Header />
      <div className="h-auto z-10 flex flex-col justify-center items-center">
        <Link href="/blog" passHref={true}>
          <div className="h-[50vh] w-[55vw] cursor-zoom-in">
          <ErrorBoundary fallback={<div>Crystal Ball</div>}>
            <CrystalBall cursor={false} />
          </ErrorBoundary>
          </div>
        </Link>
        <Link href={`/blog/${posts[0].slug}`} passHref={true}>
          <div className="text-white text-lg pt-12 px-5 flex justify-center cursor-pointer break-words text-center">
            <strong className="pr-2">New: </strong>
            {posts[0].title}
          </div>
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
