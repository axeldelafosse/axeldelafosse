const withPWA = require('next-pwa')
const runtimeCaching = require('next-pwa/cache')
const { withContentlayer } = require('next-contentlayer2')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
    scrollRestoration: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    loader: 'custom'
  },
  turbopack: {},
  async redirects() {
    return [
      {
        source: '/resume',
        destination:
          'https://drive.google.com/file/d/188pSCtJbQ8XVtAObNjuDBzRoyh-4szi2/view',
        permanent: false
      }
    ]
  },
  async headers() {
    const cacheHeaders = [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
    ]
    return [{ source: '/_next/static/:static*', headers: cacheHeaders }]
  }
}

const withPWAConfig = withPWA({
  pwa: {
    disable: process.env.NODE_ENV === 'development',
    dest: 'public',
    runtimeCaching
  }
})

module.exports = withBundleAnalyzer(withContentlayer(withPWAConfig(nextConfig)))
