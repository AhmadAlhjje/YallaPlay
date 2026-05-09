/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@yallaplay/shared-types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
