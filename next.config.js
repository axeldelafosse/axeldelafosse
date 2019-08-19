const withPlugins = require('next-compose-plugins');
const optimizedImages = require('next-optimized-images');
const images = require('remark-images');
const emoji = require('remark-emoji');
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/
});

const nextConfig = {
  env: {},
  target: 'serverless',
  publicRuntimeConfig: false
};

module.exports = withPlugins([
  [optimizedImages],
  [
    withMDX,
    {
      pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
      remarkPlugins: [images, emoji]
    }
  ],
  nextConfig
]);
