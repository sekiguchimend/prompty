/// <reference types="next" />
/// <reference types="next/types/global" />

// TypeScriptのErrorレベルを引き下げるための型定義
import 'react';

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    NODE_ENV: 'development' | 'production';
  }
}

export {}; 