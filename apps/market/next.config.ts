import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages that should not be bundled on the server
  serverExternalPackages: [
    'vite',
    '@vitejs/plugin-react',
    'rollup',
    'esbuild',
    'fsevents',
    'lightningcss',
    'memfs'
  ],
  
  // These workspace packages need to be transpiled
  transpilePackages: [
    '@pmndrs/chef',
    '@pmndrs/vite-chef',
    '@pmndrs/vite-esmsh'
  ],
  
  // Allow images from S3
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      }
    ],
  }
};

export default nextConfig;
