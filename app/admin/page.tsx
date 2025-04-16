"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs';
import { supabase } from '../../src/lib/supabaseClient';
import { useAuth } from '../../src/lib/auth-context';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import FeedbackDropdown from '../../src/components/FeedbackDropdown';

// 問い合わせタイプの定義
interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// フィードバックタイプの定義
interface Feedback {
  id: string;
  feedback_type: string;
  email: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

// 管理者メールアドレスのリスト
const ADMIN_EMAILS = [
  'admin@example.com',
  'taniguchi.kouhei@gmail.com',
];

// 特定のドメインを管理者として認証
const ADMIN_DOMAINS = [
  'queuecorp.jp',
];

// 管理者かどうかを判定する関数
const isAdminUser = (email?: string | null): boolean => {
  if (!email) return false;
  
  // メールアドレスがリストに含まれるか確認
  if (ADMIN_EMAILS.includes(email)) {
    return true;
  }
  
  // メールのドメイン部分を抽出
  const domain = email.split('@')[1];
  
  // ドメインが管理者ドメインに含まれるか確認
  const isDomainMatch = ADMIN_DOMAINS.some(adminDomain => domain === adminDomain);
  
  return isDomainMatch;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, session } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contacts');
  
  useEffect(() => {
    // 非ログインユーザーはリダイレクト
    if (!user) {
      router.push('/');
      return;
    }
    
    // 管理者権限のないユーザーはリダイレクト
    if (!isAdminUser(user?.email)) {
      router.push('/');
      return;
    }
    
    // データの取得
    fetchData();
  }, [user, router]);
  
  // お問い合わせとフィードバックデータの取得
  const fetchData = async () => {
    setLoading(true);
    
    try {
      // お問い合わせの取得
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (contactError) throw contactError;
      
      if (contactData) {
        setContacts(contactData);
      }
      
      // フィードバックの取得
      try {
        // まずRPC経由で取得を試みる
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_feedback');
        
        if (!rpcError && rpcData) {
          setFeedback(rpcData);
        } else {
          // RPCが失敗した場合は直接テーブルから取得
          const { data: feedbackData, error: feedbackError } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (feedbackError) throw feedbackError;
          
          if (feedbackData) {
            setFeedback(feedbackData);
          }
        }
      } catch (error) {
        // エラーハンドリング
      }
    } catch (error) {
      // エラーハンドリング
    } finally {
      setLoading(false);
    }
  };
  
  const markContactAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      
      // 成功したら状態を更新
      setContacts(prev => 
        prev.map(contact => 
          contact.id === id 
            ? { ...contact, is_read: true } 
            : contact
        )
      );
    } catch (error) {
      // エラーハンドリング
    }
  };
  
  const markFeedbackAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      
      // 成功したら状態を更新
      setFeedback(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, is_read: true } 
            : item
        )
      );
    } catch (error) {
      // エラーハンドリング
    }
  };
  
  const deleteFeedback = async (id: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 成功したら状態を更新
      setFeedback(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      // エラーハンドリング
    }
  };
  
  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ja
      });
    } catch (e) {
      return dateString;
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">データ読込中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">管理者ページ</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="contacts">
            お問い合わせ
            {contacts.filter(c => !c.is_read).length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {contacts.filter(c => !c.is_read).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="feedback">
            フィードバック
            {feedback.filter(f => !f.is_read).length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {feedback.filter(f => !f.is_read).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="contacts">
          {contacts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名前</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">件名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メッセージ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className={contact.is_read ? 'bg-white' : 'bg-blue-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          contact.is_read ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {contact.is_read ? '既読' : '未読'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{contact.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{contact.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{contact.subject}</td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate">{contact.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(contact.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!contact.is_read && (
                          <button
                            onClick={() => markContactAsRead(contact.id)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            既読にする
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-10">
              <p className="text-gray-500">お問い合わせはありません</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="feedback">
          {feedback.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種類</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内容</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {feedback.map((item) => (
                    <tr key={item.id} className={item.is_read ? 'bg-white' : 'bg-blue-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.is_read ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.is_read ? '既読' : '未読'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.feedback_type === 'bug' ? 'bg-red-100 text-red-800' :
                          item.feedback_type === 'feature' ? 'bg-green-100 text-green-800' :
                          item.feedback_type === 'improvement' ? 'bg-yellow-100 text-yellow-800' :
                          item.feedback_type === 'question' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {
                            item.feedback_type === 'bug' ? 'バグ報告' :
                            item.feedback_type === 'feature' ? '機能リクエスト' :
                            item.feedback_type === 'improvement' ? '改善提案' :
                            item.feedback_type === 'question' ? '質問' :
                            'その他'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.email || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate">{item.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <FeedbackDropdown 
                          feedbackId={item.id}
                          isRead={item.is_read}
                          email={item.email}
                          onMarkAsRead={markFeedbackAsRead}
                          onDelete={deleteFeedback}
                          onRefreshData={fetchData}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-10">
              <p className="text-gray-500">フィードバックはありません</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 