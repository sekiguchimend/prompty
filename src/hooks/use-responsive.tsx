import { useState, useEffect } from "react";

// 様々な画面サイズに対応するためのブレイクポイント
// Tailwindのデフォルトブレイクポイントを参考に設定
const BREAKPOINTS = {
  sm: 640,   // Small devices
  md: 768,   // Medium devices (tablets)
  lg: 1024,  // Large devices (small laptops)
  xl: 1280,  // Extra large devices (laptops, desktops)
  '2xl': 1536 // 2X large devices (large desktops)
};

// スクリーンサイズの型定義
export type ScreenSize = {
  width: number;
  height: number;
  isXs: boolean;       // Extra small (< sm)
  isSm: boolean;       // Small
  isMd: boolean;       // Medium
  isLg: boolean;       // Large
  isXl: boolean;       // Extra large
  is2xl: boolean;      // 2X large
  isMobile: boolean;   // Mobile view (< md)
  isTablet: boolean;   // Tablet view (>= md && < lg)
  isDesktop: boolean;  // Desktop view (>= lg)
  breakpoint: string;  // 現在のブレイクポイント名
};

/**
 * 画面サイズに関する様々な情報を提供するカスタムフック
 * @returns {ScreenSize} 画面サイズとブレイクポイント情報
 */
export function useResponsive(): ScreenSize {
  // 初期値はサーバーサイドレンダリングやSSGのために設定
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isXs: false,
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    is2xl: false,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    breakpoint: 'xs'
  });

  useEffect(() => {
    // 画面サイズの更新関数
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // 各ブレイクポイントのチェック
      const isXs = width < BREAKPOINTS.sm;
      const isSm = width >= BREAKPOINTS.sm && width < BREAKPOINTS.md;
      const isMd = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
      const isLg = width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl;
      const isXl = width >= BREAKPOINTS.xl && width < BREAKPOINTS['2xl'];
      const is2xl = width >= BREAKPOINTS['2xl'];
      
      // デバイスタイプの判定
      const isMobile = width < BREAKPOINTS.md;
      const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
      const isDesktop = width >= BREAKPOINTS.lg;
      
      // 現在のブレイクポイント名を決定
      let breakpoint = 'xs';
      if (is2xl) breakpoint = '2xl';
      else if (isXl) breakpoint = 'xl';
      else if (isLg) breakpoint = 'lg';
      else if (isMd) breakpoint = 'md';
      else if (isSm) breakpoint = 'sm';
      
      setScreenSize({
        width,
        height,
        isXs,
        isSm,
        isMd,
        isLg,
        isXl,
        is2xl,
        isMobile,
        isTablet,
        isDesktop,
        breakpoint
      });
    };
    
    // 初期設定
    updateScreenSize();
    
    // リサイズ時のイベントリスナー
    window.addEventListener('resize', updateScreenSize);
    
    // 画面回転時のイベントリスナー（モバイル向け）
    window.addEventListener('orientationchange', updateScreenSize);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('resize', updateScreenSize);
      window.removeEventListener('orientationchange', updateScreenSize);
    };
  }, []);
  
  return screenSize;
}

// 従来の単純なモバイル判定用のフック（後方互換性のため）
export function useIsMobile() {
  const { isMobile } = useResponsive();
  return isMobile;
} 