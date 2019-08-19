import React from 'react';
import Head from 'next/head';
import App, { Container } from 'next/app';
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
`;

const title = `Axel Delafosse`;
const description = `Axel's blog`;

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    const { pathname } = this.props.router;

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
          <meta
            key="twitter:site"
            name="twitter:site"
            content="@axeldelafosse"
          />
          <meta key="og:title" property="og:title" content={title} />
          <meta
            key="og:description"
            property="og:description"
            content={description}
          />
          <meta
            key="og:url"
            property="og:url"
            content="https://axeldelafosse.com"
          />
          <meta
            key="og:site_name"
            property="og:site_name"
            content="Axel Delafosse"
          />
          <meta key="og:type" property="og:type" content="website" />
          <link
            rel="shortcut icon"
            type="image/x-icon"
            href="/static/favicon.ico"
          />
          <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=UA-145831230-1"
          />
          <script />
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'UA-145831230-1');
              `
            }}
          />
        </Head>
        <Container>
          {pathname.includes('blog') ? (
            <BlogLayout>
              <Component {...pageProps} />
            </BlogLayout>
          ) : (
            <Component {...pageProps} />
          )}
          <GlobalStyle />
          <TrackPageView />
        </Container>
      </>
    );
  }
}

export default MyApp;
