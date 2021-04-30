import React from 'react';
import { NextPageContext } from 'next';

import postList, { Post } from '@/utils/post-list';

const formatDate = (date: number) => {
  return new Date(date).toISOString().substring(0, 10);
};

const sitemapXml = (posts: Post[]) => {
  let latestPost = 0;
  let postsXML = '';

  posts.map((post) => {
    const postDate = Date.parse(post.dateLastModified);
    if (!latestPost || postDate > latestPost) {
      latestPost = postDate;
    }

    const postURL = `https://${process.env.NEXT_PUBLIC_ID}.com${post.urlPath}/`;
    postsXML += `
      <url>
        <loc>${postURL}</loc>
        <lastmod>${formatDate(postDate)}</lastmod>
        <priority>0.50</priority>
      </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://${process.env.NEXT_PUBLIC_ID}.com/</loc>
        <lastmod>${formatDate(latestPost)}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>1.00</priority>
      </url>
      <url>
        <loc>https://${process.env.NEXT_PUBLIC_ID}.com/blog/</loc>
        <lastmod>${formatDate(latestPost)}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.80</priority>
      </url>
      ${postsXML}
    </urlset>`;
};

class Sitemap extends React.Component {
  static async getInitialProps(ctx: NextPageContext) {
    const { res } = ctx;
    const posts = postList();

    if (res && posts) {
      res.setHeader('Content-Type', 'text/xml');
      res.write(sitemapXml(posts));
      res.end();
    }
  }
}

export default Sitemap;
