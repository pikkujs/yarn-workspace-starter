/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    transpilePackages: ['@vramework-workspace-starter/functions', '@vramework-workspace-starter/components'],
    experimental: {
      // Used to fix dates parsing issues with nextj
      // swcPlugins: [['next-superjson-plugin', {}]],
    },
    redirects: async () => [
      {
        source: '/',
        destination: '/todos',
        permanent: true,
      },
    ],
    webpack: (config) => {
      config.resolve.extensionAlias = {
        '.js': ['.js', '.ts'], // Resolves .js imports to both .js and .ts files
      };
      return config;
    },
  }
  
  export default nextConfig
  