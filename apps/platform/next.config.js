const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@inzertna-platforma/shared'],
  output: 'standalone',
  turbopack: {
    root: path.join(__dirname, '..', '..'),
  },
}

module.exports = nextConfig
