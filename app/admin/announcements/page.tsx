"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../src/lib/auth-context';
import { supabase } from '../../../src/lib/supabaseClient';

// アナウンスメントタイプの定義
interface Announcement {
  id: string;
  title: string;
  content: string;
  icon: string | null;
  icon_color: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

// 管理者メールアドレスリスト
const ADMIN_EMAILS = [
  'queue@queue-tech.jp'
];

// 管理者かどうかをチェックする関数
const isAdminUser = (email: string | undefined): boolean => {
  if (!email) return false;
  
  console.log('ANNOUNCEMENTS - ADMIN CHECK - Email:', email);
  
  // 特定のメールアドレスリストに含まれるかチェック
  // 大文字小文字を区別せずに比較
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedAdminEmails = ADMIN_EMAILS.map(e => e.toLowerCase().trim());
  
  const isAdmin = normalizedAdminEmails.includes(normalizedEmail);
  console.log('ANNOUNCEMENTS - ADMIN CHECK - Result:', isAdmin);
  
  return isAdmin;
};

export default function AnnouncementsAdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  
  // 新規・編集用のフォームデータ
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    icon: 'new_feature',
    icon_color: 'red',
    start_date: new Date().toISOString(),
    end_date: null,
    is_active: true
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 管理者かどうかをチェック
  useEffect(() => {
    const checkAdmin = async () => {
      if (!isLoading) {
        console.log('AnnouncementsPage - ユーザー情報:', user?.email);
        
        if (!user || !isAdminUser(user.email)) {
          console.log('AnnouncementsPage - 権限なし: トップページへリダイレクト');
          router.push('/');
          return;
        }
        
        console.log('AnnouncementsPage - 管理者確認OK: データ取得開始');
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
      
      // アナウンスメントデータを取得
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error('AnnouncementsPage - データ取得エラー:', error);
        throw error;
      }
      
      if (data) {
        console.log('AnnouncementsPage - データ取得成功:', data.length, '件');
        setAnnouncements(data as unknown as Announcement[]);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // フォーム入力の処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'end_date' && value === '') {
      setFormData(prev => ({ ...prev, [name]: null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 編集モードを開始
  const startEdit = (announcement: Announcement) => {
    setFormData({
      ...announcement,
      start_date: announcement.start_date.split('T')[0],
      end_date: announcement.end_date ? announcement.end_date.split('T')[0] : null
    });
    setSelectedAnnouncement(announcement);
    setIsEditing(true);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 新規作成モードを開始
  const startCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      title: '',
      content: '',
      icon: 'new_feature',
      icon_color: 'red',
      start_date: today,
      end_date: null,
      is_active: true
    });
    setSelectedAnnouncement(null);
    setIsEditing(true);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 編集モードをキャンセル
  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedAnnouncement(null);
    setErrorMessage('');
  };

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      if (!formData.title || !formData.content) {
        setErrorMessage('タイトルと内容は必須です');
        setIsSaving(false);
        return;
      }
      
      if (selectedAnnouncement) {
        // 既存のお知らせを更新
        const { error } = await supabase
          .from('announcements')
          .update({
            title: formData.title,
            content: formData.content,
            icon: formData.icon,
            icon_color: formData.icon_color,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_active: formData.is_active
          })
          .eq('id', selectedAnnouncement.id);
          
        if (error) throw error;
        setSuccessMessage('お知らせを更新しました');
      } else {
        // 新規お知らせを作成
        const { error } = await supabase
          .from('announcements')
          .insert([{
            title: formData.title,
            content: formData.content,
            icon: formData.icon,
            icon_color: formData.icon_color,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_active: formData.is_active
          }]);
          
        if (error) throw error;
        setSuccessMessage('新しいお知らせを作成しました');
      }
      
      // データを再取得
      await fetchData();
      setIsEditing(false);
    } catch (error: any) {
      console.error('保存エラー:', error);
      setErrorMessage(`エラーが発生しました: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // お知らせの削除
  const handleDelete = async (id: string) => {
    if (!confirm('このお知らせを削除してもよろしいですか？')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSuccessMessage('お知らせを削除しました');
      await fetchData();
    } catch (error: any) {
      console.error('削除エラー:', error);
      setErrorMessage(`削除中にエラーが発生しました: ${error.message}`);
    }
  };

  // アイコンタイプの日本語名を取得
  const getIconTypeName = (type: string | null): string => {
    const types: Record<string, string> = {
      'new_feature': '新機能',
      'maintenance': 'メンテナンス',
      'campaign': 'キャンペーン',
      'info': 'お知らせ'
    };
    return type ? types[type] || type : '指定なし';
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
      <h1 className="text-2xl font-bold mb-6">お知らせ管理</h1>
      <div className="bg-green-100 p-3 mb-6 rounded">
        <p>ログイン中のアカウント: <strong>{user.email}</strong></p>
      </div>
      
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p>{errorMessage}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
          <p>{successMessage}</p>
        </div>
      )}
      
      {isEditing ? (
        // 編集/新規作成フォーム
        <div className="bg-white shadow-sm rounded p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {selectedAnnouncement ? 'お知らせを編集' : '新規お知らせ作成'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">タイトル <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">内容 <span className="text-red-500">*</span></label>
              <textarea
                name="content"
                value={formData.content || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                rows={3}
                required
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">アイコンタイプ</label>
                <select
                  name="icon"
                  value={formData.icon || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="new_feature">新機能</option>
                  <option value="maintenance">メンテナンス</option>
                  <option value="campaign">キャンペーン</option>
                  <option value="info">お知らせ</option>
                </select>
              </div>
              
              <div>
                <label className="block mb-1 font-medium">アイコン色</label>
                <select
                  name="icon_color"
                  value={formData.icon_color || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="red">赤</option>
                  <option value="blue">青</option>
                  <option value="green">緑</option>
                  <option value="purple">紫</option>
                  <option value="gray">グレー</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">開始日 <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date ? formData.start_date.toString().split('T')[0] : ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1 font-medium">終了日（任意）</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date ? formData.end_date.toString().split('T')[0] : ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active || false}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="is_active">アクティブ（表示する）</label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // お知らせ一覧表示
        <div className="mb-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={startCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              新規お知らせ作成
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-10">読み込み中...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-10 bg-white shadow-sm rounded">
              お知らせはありません
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded overflow-hidden">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">タイトル</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">タイプ</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">開始日</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">終了日</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">状態</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {announcements.map((announcement) => (
                    <tr key={announcement.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm">{announcement.title}</td>
                      <td className="px-4 py-4 text-sm">{getIconTypeName(announcement.icon)}</td>
                      <td className="px-4 py-4 text-sm">
                        {new Date(announcement.start_date).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {announcement.end_date 
                          ? new Date(announcement.end_date).toLocaleDateString('ja-JP')
                          : '無期限'}
                      </td>
                      <td className="px-4 py-4 text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          announcement.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {announcement.is_active ? 'アクティブ' : '非アクティブ'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-right">
                        <button
                          onClick={() => startEdit(announcement)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">使用方法</h2>
        <div className="bg-white p-4 shadow-sm rounded">
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>「新規お知らせ作成」ボタンからお知らせを作成できます</li>
            <li>アイコンタイプは「新機能」「メンテナンス」「キャンペーン」「お知らせ」から選べます</li>
            <li>終了日を設定すると、その日付を過ぎると自動的に表示されなくなります</li>
            <li>アクティブ状態を「オフ」にすると、期間内でも非表示になります</li>
            <li>作成したお知らせはユーザーのダッシュボードページに表示されます</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 