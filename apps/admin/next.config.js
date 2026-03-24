const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@inzertna-platforma/shared'],
  /** Umožní import wizarda z ../platform (rovnaký flow ako na platforme). */
  experimental: {
    externalDir: true,
  },
  output: 'standalone',
  turbopack: {
    root: path.join(__dirname, '..', '..'),
  },
}

module.exports = nextConfig
