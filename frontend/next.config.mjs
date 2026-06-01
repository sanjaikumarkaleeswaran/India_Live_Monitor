/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // In production, route to the Render backend. In development, route to localhost.
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors or warnings.
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
