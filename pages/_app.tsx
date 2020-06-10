import React from 'react';
import Head from 'next/head';
import { AppProps } from 'next/app';
import { createGlobalStyle } from 'styled-components';

import BlogLayout from '../src/components/blog-layout';
import TrackPageView from '../src/components/track-pageview';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: monospace;
  }

  * {
    box-sizing: border-box;
  }

  code {
    background-color: darkgrey;
    border-radius: 2px;
    padding: 0 2px;
    font-size: 95%;
  }
`;

const id = process.env.NEXT_PUBLIC_ID;
const title = process.env.NEXT_PUBLIC_FULL_NAME;
const description = `Startups. Growth. Code. Electronic music.`;

function App({ Component, pageProps, router }: AppProps) {
  const { pathname } = router;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta key="title" name="title" content={title} />
        <meta key="description" name="description" content={description} />
        <meta key="twitter:card" name="twitter:card" content="summary" />
        <meta key="twitter:title" name="twitter:title" content={title} />
        <meta
          key="twitter:description"
          name="twitter:description"
          content={description}
        />
        <meta key="twitter:site" name="twitter:site" content={`@${id}`} />
        <meta key="og:title" property="og:title" content={title} />
        <meta
          key="og:description"
          property="og:description"
          content={description}
        />
        <meta
          key="og:url"
          property="og:url"
          content={`https://${id}.com`}
        />
        <meta
          key="og:site_name"
          property="og:site_name"
          content={title}
        />
        <meta key="og:type" property="og:type" content="website" />
        <link
          rel="shortcut icon"
          type="image/x-icon"
          href="/static/favicon.ico"
        />
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA}`}
        />
        <script />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA}');
              `
          }}
        />
      </Head>
      {pathname.includes('blog') ? (
        <BlogLayout>
          <Component {...pageProps} />
        </BlogLayout>
      ) : (
        <Component {...pageProps} />
      )}
      <GlobalStyle />
      <TrackPageView />
    </>
  );
}

export default App;
