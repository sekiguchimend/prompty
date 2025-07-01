// .envファイルを読み込む（重要！）
require('dotenv').config({ path: '/home/ec2-user/prompty/.env' });

module.exports = {
  apps: [
    {
      name: 'prompty',
      script: 'npm',
      args: 'start',
      cwd: '/home/ec2-user/prompty',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        
        // Supabase設定
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        
        // Stripe設定 - 直接設定版（セキュリティ注意）
        // 方法1: システム環境変数から取得（推奨）
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        
        // 方法2: 直接設定（本番環境のみ、.gitignoreを忘れずに）
        // STRIPE_SECRET_KEY: "sk_live_YOUR_ACTUAL_KEY_HERE",
        
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        
        // アプリケーション設定
        NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
        
        // AI サービス（使用している場合）
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        
        // Firebase（通知機能を使用している場合）
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        
        NEXT_PUBLIC_VAPID_KEY: process.env.NEXT_PUBLIC_VAPID_KEY,
      },
      error_file: '/home/ec2-user/logs/prompty-error.log',
      out_file: '/home/ec2-user/logs/prompty-out.log',
      log_file: '/home/ec2-user/logs/prompty-combined.log',
      time: true,
    },
  ],
}; 