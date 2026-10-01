import Head from 'next/head'
import PostDates from './post-dates'
import { canonicalUrl, SITE_NAME } from '@/lib/site'

interface PostHeadProps {
  uid: string
  slug: string
  title: string
  description: string
  date: string
  dateLastModified: string
}

function PostHead({
  slug,
  title,
  description,
  date,
  dateLastModified
}: PostHeadProps) {
  const url = canonicalUrl(`/blog/${slug}`)
  const json = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    headline: title,
    dateCreated: date,
    datePublished: date,
    dateModified: dateLastModified,
    author: {
      '@type': 'Person',
      name: SITE_NAME
    },
    description
  }

  return (
    <>
      <Head>
        <title>{`${title} - ${SITE_NAME}`}</title>
        <link key="canonical" rel="canonical" href={url} />
        <meta key="description" name="description" content={description} />
        <meta key="twitter:title" name="twitter:title" content={title} />
        <meta
          key="twitter:description"
          name="twitter:description"
          content={description}
        />
        <meta key="og:title" property="og:title" content={title} />
        <meta
          key="og:description"
          property="og:description"
          content={description}
        />
        <meta key="og:type" property="og:type" content="article" />
        <meta key="og:url" property="og:url" content={url} />
        <meta
          key="og:image"
          property="og:image"
          content={`https://og-image.axeldelafosse.now.sh/**${encodeURIComponent(
            title
          )}**.png?theme=dark&md=1&fontSize=75px&widths=100&heights=100`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(json).replace(/</g, '\\u003c')
          }}
        />
      </Head>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-5">
        <img
          src="/images/axel.jpg"
          alt={SITE_NAME}
          width={25}
          height={25}
          className="rounded-full"
        />
        <span>{SITE_NAME}</span>
        <PostDates dateLastModified={dateLastModified} />
      </div>
    </>
  )
}

export default PostHead
