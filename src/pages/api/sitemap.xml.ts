import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabaseAdminClient';

const DOMAIN = 'https://prompty-ai.com';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const urls: SitemapUrl[] = [];
    const currentDate = new Date().toISOString().split('T')[0];

    // 基本ページ
    const staticPages = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/search', priority: '0.9', changefreq: 'daily' },
      { path: '/popular', priority: '0.8', changefreq: 'daily' },
      { path: '/featured', priority: '0.8', changefreq: 'daily' },
      { path: '/create-post', priority: '0.7', changefreq: 'weekly' },
      { path: '/how-to-use', priority: '0.6', changefreq: 'monthly' },
      { path: '/prompty-profile', priority: '0.6', changefreq: 'monthly' },
      { path: '/help-center', priority: '0.6', changefreq: 'monthly' },
      { path: '/terms', priority: '0.3', changefreq: 'yearly' },
      { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
    ];

    staticPages.forEach(page => {
      urls.push({
        loc: `${DOMAIN}${page.path}`,
        lastmod: currentDate,
        changefreq: page.changefreq,
        priority: page.priority
      });
    });

    // カテゴリページ
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('slug')
      .eq('published', true);

    if (categories) {
      categories.forEach(category => {
        urls.push({
          loc: `${DOMAIN}/category/${category.slug}`,
          lastmod: currentDate,
          changefreq: 'daily',
          priority: '0.8'
        });
      });
    }

    // プロンプトページ（最新100件）
    const { data: prompts } = await supabaseAdmin
      .from('prompts')
      .select('id, updated_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (prompts) {
      prompts.forEach(prompt => {
        const lastmod = prompt.updated_at ? 
          new Date(prompt.updated_at).toISOString().split('T')[0] : 
          currentDate;
        
        urls.push({
          loc: `${DOMAIN}/prompts/${prompt.id}`,
          lastmod,
          changefreq: 'weekly',
          priority: '0.7'
        });
      });
    }

    // ユーザーページ（アクティブなユーザー最新50人）
    const { data: users } = await supabaseAdmin
      .from('profiles')
      .select('id, updated_at')
      .not('display_name', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (users) {
      users.forEach(user => {
        const lastmod = user.updated_at ? 
          new Date(user.updated_at).toISOString().split('T')[0] : 
          currentDate;
        
        urls.push({
          loc: `${DOMAIN}/users/${user.id}`,
          lastmod,
          changefreq: 'weekly',
          priority: '0.6'
        });
      });
    }

    // XMLサイトマップ生成
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).send(sitemap);

  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
} 