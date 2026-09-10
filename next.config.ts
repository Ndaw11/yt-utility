/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["yt3.ggpht.com", "i.ytimg.com"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;