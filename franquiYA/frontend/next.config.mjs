/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.FRANQUIYA_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
