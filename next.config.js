/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'localhost', 
      'via.placeholder.com', 
      'randomuser.me',
      'images.unsplash.com',
      'placehold.co'
    ],
  },
  // Add Payload CMS configuration
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    return config;
  },
};

module.exports = nextConfig;
