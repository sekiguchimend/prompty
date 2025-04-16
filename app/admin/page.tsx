"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/lib/auth-context';
import { supabase } from '../../src/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs';
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
}

// 管理者メールアドレスとドメインを定義
const ADMIN_EMAILS = [
  'queue@queuetech.jp', 
  'admin@queuetech.jp', 
  'queue@queue-tech.jp',
  'admin@example.com',
  'taniguchi.kouhei@gmail.com'
];

// 管理者かどうかをチェックする関数
const isAdminUser = (email: string | undefined): boolean => {
  if (!email) return false;
  console.log('AdminPage - 管理者チェック - メールアドレス:', email);
  // 特定のメールアドレスリストに含まれるかチェック
  if (ADMIN_EMAILS.includes(email)) {
    console.log('AdminPage - 管理者チェック - リストに含まれる');
    return true;
  }
  // 特定のドメインを持つメールアドレスかチェック
  const isDomainMatch = email.endsWith('@queuetech.jp') || email.endsWith('@queue-tech.jp');
  console.log('AdminPage - 管理者チェック - ドメイン一致:', isDomainMatch);
  return isDomainMatch;
};

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('contact');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // 管理者かどうかをチェック
  useEffect(() => {
    const checkAdmin = async () => {
      if (!isLoading) {
        console.log('AdminPage - ユーザー情報:', user?.email);
        // Get the current JWT token to verify the email used in RLS
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AdminPage - JWT Email:', session?.user?.email);
        console.log('AdminPage - 管理者チェック結果:', isAdminUser(user?.email));
        
        if (!user || !isAdminUser(user.email)) {
          console.log('AdminPage - 権限なし: トップページへリダイレクト');
          router.push('/');
          return;
        }
        
        console.log('AdminPage - 管理者確認OK: データ取得開始');
        setAdminCheckComplete(true);
        await fetchData();
      }
    };
    
    checkAdmin();
  }, [user, isLoading, router]);

  // データを取得
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 問い合わせデータを取得
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (contactError) {
        console.error('AdminPage - 問い合わせデータ取得エラー:', contactError);
        throw contactError;
      }
      
      if (contactData) {
        console.log('AdminPage - 問い合わせデータ取得成功:', contactData.length, '件');
        setContacts(contactData as Contact[]);
      }
      
      console.log('AdminPage - フィードバックデータ取得開始');
      // フィードバックデータを取得
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (feedbackError) {
        console.error('AdminPage - フィードバックデータ取得エラー:', feedbackError);
        console.log('AdminPage - RPCを使用してフィードバックデータ取得を試みます');
        
        // RPCを使用して管理者権限でフィードバックを取得
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_feedback');
        
        if (rpcError) {
          console.error('AdminPage - RPCによるフィードバックデータ取得エラー:', rpcError);
          throw rpcError;
        }
        
        if (rpcData) {
          console.log('AdminPage - RPCによるフィードバックデータ取得成功:', rpcData.length, '件');
          console.log('AdminPage - フィードバックデータ内容:', JSON.stringify(rpcData, null, 2));
          setFeedbacks(rpcData as Feedback[]);
        }
      } else {
        if (feedbackData) {
          console.log('AdminPage - フィードバックデータ取得成功:', feedbackData.length, '件');
          console.log('AdminPage - フィードバックデータ内容:', JSON.stringify(feedbackData, null, 2));
          setFeedbacks(feedbackData as Feedback[]);
        }
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 問い合わせを既読にする
  const markContactAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      
      // 既読状態を更新
      setContacts(contacts.map(contact => 
        contact.id === id ? { ...contact, is_read: true } : contact
      ));
      
      if (selectedContact?.id === id) {
        setSelectedContact({ ...selectedContact, is_read: true });
      }
    } catch (error) {
      console.error('既読の設定に失敗しました:', error);
    }
  };

  // フィードバックを既読にする
  const markFeedbackAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      
      // 既読状態を更新
      setFeedbacks(feedbacks.map(feedback => 
        feedback.id === id ? { ...feedback, is_read: true } : feedback
      ));
      
      if (selectedFeedback?.id === id) {
        setSelectedFeedback({ ...selectedFeedback, is_read: true });
      }
    } catch (error) {
      console.error('既読の設定に失敗しました:', error);
    }
  };

  // フィードバックを削除する
  const deleteFeedback = async (id: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 削除したフィードバックをリストから削除
      setFeedbacks(feedbacks.filter(feedback => feedback.id !== id));
      
      // 選択中のフィードバックが削除された場合、選択解除
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(null);
      }
      
      console.log('フィードバックを削除しました:', id);
    } catch (error) {
      console.error('削除に失敗しました:', error);
    }
  };

  // フィードバックタイプを日本語に変換する
  const getFeedbackTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      'bug': 'バグ報告',
      'feature': '機能リクエスト',
      'improvement': '改善提案',
      'question': '質問',
      'other': 'その他'
    };
    return types[type] || type;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">読み込み中...</div>;
  }

  if (!user || !isAdminUser(user.email)) {
    return <div className="flex justify-center items-center h-screen">
      管理者権限がありません。ログイン中のアカウント: {user?.email || 'なし'}
    </div>;
  }

  if (!adminCheckComplete) {
    return <div className="flex justify-center items-center h-screen">管理者確認中...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">管理ページ</h1>
      <div className="bg-green-100 p-3 mb-6 rounded flex justify-between items-center">
        <p>ログイン中のアカウント: <strong>{user.email}</strong></p>
        <button 
          onClick={fetchData}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          データを更新
        </button>
      </div>
      
      <Tabs defaultValue="contact" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="contact" className="flex-1">
            お問い合わせ一覧
            {contacts.filter(c => !c.is_read).length > 0 && (
              <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                {contacts.filter(c => !c.is_read).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex-1">
            フィードバック一覧
            {feedbacks.filter(f => !f.is_read).length > 0 && (
              <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                {feedbacks.filter(f => !f.is_read).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex-1">
            お知らせ管理
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="contact" className="pt-2">
          {loading ? (
            <div className="text-center py-10">読み込み中...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-10">お問い合わせはありません</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-3 border-b">
                  <h2 className="font-semibold">問い合わせ一覧</h2>
                </div>
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {contacts.map((contact) => (
                    <div 
                      key={contact.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedContact?.id === contact.id ? 'bg-blue-50' : ''} ${!contact.is_read ? 'font-semibold' : ''}`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="truncate">{contact.subject}</p>
                          <p className="text-sm text-gray-500 truncate">{contact.name}</p>
                        </div>
                        {!contact.is_read && (
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(contact.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2 border rounded-lg overflow-hidden">
                {selectedContact ? (
                  <div>
                    <div className="bg-gray-100 p-3 border-b flex justify-between items-center">
                      <h2 className="font-semibold">問い合わせ詳細</h2>
                      {!selectedContact.is_read && (
                        <button
                          className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          onClick={() => markContactAsRead(selectedContact.id)}
                        >
                          既読にする
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="mb-4">
                        <h3 className="font-bold text-lg">{selectedContact.subject}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(selectedContact.created_at).toLocaleString('ja-JP')}
                        </p>
                      </div>
                      <div className="mb-4 p-3 bg-gray-50 rounded">
                        <p className="font-semibold">{selectedContact.name}</p>
                        <p className="text-sm text-gray-600">{selectedContact.email}</p>
                      </div>
                      <div className="whitespace-pre-wrap bg-white p-3 border rounded">
                        {selectedContact.message}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center text-gray-500">
                    左側のリストから問い合わせを選択してください
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="feedback" className="pt-2">
          {loading ? (
            <div className="text-center py-10">読み込み中...</div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-10">フィードバックはありません</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-3 border-b">
                  <h2 className="font-semibold">フィードバック一覧</h2>
                </div>
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {feedbacks.map((feedback) => (
                    <div 
                      key={feedback.id}
                      className={`p-3 hover:bg-gray-50 ${selectedFeedback?.id === feedback.id ? 'bg-blue-50' : ''} ${!feedback.is_read ? 'font-semibold' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div 
                          className="flex-1 cursor-pointer" 
                          onClick={() => setSelectedFeedback(feedback)}
                        >
                          <p className="truncate">
                            <span className="inline-block px-2 py-0.5 bg-gray-200 rounded text-xs mr-2">
                              {getFeedbackTypeLabel(feedback.feedback_type)}
                            </span>
                            {feedback.message.substring(0, 30)}
                            {feedback.message.length > 30 ? '...' : ''}
                          </p>
                          {feedback.email && (
                            <p className="text-sm text-gray-500 truncate">{feedback.email}</p>
                          )}
                        </div>
                        <div className="flex items-center">
                          {!feedback.is_read && (
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          )}
                          <FeedbackDropdown 
                            feedbackId={feedback.id}
                            isRead={feedback.is_read}
                            email={feedback.email}
                            onMarkAsRead={markFeedbackAsRead}
                            onDelete={deleteFeedback}
                            onRefreshData={fetchData}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(feedback.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2 border rounded-lg overflow-hidden">
                {selectedFeedback ? (
                  <div>
                    <div className="bg-gray-100 p-3 border-b flex justify-between items-center">
                      <h2 className="font-semibold">フィードバック詳細</h2>
                      <div className="flex items-center">
                        {!selectedFeedback.is_read && (
                          <button
                            className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                            onClick={() => markFeedbackAsRead(selectedFeedback.id)}
                          >
                            既読にする
                          </button>
                        )}
                        <FeedbackDropdown 
                          feedbackId={selectedFeedback.id}
                          isRead={selectedFeedback.is_read}
                          email={selectedFeedback.email}
                          onMarkAsRead={markFeedbackAsRead}
                          onDelete={deleteFeedback}
                          onRefreshData={fetchData}
                        />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-4">
                        <span className="inline-block px-2 py-1 bg-gray-200 rounded text-sm font-medium">
                          {getFeedbackTypeLabel(selectedFeedback.feedback_type)}
                        </span>
                        <p className="text-sm text-gray-500 mt-2">
                          {new Date(selectedFeedback.created_at).toLocaleString('ja-JP')}
                        </p>
                      </div>
                      {selectedFeedback.email && (
                        <div className="mb-4 p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-600">{selectedFeedback.email}</p>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap bg-white p-3 border rounded">
                        {selectedFeedback.message}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center text-gray-500">
                    左側のリストからフィードバックを選択してください
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="announcements" className="pt-2">
          <div className="text-center py-6">
            <h2 className="text-xl font-bold mb-4">お知らせ管理</h2>
            <p className="mb-6">お知らせの作成、編集、削除を行うには下記のリンクをクリックしてください。</p>
            <a 
              href="/admin/announcements" 
              className="bg-blue-600 text-white px-6 py-3 rounded-md inline-block hover:bg-blue-700 transition-colors"
            >
              お知らせ管理画面へ
            </a>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 