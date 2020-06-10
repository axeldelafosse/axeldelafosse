import React, { useEffect } from 'react';
import Router from 'next/router';

interface GAWindow extends Window {
  gtag: any;
}

function TrackPageView() {
  useEffect(() => {
    Router.events.on('routeChangeComplete', (url: string) => {
      (window as GAWindow & typeof globalThis).gtag(
        'config',
        process.env.NEXT_PUBLIC_GA,
        {
          page_path: url
        }
      );
    });
  }, []);

  return <noscript />;
}

export default TrackPageView;
