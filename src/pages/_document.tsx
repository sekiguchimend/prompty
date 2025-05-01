import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        {/* インラインスタイルを追加してスタイルシートマージの最適化が適用されるようにします */}
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
          }
          .text-balance {
            text-wrap: balance;
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