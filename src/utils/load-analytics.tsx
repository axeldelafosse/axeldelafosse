import Head from 'next/head';
import React from 'react';

export function LoadAnalytics() {
  return (
    <Head>
      <script
        defer
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA}`}
      />
    </Head>
  );
}
