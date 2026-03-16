/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['antd', '@ant-design/icons', '@ant-design/charts', 'recharts'],
};

module.exports = nextConfig;
