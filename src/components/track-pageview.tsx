import React, { useEffect } from 'react';
import Router from 'next/router';

interface GAWindow extends Window {
  gtag(cmd: string, event: string, props?: Record<string, any>): void;
}

function TrackPageView() {
  useEffect(() => {
    Router.events.on('routeChangeComplete', (url: string) => {
      ((window as unknown) as GAWindow).gtag(
        'config',
        process.env.NEXT_PUBLIC_GA as string,
        {
          page_path: url,
          transport_type: 'beacon'
        }
      );
    });
  }, []);

  return <noscript />;
}

export default TrackPageView;
