/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@todos/functions', '@todos/components'],
  experimental: {
    swcPlugins: [["next-superjson-plugin", {}]],
  },
  redirects: async () => [{
    source: '/',
    destination: '/todos',
    permanent: true
  }]
};

export default nextConfig;