import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&display=swap"
            rel="stylesheet"
          />
        </noscript>

        {/* Critical CSS - 上位表示要素のスタイルを先に読み込み */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* プロジェクト全体で共有される基本的なスタイル */
          :root {
            --primary-color: rgba(59, 130, 246, 1);
            --secondary-color: rgba(239, 68, 68, 1);
            --prompty-pink: rgba(236, 72, 153, 1);
            --background-color: rgba(249, 250, 251, 1);
          }
          
          body {
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            font-display: swap;
          }
          
          .text-balance {
            text-wrap: balance;
          }
          
          /* Critical CSS for above-the-fold content */
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          /* PromptCard の重要なスタイル */
          .text-base {
            font-size: 1rem;
            line-height: 1.5rem;
          }
          
          .font-medium {
            font-weight: 500;
          }
          
          .mb-1 {
            margin-bottom: 0.25rem;
          }
          
          /* 画像の最適化スタイル */
          img {
            content-visibility: auto;
            contain-intrinsic-size: 200px 112px;
          }
          
          /* レイアウトシフト防止 */
          .pt-2 {
            padding-top: 0.5rem;
          }
          
          .aspect-video {
            aspect-ratio: 16 / 9;
          }
        `}} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 