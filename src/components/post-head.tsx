import Head from 'next/head'

interface PostHeadProps {
  uid: string
  title: string
  description: string
  date: string
  dateLastModified: string
}

function PostHead({
  uid,
  title,
  description,
  date,
  dateLastModified
}: PostHeadProps) {
  const url = `https://${process.env.NEXT_PUBLIC_ID}.com/blog/${uid}`
  const json = {
    '@context': 'http://www.schema.org',
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
      name: process.env.NEXT_PUBLIC_FULL_NAME
    },
    description
  }

  return (
    <>
      <Head>
        <title>
          {title} - {process.env.NEXT_PUBLIC_FULL_NAME}
        </title>
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
        />
      </Head>

      <div className="flex items-center pt-5">
        <img
          src="/images/axel.png"
          alt={process.env.NEXT_PUBLIC_FULL_NAME}
          width={25}
          height={25}
          className="rounded-full"
        />
        <div className="pl-3">{process.env.NEXT_PUBLIC_FULL_NAME}</div>
        <div className="pl-3">⟫</div>
        <div className="pl-3">{new Date(dateLastModified).toDateString()}</div>
      </div>
    </>
  )
}

export default PostHead
