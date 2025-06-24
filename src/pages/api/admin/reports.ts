import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { checkCurrentUserAdmin } from '../../../lib/admin-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 管理者権限チェック
  const isAdmin = await checkCurrentUserAdmin();
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: '管理者権限が必要です' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getReports(req, res);
      case 'PUT':
        return await updateReport(req, res);
      default:
        return res.status(405).json({ 
          success: false, 
          error: 'メソッドが許可されていません' 
        });
    }
  } catch (error) {
    console.error('レポートAPI エラー:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'サーバーエラーが発生しました' 
    });
  }
}

async function getReports(req: NextApiRequest, res: NextApiResponse) {
  const { data: reportsData, error: reportsError } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (reportsError) {
    return res.status(500).json({ 
      success: false, 
      error: reportsError.message 
    });
  }

  // 関連データを取得
  const reporterIds = Array.from(new Set(reportsData?.map(report => report.reporter_id))).filter(id => id);
  const promptIds = Array.from(new Set(reportsData?.map(report => report.prompt_id))).filter(id => id);

  let reportersData: any[] = [];
  let promptsData: any[] = [];

  if (reporterIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, username')
      .in('id', reporterIds);
    reportersData = data || [];
  }

  if (promptIds.length > 0) {
    const { data } = await supabase
      .from('prompts')
      .select('id, title')
      .in('id', promptIds);
    promptsData = data || [];
  }

  // データを結合
  const enrichedReports = reportsData?.map(report => ({
    ...report,
    reporter: reportersData?.find(reporter => reporter.id === report.reporter_id) || {
      display_name: '不明なユーザー',
      username: '不明'
    },
    prompt: promptsData?.find(prompt => prompt.id === report.prompt_id) || {
      title: '不明なプロンプト'
    }
  })) || [];

  return res.status(200).json({ 
    success: true, 
    data: enrichedReports 
  });
}

async function updateReport(req: NextApiRequest, res: NextApiResponse) {
  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ 
      success: false, 
      error: 'IDとステータスが必要です' 
    });
  }

  if (!['resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: '無効なステータスです' 
    });
  }

  const { error } = await supabase
    .from('reports')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }

  return res.status(200).json({ 
    success: true, 
    message: 'レポートを更新しました' 
  });
} 