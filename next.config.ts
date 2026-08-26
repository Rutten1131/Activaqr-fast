import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* output: 'export', // Revertido para Vercel (SSR activo) */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/card/:slug*',
        headers: [
          { key: 'X-Robots-Tag', value: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/catalog/:slug*',
        headers: [
          { key: 'X-Robots-Tag', value: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'frida.activaqr.com',
          },
        ],
        destination: 'https://www.activaqr.com/catalog/frida-m01b',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/audit/:path*',
        destination: 'https://activaqr2.vercel.app/audit/:path*',
      },
    ];
  },
};

export default nextConfig;

