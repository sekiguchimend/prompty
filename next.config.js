/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  // Environment configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Security headers
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()'
      }
    ];

    // Add CSP header - 動画対応版
    const cspValue = process.env.NODE_ENV === 'production' 
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:; style-src 'self' 'unsafe-inline' https: https://fonts.googleapis.com; font-src 'self' https: data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https: wss:;"
      : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; style-src 'self' 'unsafe-inline' https: https://fonts.googleapis.com; font-src 'self' https: data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https: wss:;";
    
      securityHeaders.push({
        key: 'Content-Security-Policy',
      value: cspValue
      });

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Image optimization
  images: {
    domains: [
      'qrxrulntwojimhhhnwqk.supabase.co', // Supabase storage
      'prompty-ai.com',
      'localhost',
      'lh3.googleusercontent.com' // Google profile images
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false, // Security: disable SVG
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Security: Remove source maps in production
    if (!dev && !isServer) {
      config.devtool = false;
    }

    return config;
  },

  // Experimental features
  experimental: {
    // Enable modern features
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },

  // Compression
  compress: true,

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false, // Fail build on TypeScript errors
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false, // Fail build on ESLint errors
  },

  // Trailing slash configuration
  trailingSlash: false,

  // SEO最適化
  async redirects() {
    return [
      // WWW redirect (if needed)
      {
        source: '/www.:path*',
        destination: '/:path*',
        permanent: true,
      },
      // Old URLs redirect
      {
        source: '/prompt/:id',
        destination: '/prompts/:id',
        permanent: true,
      },
    ];
  },

  // Dynamic sitemap
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap.xml',
      },
      {
        source: '/robots.txt',
        destination: '/api/robots',
      },
    ];
  },

  // Generate static pages for better SEO
  async generateBuildId() {
    // Use git commit hash or timestamp
    return new Date().getTime().toString();
  },
};

module.exports = nextConfig;