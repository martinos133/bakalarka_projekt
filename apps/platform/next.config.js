/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@inzertna-platforma/shared'],
  output: 'standalone',
}

module.exports = nextConfig
