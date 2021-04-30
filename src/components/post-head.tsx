import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styled from 'styled-components';

const Meta = styled.div`
  display: flex;
  align-items: center;
  padding-top: 5px;
`;

const Img = styled(Image)`
  border-radius: 50%;
  width: 25px;
  height: 25px;
`;

const Text = styled.div`
  font-size: 14px;
  padding-left: 10px;
`;

interface PostHeadProps {
  uid: string;
  title: string;
  description: string;
  date: string;
  dateLastModified: string;
}

function PostHead({
  uid,
  title,
  description,
  date,
  dateLastModified
}: PostHeadProps) {
  const url = `https://${process.env.NEXT_PUBLIC_ID}.com/blog/${uid}`;
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
  };

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

      <Meta>
        <Img
          src="/images/axel.png"
          alt={process.env.NEXT_PUBLIC_FULL_NAME}
          width={25}
          height={25}
        />
        <Text>{process.env.NEXT_PUBLIC_FULL_NAME}</Text>
        <Text>⟫</Text>
        <Text>{new Date(dateLastModified).toDateString()}</Text>
      </Meta>
    </>
  );
}

export default PostHead;
