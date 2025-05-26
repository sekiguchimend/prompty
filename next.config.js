// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // TypeScriptエラーを無視
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLintエラーを無視
  eslint: {
    ignoreDuringBuilds: true,
  },
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
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
    unoptimized: false,
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
    scrollRestoration: true,
    largePageDataBytes: 128 * 1000, // 128KB
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn', 'debug', 'info', 'log'],
    } : false,
  },
  transpilePackages: [],
  webpack: (config, { isServer }) => {
    // 日本語パス対応: シンボリックリンクを無効化
    config.resolve.symlinks = false;
    
    // ファイルシステムキャッシュを無効化（日本語パス問題回避）
    config.cache = false;
    
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
  