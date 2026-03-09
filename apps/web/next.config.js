/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile monorepo packages
  transpilePackages: ['@creatorhub/database', '@creatorhub/shared'],

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.clerk.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000', // MinIO dev
      },
    ],
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: true,
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/sign-in',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/sign-up',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
