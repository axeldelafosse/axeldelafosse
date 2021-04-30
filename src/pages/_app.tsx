import '../styles/globals.scss';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { AppProps } from 'next/app';

import BlogLayout from '@/components/blog-layout';
import TrackPageView from '@/components/track-pageview';

const DynamicLoadAnalytics = dynamic<any>(() =>
  import('@/utils/load-analytics').then((mod) => mod.LoadAnalytics)
);

// import 'react-static-tweets/styles.css';

interface GAWindow extends Window {
  gtag(cmd: string, event: string, props?: Record<string, any>): void;
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
  const gaWindow = (window as unknown) as GAWindow;
  gaWindow?.gtag?.('event', name, {
    event_category:
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

const id = process.env.NEXT_PUBLIC_ID;
const title = process.env.NEXT_PUBLIC_FULL_NAME;
const description = `Startups, Growth, Code, Electronic music...`;

function App({ Component, pageProps, router }: AppProps) {
  const { pathname } = router;
  const [shouldLoadAnalytics, setShouldLoadAnalytics] = useState(false);

  useEffect(() => {
    setShouldLoadAnalytics(true);
  }, []);

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
        {/* <meta
          key="og:image"
          property="og:image"
          content="https://og-image.axeldelafosse.now.sh/.png?theme=dark&md=1&widths=350&heights=350"
        /> */}
        <meta name="application-name" content={title} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={title} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />

        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />

        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA}', { 'transport_type': 'beacon' });
              `
          }}
        />
      </Head>
      {shouldLoadAnalytics && <DynamicLoadAnalytics />}
      {pathname.includes('blog') ? (
        <div className="bg-white dark:bg-black text-black dark:text-white">
          <BlogLayout>
            <Component {...pageProps} />
          </BlogLayout>
        </div>
      ) : (
        <Component {...pageProps} />
      )}
      <TrackPageView />
    </>
  );
}

export default App;
