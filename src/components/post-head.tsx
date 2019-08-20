import React from 'react';
import Head from 'next/head';

interface PostHeadProps {
  uid: string;
  title: string;
  description: string;
  date: string;
  dateLastModified: string;
}

function PostHead(props: PostHeadProps) {
  const { uid, title, description, date, dateLastModified } = props;
  const url = `https://axeldelafosse.com/blog/${uid}`;
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
      name: 'Axel Delafosse'
    },
    description
  };

  return (
    <Head>
      <title>{title} - Axel Delafosse</title>
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
      />
    </Head>
  );
}

export default PostHead;
