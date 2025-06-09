import { NextApiRequest, NextApiResponse } from 'next';
import { UIGenerationRequest, UIGenerationResponse } from '../../../../lib/utils/types';
import { callClaudeAPI } from '../../../../lib/claude/api';
import { generateUIPrompt } from '../../../../lib/claude/prompts';
// import { extractJSONFromResponse } from '../../../../lib/parsers/json-extractor';
// import { generateFallbackUI } from '../../../../lib/generators/fallback';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, existingCode, isIteration } = req.body as UIGenerationRequest;

    // 入力検証
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'プロンプトが必要です' });
    }

    const actionType = isIteration ? '改善' : '生成';
    console.log(`🚀 [Claude] 単一ページUI${actionType}開始:`, prompt.substring(0, 100) + '...');

    let result: UIGenerationResponse;

    try {
      // Claude APIを使用してUI生成
      const systemPrompt = generateUIPrompt(prompt.trim(), existingCode);
      const claudeResponse = await callClaudeAPI(systemPrompt);
      
      // Claude APIからのレスポンスをログ出力（デバッグ用）
      console.log('📥 Claude API Response length:', claudeResponse.length);
      console.log('📄 Response preview (first 200 chars):', claudeResponse.substring(0, 200));
      
      // JSONレスポンスを抽出・解析（一時的に簡単な実装）
      try {
        result = JSON.parse(claudeResponse);
      } catch {
        result = {
          html: `<h1>${prompt}</h1><p>Generated UI placeholder</p>`,
          css: 'body { font-family: Arial, sans-serif; }',
          js: '',
          description: `Generated UI for: ${prompt}`
        };
      }
      
      // 抽出結果の詳細ログ
      console.log('📋 Extracted result details:', {
        htmlLength: result.html?.length || 0,
        cssLength: result.css?.length || 0,
        jsLength: result.js?.length || 0,
        description: result.description?.substring(0, 100) + '...'
      });
      
      console.log(`✅ [Claude] 単一ページ${actionType}完了`);

    } catch (apiError) {
      console.error(`❌ Claude 単一ページ${actionType}エラー:`, apiError);
      
      // フォールバックUIを生成（一時的に簡単な実装）
      console.log('🔄 フォールバックUIにフォールオーバー中...');
      result = {
        html: `<h1>${prompt}</h1><p>Fallback UI placeholder</p>`,
        css: 'body { font-family: Arial, sans-serif; }',
        js: '',
        description: `Fallback UI for: ${prompt}`
      };
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ UI生成エラー:', error);
    
    // 最終フォールバック
    const fallback = {
      html: `<h1>${req.body?.prompt || 'サンプルUI'}</h1><p>Error fallback UI</p>`,
      css: 'body { font-family: Arial, sans-serif; color: red; }',
      js: '',
      description: `Error fallback for: ${req.body?.prompt || 'サンプルUI'}`
    };
    return res.status(500).json({
      ...fallback,
      error: error instanceof Error ? error.message : '予期しないエラーが発生しました'
    });
  }
} 