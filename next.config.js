// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['qrxrulntwojimhhhnwqk.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'prompty-zeta.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/**',
      },
    ],
    unoptimized: false,
  },
  assetPrefix: '',
  basePath: '',
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      'framer-motion',
      'recharts',
      'sonner',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn', 'debug', 'info', 'log'],
    } : false,
  },
  transpilePackages: [],
  webpack: (config, { isServer }) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        styles: {
          name: 'styles',
          test: /\.(css|scss)$/,
          chunks: 'all',
          enforce: true
        }
      },
    };
    
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.(css|scss)$/,
        chunks: 'all',
        enforce: true,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
  