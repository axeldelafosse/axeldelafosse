import React, { useEffect } from 'react'
import { GetStaticProps } from 'next'
import Link from 'next/link'

import postList, { Post } from '@/utils/post-list'
import Gradient from '@/components/gradient'
import Logo from '@/components/logo'
import Header from '@/components/header'
import Footer from '@/components/footer'
import styles from '@/components/logo.module.scss'

function Home({ posts }: { posts: Post[] }) {
  useEffect(() => {
    const gradient = new Gradient()
    // @ts-ignore
    gradient.initGradient('#gradient-canvas')
  }, [])

  return (
    <>
      <div className="absolute h-screen w-screen">
        <canvas id="gradient-canvas" data-transition-in />
      </div>
      <div className="h-screen w-screen flex flex-col justify-between items-center">
        <Header />
        <div className="h-auto z-10 flex flex-col justify-center items-center">
          <Link href="/blog" passHref={true}>
            <div className={styles.logo}>
              <Logo color="#FFF" />
              {/* <img alt="think outside the box" /> */}
            </div>
          </Link>
          <Link href={posts[0].urlPath} passHref={true}>
            <div className="text-white text-lg pt-12 flex justify-center cursor-pointer">
              <strong className="pr-2">New: </strong>
              {posts[0].title}
            </div>
          </Link>
        </div>
        <Footer color="white" />
      </div>
    </>
  )
}

export default Home

export const getStaticProps: GetStaticProps = async () => {
  const posts = postList()
  return { props: { posts } }
}
