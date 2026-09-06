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
    // Load the complete layout styles before paint, rather than deferring them
    // behind Critters' partial critical-CSS pass.
    optimizeCss: false,
    scrollRestoration: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    loader: 'custom'
  },
  turbopack: {
    rules: {
      '*.wgsl': {
        loaders: [
          {
            loader: '@vgpu/wgsl/loader-webpack',
            options: { minify: process.env.NODE_ENV === 'production' }
          }
        ],
        as: '*.js'
      }
    }
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.wgsl$/,
      loader: '@vgpu/wgsl/loader-webpack',
      options: { minify: process.env.NODE_ENV === 'production' }
    })

    return config
  },
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
    if (process.env.NODE_ENV !== 'production') return []

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
