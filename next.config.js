// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['qrxrulntwojimhhhnwqk.supabase.co'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // 本番環境では必要に応じてトランスパイルするパッケージを指定
  transpilePackages: [],
};

module.exports = nextConfig;
  