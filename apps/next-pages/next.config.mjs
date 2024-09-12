/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@todos/functions', '@todos/components'],
  experimental: {
    swcPlugins: [["next-superjson-plugin", {}]],
  },
};

export default nextConfig;