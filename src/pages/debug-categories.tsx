import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabaseClient';
import Head from 'next/head';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count: number; // 記事数
}

interface Prompt {
  id: string;
  title: string;
  category_id: string | null;
}

const DebugCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // カテゴリー一覧の取得
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
          
        if (categoryError) {
          throw new Error(`カテゴリー取得エラー: ${categoryError.message}`);
        }
        
        // プロンプト一覧の取得
        const { data: promptData, error: promptError } = await supabase
          .from('prompts')
          .select('id, title, category_id');
          
        if (promptError) {
          throw new Error(`プロンプト取得エラー: ${promptError.message}`);
        }
        
        // カテゴリーごとの記事数を集計
        const counts: Record<string, number> = {};
        promptData.forEach((prompt) => {
          const categoryId = prompt.category_id || 'null';
          counts[categoryId] = (counts[categoryId] || 0) + 1;
        });
        
        // カテゴリーと記事数を結合
        const categoriesWithCounts = categoryData.map((category) => ({
          ...category,
          count: counts[category.id] || 0
        }));
        
        // カテゴリーに属さない記事の数も表示
        const uncategorizedCount = counts['null'] || 0;
        
        // 記事数でソート（多い順）
        const sortedCategories = categoriesWithCounts.sort((a, b) => b.count - a.count);
        
        setCategories(sortedCategories);
        setPrompts(promptData);
        
        // デバッグ情報を表示
        console.log('カテゴリー総数:', categoryData.length);
        console.log('記事総数:', promptData.length);
        console.log('カテゴリーなしの記事数:', uncategorizedCount);
        console.log('カテゴリー詳細:', sortedCategories);
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // 指定したカテゴリーに属する記事を取得
  const getPromptsByCategory = (categoryId: string) => {
    return prompts.filter(prompt => prompt.category_id === categoryId);
  };
  
  // カテゴリーなしの記事を取得
  const getUncategorizedPrompts = () => {
    return prompts.filter(prompt => !prompt.category_id);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>カテゴリーデバッグ | Prompty</title>
      </Head>
      
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-8">
        <h1 className="text-2xl font-bold mb-6">カテゴリーデバッグ</h1>
        
        {loading ? (
          <p className="text-gray-500">データを読み込み中...</p>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">カテゴリー一覧</h2>
              <p className="mb-4">総カテゴリー数: {categories.length}, 総記事数: {prompts.length}</p>
              
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">ID</th>
                    <th className="border p-2 text-left">名前</th>
                    <th className="border p-2 text-left">スラッグ</th>
                    <th className="border p-2 text-center">記事数</th>
                    <th className="border p-2 text-left">説明</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className={category.count > 0 ? '' : 'text-gray-400'}>
                      <td className="border p-2">{category.id}</td>
                      <td className="border p-2 font-medium">{category.name}</td>
                      <td className="border p-2">{category.slug}</td>
                      <td className="border p-2 text-center font-bold">{category.count}</td>
                      <td className="border p-2">{category.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">カテゴリーなしの記事</h2>
              <p className="mb-4">カテゴリー未設定の記事数: {getUncategorizedPrompts().length}</p>
              
              {getUncategorizedPrompts().length > 0 ? (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">ID</th>
                      <th className="border p-2 text-left">タイトル</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getUncategorizedPrompts().map((prompt) => (
                      <tr key={prompt.id}>
                        <td className="border p-2">{prompt.id}</td>
                        <td className="border p-2">{prompt.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">カテゴリーなしの記事はありません</p>
              )}
            </div>
            
            {/* 生成AIカテゴリーに属する記事（特別に表示） */}
            {categories.filter(c => c.name === '生成AI').map(category => (
              <div key={category.id} className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">「生成AI」カテゴリーの記事</h2>
                <p className="mb-4">
                  ID: {category.id}, スラッグ: {category.slug}, 記事数: {category.count}
                </p>
                
                {category.count > 0 ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">ID</th>
                        <th className="border p-2 text-left">タイトル</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPromptsByCategory(category.id).map((prompt) => (
                        <tr key={prompt.id}>
                          <td className="border p-2">{prompt.id}</td>
                          <td className="border p-2">{prompt.title}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500">このカテゴリーにはまだ記事がありません</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default DebugCategoriesPage; 