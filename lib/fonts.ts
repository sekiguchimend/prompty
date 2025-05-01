// src/lib/fonts.ts
import { Noto_Sans_JP } from 'next/font/google';

export const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
});
