/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type checking is enforced during build. Keep it that way — the errors
    // it caught were real schema-drift bugs, not false positives.
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
