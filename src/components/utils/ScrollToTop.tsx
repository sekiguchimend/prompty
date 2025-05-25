import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * ページ遷移時に画面トップにスクロールするコンポーネント
 * パスや検索パラメータが変わったときにトップにスクロールします
 */
export const ScrollToTop = () => {
  const router = useRouter();

  useEffect(() => {
    // ページ遷移時に強制的に先頭にスクロール
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto' // 'smooth'だとスクロールアニメーションあり
    });
    
    // 少し遅延を入れて確実にスクロールが適用されるようにする
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 10);
    
    return () => clearTimeout(timeoutId);
  }, [router.asPath]); // パスとクエリパラメータ両方の変更を監視

  return null;
};

export default ScrollToTop; 