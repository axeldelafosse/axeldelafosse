const withPlugins = require('next-compose-plugins');
const images = require('remark-images');
const emoji = require('remark-emoji');
const slug = require('remark-slug');
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/
});
const withPreact = require('next-plugin-preact');
const withPWA = require('next-pwa');
const runtimeCaching = require('next-pwa/cache');

const nextConfig = {
  env: {},
  publicRuntimeConfig: false,
  images: {
    domains: ['pbs.twimg.com']
  },
  future: {
    webpack5: false,
    strictPostcssConfiguration: true
  },
  async headers() {
    const cacheHeaders = [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
    ];
    return [{ source: '/_next/static/:static*', headers: cacheHeaders }];
  }
};

module.exports = withPlugins([
  [withPreact],
  [
    withPWA,
    {
      pwa: {
        disable: process.env.NODE_ENV === 'development',
        dest: 'public',
        runtimeCaching
      }
    }
  ],
  [
    withMDX,
    {
      pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
      remarkPlugins: [images, emoji, slug]
    }
  ],
  nextConfig
]);
