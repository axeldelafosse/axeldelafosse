import type { GetServerSideProps } from 'next'
import { allPosts } from 'contentlayer2/generated'
import { createSitemap } from '@/lib/sitemap'

export default function Sitemap() {
  return null
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const posts = allPosts.filter((post) => post._raw.sourceFileDir === '.')
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.write(createSitemap(posts))
  res.end()
  return { props: {} }
}
