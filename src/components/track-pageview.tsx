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
        'UA-145831230-1',
        {
          page_path: url
        }
      );
    });
  }, []);

  return <noscript />;
}

export default TrackPageView;
