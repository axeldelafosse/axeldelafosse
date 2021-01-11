import React from 'react';
import Head from 'next/head';
import { AppProps } from 'next/app';
import { createGlobalStyle } from 'styled-components';

import BlogLayout from '@/components/blog-layout';
import TrackPageView from '@/components/track-pageview';

interface GAWindow extends Window {
  gtag: any;
}

export function reportWebVitals({
  id,
  name,
  label,
  value
}: {
  id: string;
  name: string;
  label: string;
  value: number;
}) {
  (window as GAWindow & typeof globalThis).gtag('event', name, {
    eventCategory:
      label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
    // Google Analytics metrics must be integers, so the value is rounded.
    // For CLS the value is first multiplied by 1000 for greater precision
    // (note: increase the multiplier for greater precision if needed).
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    // The `id` value will be unique to the current page load. When sending
    // multiple values from the same page (e.g. for CLS), Google Analytics can
    // compute a total by grouping on this ID (note: requires `eventLabel` to
    // be a dimension in your report).
    event_label: id,
    // Use a non-interaction event to avoid affecting bounce rate.
    non_interaction: true
  });
}

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: monospace;
    font-size: 115%;
  }

  * {
    box-sizing: border-box;
  }

  code {
    color: rgb(40, 42, 46);
    background-color: rgb(246, 246, 246);
    border-radius: 2px;
    padding: 0 2px;
    font-size: 99%;
  }

  .language-tsx {
    color: rgb(40, 42, 46);
    background-color: rgb(246, 246, 246);
    overflow-x: auto;
  }
`;

const id = process.env.NEXT_PUBLIC_ID;
const title = process.env.NEXT_PUBLIC_FULL_NAME;
const description = `Startups, Growth, Code, Electronic music...`;

function App({ Component, pageProps, router }: AppProps) {
  const { pathname } = router;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta key="title" name="title" content={title} />
        <meta key="description" name="description" content={description} />
        <meta
          key="twitter:card"
          name="twitter:card"
          content="summary_large_image"
        />
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
        <meta key="og:url" property="og:url" content={`https://${id}.com`} />
        <meta key="og:site_name" property="og:site_name" content={title} />
        <meta key="og:type" property="og:type" content="website" />
        <meta
          key="og:image"
          property="og:image"
          content="https://og-image.axeldelafosse.now.sh/.png?theme=dark&md=1&widths=350&heights=350"
        />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
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
