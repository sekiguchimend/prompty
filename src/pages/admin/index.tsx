import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { checkCurrentUserAdmin } from '../../lib/admin-auth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../components/ui/use-toast';
import { AlertTriangle, Bell, FileText, Users, Settings, Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// 型定義
interface Report {
  id: string;
  target_id: string;
  target_type: string;
  prompt_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  reporter?: {
    display_name: string;
    username: string;
  };
  prompt?: {
    title: string;
  };
}

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
  updated_at: string;
}

interface NewAnnouncement {
  title: string;
  content: string;
  icon: string;
  icon_color: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface Feedback {
  id: string;
  feedback_type: string;
  email: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  
  // 新しいお知らせフォームの状態
  const [newAnnouncement, setNewAnnouncement] = useState<NewAnnouncement>({
    title: '',
    content: '',
    icon: 'info',
    icon_color: 'blue',
    start_date: new Date().toISOString().slice(0, 16),
    end_date: '',
    is_active: true
  });

  // お問い合わせ管理用の状態
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // フィードバック管理用の状態
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);

  // 管理者権限チェック
  useEffect(() => {
    const checkAuth = async () => {
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setIsAdmin(false);
          setIsLoading(false);
          router.push('/');
          return;
        }
        
        const adminStatus = await checkCurrentUserAdmin();
        
        setIsAdmin(adminStatus);
        setIsLoading(false);
        
        if (!adminStatus) {
          router.push('/');
        } else {
        }
      } catch (error) {
        console.error('権限チェック中にエラー:', error);
        setIsAdmin(false);
        setIsLoading(false);
        router.push('/');
      }
      
    };

    checkAuth();
  }, [router]);

  // レポート一覧を取得
  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      
      // 1. まずテーブルの存在確認
      const { data: tableCheck, error: tableError } = await supabase
        .from('reports')
        .select('count', { count: 'exact', head: true });
      
      
      if (tableError) {
        console.error('テーブルアクセスエラー:', tableError);
        setReports([]);
        toast({
          title: 'テーブルアクセスエラー',
          description: `reportsテーブルにアクセスできません: ${tableError.message}`,
          variant: 'destructive'
        });
        return;
      }

      // 2. 権限確認のため、最もシンプルなクエリを実行
      const { data: simpleData, error: simpleError } = await supabase
        .from('reports')
        .select('id')
        .limit(1);
      
      
      if (simpleError) {
        console.error('権限エラー:', simpleError);
        setReports([]);
        toast({
          title: '権限エラー',
          description: `reportsテーブルの読み取り権限がありません: ${simpleError.message}`,
          variant: 'destructive'
        });
        return;
      }

      // 3. カラム構造確認のため、特定のカラムを指定してクエリ
      const { data: columnData, error: columnError } = await supabase
        .from('reports')
        .select('id, target_id, target_type, prompt_id, reporter_id, reason, details, status, created_at, updated_at')
        .limit(5);
      
      
      if (columnError) {
        console.error('カラム構造エラー:', columnError);
        
        // 個別カラムをテスト
        const testColumns = ['id', 'target_id', 'target_type', 'prompt_id', 'reporter_id', 'reason', 'details', 'status', 'created_at', 'updated_at'];
        
        for (const column of testColumns) {
          try {
            const { data, error } = await supabase
              .from('reports')
              .select(column)
              .limit(1);
          } catch (e) {
          }
        }
        
        setReports([]);
        toast({
          title: 'カラム構造エラー',
          description: `指定したカラムが存在しません: ${columnError.message}`,
          variant: 'destructive'
        });
        return;
      }

      // 4. 全データ取得
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });


      if (reportsError) {
        console.error('全データ取得エラー:', reportsError);
        setReports([]);
        toast({
          title: 'データ取得エラー',
          description: `レポートデータの取得に失敗しました: ${reportsError.message}`,
          variant: 'destructive'
        });
        return;
      }

      if (!reportsData || reportsData.length === 0) {
        setReports([]);
        return;
      }


      // まずは基本データのみで表示（関連データは後で追加）
      const basicReports = reportsData.map(report => ({
        ...report,
        reporter: {
          display_name: '読み込み中...',
          username: '読み込み中...'
        },
        prompt: {
          title: '読み込み中...'
        }
      }));

      // 基本データを先に設定
      setReports(basicReports);

      // 関連データを非同期で取得
      try {
        const reporterIds = Array.from(new Set(reportsData.map(report => report.reporter_id))).filter(id => id);
        const promptIds = Array.from(new Set(reportsData.map(report => report.prompt_id))).filter(id => id);


        // 報告者の情報を取得
        let reportersData: any[] = [];
        if (reporterIds.length > 0) {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, display_name, username')
            .in('id', reporterIds);
          
          if (error) {
            console.error('報告者データ取得エラー:', error);
          } else {
            reportersData = data || [];
          }
        }

        // プロンプトの情報を取得
        let promptsData: any[] = [];
        if (promptIds.length > 0) {
          const { data, error } = await supabase
            .from('prompts')
            .select('id, title')
            .in('id', promptIds);
          
          if (error) {
            console.error('プロンプトデータ取得エラー:', error);
          } else {
            promptsData = data || [];
          }
        }

        // データを結合して最終更新
        const enrichedReports = reportsData.map(report => ({
          ...report,
          reporter: reportersData?.find(reporter => reporter.id === report.reporter_id) || {
            display_name: '不明なユーザー',
            username: '不明'
          },
          prompt: promptsData?.find(prompt => prompt.id === report.prompt_id) || {
            title: '不明なプロンプト'
          }
        }));

        setReports(enrichedReports);
      } catch (relationError) {
        console.error('関連データ取得エラー:', relationError);
        // 関連データの取得に失敗しても基本データは表示する
      }


    } catch (error) {
      console.error('レポート取得エラー:', error);
      setReports([]);
      toast({
        title: 'エラー',
        description: 'レポートの取得に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setReportsLoading(false);
    }
  };

  // お知らせ一覧を取得
  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('お知らせ取得エラー:', error);
      toast({
        title: 'エラー',
        description: 'お知らせの取得に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  // お問い合わせ一覧を取得
  const fetchContacts = async () => {
    setContactsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('お問い合わせ取得エラー:', error);
        toast({
          title: 'エラー',
          description: 'お問い合わせの取得に失敗しました',
          variant: 'destructive'
        });
        return;
      }

      setContacts(data || []);
    } catch (error) {
      console.error('お問い合わせ取得エラー:', error);
      toast({
        title: 'エラー',
        description: 'お問い合わせの取得に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setContactsLoading(false);
    }
  };

  // フィードバック一覧を取得
  const fetchFeedbacks = async () => {
    setFeedbacksLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('フィードバック取得エラー:', error);
        toast({
          title: 'エラー',
          description: 'フィードバックの取得に失敗しました',
          variant: 'destructive'
        });
        return;
      }

      setFeedbacks(data || []);
    } catch (error) {
      console.error('フィードバック取得エラー:', error);
      toast({
        title: 'エラー',
        description: 'フィードバックの取得に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setFeedbacksLoading(false);
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    
    if (isAdmin) {
      fetchReports();
      fetchAnnouncements();
      fetchContacts();
      fetchFeedbacks();
    } else {
    }
  }, [isAdmin]);

  // レポートのステータス更新
  const updateReportStatus = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: '更新完了',
        description: `レポートのステータスを${status === 'resolved' ? '解決済み' : '却下'}に更新しました`
      });

      fetchReports();
    } catch (error) {
      console.error('レポート更新エラー:', error);
      toast({
        title: 'エラー',
        description: 'レポートの更新に失敗しました',
        variant: 'destructive'
      });
    }
  };

  // 新しいお知らせを作成
  const createAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast({
        title: 'エラー',
        description: 'タイトルと内容は必須です',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          ...newAnnouncement,
          start_date: new Date(newAnnouncement.start_date).toISOString(),
          end_date: newAnnouncement.end_date ? new Date(newAnnouncement.end_date).toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: '作成完了',
        description: 'お知らせを作成しました'
      });

      // フォームをリセット
      setNewAnnouncement({
        title: '',
        content: '',
        icon: 'info',
        icon_color: 'blue',
        start_date: new Date().toISOString().slice(0, 16),
        end_date: '',
        is_active: true
      });

      fetchAnnouncements();
    } catch (error) {
      console.error('お知らせ作成エラー:', error);
      toast({
        title: 'エラー',
        description: 'お知らせの作成に失敗しました',
        variant: 'destructive'
      });
    }
  };

  // お知らせのアクティブ状態を切り替え
  const toggleAnnouncementActive = async (announcementId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ 
          is_active: !isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', announcementId);

      if (error) throw error;

      toast({
        title: '更新完了',
        description: `お知らせを${!isActive ? 'アクティブ' : '非アクティブ'}にしました`
      });

      fetchAnnouncements();
    } catch (error) {
      console.error('お知らせ更新エラー:', error);
      toast({
        title: 'エラー',
        description: 'お知らせの更新に失敗しました',
        variant: 'destructive'
      });
    }
  };

  // お問い合わせの既読状態を切り替え
  const toggleContactRead = async (contactId: string, isRead: boolean) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ is_read: !isRead })
        .eq('id', contactId);

      if (error) {
        throw error;
      }

      toast({
        title: '更新完了',
        description: `お問い合わせを${!isRead ? '既読' : '未読'}にしました`
      });

      fetchContacts();
    } catch (error) {
      console.error('お問い合わせ更新エラー:', error);
      toast({
        title: 'エラー',
        description: 'お問い合わせの更新に失敗しました',
        variant: 'destructive'
      });
    }
  };

  // フィードバックの既読/未読切り替え
  const toggleFeedbackRead = async (feedbackId: string, isRead: boolean) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ is_read: !isRead })
        .eq('id', feedbackId);

      if (error) {
        throw error;
      }

      toast({
        title: '更新完了',
        description: `フィードバックを${!isRead ? '既読' : '未読'}にしました`
      });

      fetchFeedbacks();
    } catch (error) {
      console.error('フィードバック更新エラー:', error);
      toast({
        title: 'エラー',
        description: 'フィードバックの更新に失敗しました',
        variant: 'destructive'
      });
    }
  };

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 管理者権限がない場合
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">アクセス権限がありません</h1>
          <p className="text-gray-600 mb-4">このページにアクセスするには管理者権限が必要です。</p>
          <Button onClick={() => router.push('/')}>ホームに戻る</Button>
        </div>
      </div>
    );
  }


  return (
    <>
      <Head>
        <title>管理者ダッシュボード | Prompty</title>
        <meta name="description" content="Prompty管理者ダッシュボード" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">管理者ダッシュボード</h1>
            <p className="text-sm md:text-base text-gray-600">システムの管理と監視</p>
          </div>

          <Tabs defaultValue="reports" className="space-y-6">
            {/* モバイル対応: 縦並びレイアウト + 横スクロール対応 */}
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 h-auto p-1">
              <TabsTrigger value="reports" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-xs md:text-sm py-2 px-2">
                <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
                <span className="text-center">レポート管理</span>
              </TabsTrigger>
              <TabsTrigger value="announcements" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-xs md:text-sm py-2 px-2">
                <Bell className="h-3 w-3 md:h-4 md:w-4" />
                <span className="text-center">お知らせ管理</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-xs md:text-sm py-2 px-2">
                <Users className="h-3 w-3 md:h-4 md:w-4" />
                <span className="text-center">お問い合わせ管理</span>
              </TabsTrigger>
              <TabsTrigger value="feedbacks" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-xs md:text-sm py-2 px-2">
                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                <span className="text-center">フィードバック管理</span>
              </TabsTrigger>
            </TabsList>

            {/* レポート管理タブ */}
            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    レポート一覧
                  </CardTitle>
                  <CardDescription>
                    ユーザーから報告された問題のあるコンテンツを管理します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reportsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="text-gray-500">
                        レポートはありません
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          {reports.length}件のレポート
                        </div>
                      </div>
                      {reports.map((report) => (
                        <div key={report.id} className="border rounded-lg p-3 md:p-4 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={
                                  report.status === 'pending' ? 'default' :
                                  report.status === 'resolved' ? 'secondary' : 'destructive'
                                }>
                                  {report.status === 'pending' ? '保留中' :
                                   report.status === 'resolved' ? '解決済み' : '却下'}
                                </Badge>
                                <span className="text-xs md:text-sm text-gray-500">
                                  {report.reason === 'inappropriate' ? '不適切なコンテンツ' :
                                   report.reason === 'harassment' ? 'ハラスメント' :
                                   report.reason === 'spam' ? 'スパム' : 'その他'}
                                </span>
                              </div>
                              <div className="text-xs md:text-sm space-y-1">
                                <p><strong>プロンプト:</strong> <span className="break-words">{report.prompt?.title || '不明'}</span></p>
                                <p><strong>報告者:</strong> {report.reporter?.display_name || report.reporter?.username || '不明'}</p>
                                <p><strong>報告日:</strong> {format(new Date(report.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}</p>
                                {report.details && (
                                  <p><strong>詳細:</strong> <span className="break-words">{report.details}</span></p>
                                )}
                              </div>
                            </div>
                            {report.status === 'pending' && (
                              <div className="flex flex-col sm:flex-row gap-2 md:ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateReportStatus(report.id, 'resolved')}
                                  className="flex items-center justify-center gap-1 text-xs md:text-sm"
                                >
                                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                                  解決
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateReportStatus(report.id, 'dismissed')}
                                  className="flex items-center justify-center gap-1 text-xs md:text-sm"
                                >
                                  <XCircle className="h-3 w-3 md:h-4 md:w-4" />
                                  却下
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* お知らせ管理タブ */}
            <TabsContent value="announcements" className="space-y-6">
              {/* 新しいお知らせ作成 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    新しいお知らせを作成
                  </CardTitle>
                  <CardDescription>
                    ユーザーに表示するお知らせを作成します
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">タイトル</label>
                      <Input
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="お知らせのタイトル"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">アイコン</label>
                      <Select
                        value={newAnnouncement.icon}
                        onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, icon: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">情報</SelectItem>
                          <SelectItem value="campaign">キャンペーン</SelectItem>
                          <SelectItem value="maintenance">メンテナンス</SelectItem>
                          <SelectItem value="warning">警告</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">アイコンカラー</label>
                      <Select
                        value={newAnnouncement.icon_color}
                        onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, icon_color: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blue">青</SelectItem>
                          <SelectItem value="green">緑</SelectItem>
                          <SelectItem value="purple">紫</SelectItem>
                          <SelectItem value="red">赤</SelectItem>
                          <SelectItem value="yellow">黄</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">開始日時</label>
                      <Input
                        type="datetime-local"
                        value={newAnnouncement.start_date}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">終了日時（任意）</label>
                      <Input
                        type="datetime-local"
                        value={newAnnouncement.end_date}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">内容</label>
                    <Textarea
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="お知らせの内容"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={newAnnouncement.is_active}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="is_active" className="text-sm">すぐにアクティブにする</label>
                  </div>

                  <Button onClick={createAnnouncement} className="w-full">
                    お知らせを作成
                  </Button>
                </CardContent>
              </Card>

              {/* 既存のお知らせ一覧 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    お知らせ一覧
                  </CardTitle>
                  <CardDescription>
                    作成済みのお知らせを管理します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {announcementsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      お知らせはありません
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((announcement) => (
                        <div key={announcement.id} className="border rounded-lg p-3 md:p-4 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={announcement.is_active ? 'default' : 'secondary'}>
                                  {announcement.is_active ? 'アクティブ' : '非アクティブ'}
                                </Badge>
                                <span className="text-xs md:text-sm text-gray-500">
                                  {announcement.icon} • {announcement.icon_color}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-medium text-sm md:text-base">{announcement.title}</h3>
                                <p className="text-xs md:text-sm text-gray-600 mt-1 break-words">{announcement.content}</p>
                                <div className="text-xs text-gray-500 mt-2 space-y-1">
                                  <p>開始: {format(new Date(announcement.start_date), 'yyyy/MM/dd HH:mm', { locale: ja })}</p>
                                  {announcement.end_date && (
                                    <p>終了: {format(new Date(announcement.end_date), 'yyyy/MM/dd HH:mm', { locale: ja })}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleAnnouncementActive(announcement.id, announcement.is_active)}
                              className="text-xs md:text-sm w-full md:w-auto"
                            >
                              {announcement.is_active ? '非アクティブ化' : 'アクティブ化'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* お問い合わせ管理タブ */}
            <TabsContent value="contacts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    お問い合わせ一覧
                  </CardTitle>
                  <CardDescription>
                    受け取ったお問い合わせを管理します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contactsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      お問い合わせはありません
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="border rounded-lg p-3 md:p-4 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={contact.is_read ? 'default' : 'secondary'}>
                                  {contact.is_read ? '既読' : '未読'}
                                </Badge>
                                <span className="text-xs md:text-sm text-gray-500 break-words">
                                  {contact.name} • {contact.email}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-medium text-sm md:text-base break-words">{contact.subject}</h3>
                                <p className="text-xs md:text-sm text-gray-600 mt-1 break-words">{contact.message}</p>
                                <div className="text-xs text-gray-500 mt-2">
                                  <p>受信日: {format(new Date(contact.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}</p>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleContactRead(contact.id, contact.is_read)}
                              className="text-xs md:text-sm w-full md:w-auto"
                            >
                              {contact.is_read ? '未読にする' : '既読にする'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* フィードバック管理タブ */}
            <TabsContent value="feedbacks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    フィードバック一覧
                  </CardTitle>
                  <CardDescription>
                    受け取ったフィードバックを管理します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {feedbacksLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : feedbacks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      フィードバックはありません
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feedbacks.map((feedback) => (
                        <div key={feedback.id} className="border rounded-lg p-3 md:p-4 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={feedback.is_read ? 'default' : 'secondary'}>
                                  {feedback.is_read ? '既読' : '未読'}
                                </Badge>
                                <span className="text-xs md:text-sm text-gray-500">
                                  {feedback.feedback_type}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-medium text-sm md:text-base break-words">{feedback.message}</h3>
                                <div className="text-xs text-gray-500 mt-2 space-y-1">
                                  {feedback.email && <p className="break-words">Email: {feedback.email}</p>}
                                  <p>受信日: {format(new Date(feedback.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}</p>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleFeedbackRead(feedback.id, feedback.is_read)}
                              className="text-xs md:text-sm w-full md:w-auto"
                            >
                              {feedback.is_read ? '未読にする' : '既読にする'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard; 