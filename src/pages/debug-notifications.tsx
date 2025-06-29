import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Loader2, RefreshCw, Send, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface DebugData {
  fcmTokens: {
    total: number;
    tokens: any[];
    error: string | null;
  };
  recentActivity: {
    follows: {
      count: number;
      recent: any[];
      error: string | null;
    };
    likes: {
      count: number;
      recent: any[];
      error: string | null;
    };
  };
  triggers: {
    data: any[];
    error: string | null;
  };
  notificationQueue: {
    total: number;
    unprocessed: number;
    recent: any[];
    error: string | null;
  };
  edgeFunctions: {
    autoNotification: {
      status: number | string;
      accessible: boolean;
      error: string | null;
    };
  };
  firebaseConfig: {
    hasProjectId: boolean;
    hasClientEmail: boolean;
    hasPrivateKey: boolean;
    hasVapidKey: boolean;
    vapidKeyPreview: string;
  };
  testNotification?: {
    status: number | string;
    response: string;
    sent: boolean;
    error?: string;
  };
}

const NotificationDebugPage: React.FC = () => {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  // デバッグ情報を取得
  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/notification-debug');
      const result = await response.json();
      
      if (result.success) {
        setDebugData(result.data);
      } else {
        console.error('デバッグ情報の取得に失敗:', result.error);
      }
    } catch (error) {
      console.error('デバッグ情報の取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // テスト通知を送信
  const sendTestNotification = async () => {
    setTestLoading(true);
    try {
      const response = await fetch('/api/debug/notification-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testNotification: true
        })
      });
      const result = await response.json();
      
      if (result.success) {
        setDebugData(result.data);
      }
    } catch (error) {
      console.error('テスト通知送信エラー:', error);
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const getStatusIcon = (status: boolean | null, error?: string | null) => {
    if (error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (status) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (status: boolean | null, error?: string | null) => {
    if (error) return <Badge variant="destructive">エラー</Badge>;
    if (status) return <Badge variant="default" className="bg-green-100 text-green-800">正常</Badge>;
    return <Badge variant="destructive">異常</Badge>;
  };

  if (!debugData && loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">デバッグ情報を取得中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🔧 通知システムデバッグ</h1>
        <div className="flex gap-2">
          <Button 
            onClick={fetchDebugInfo} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            更新
          </Button>
          {debugData && debugData.fcmTokens.total > 0 && (
            <Button 
              onClick={sendTestNotification} 
              disabled={testLoading}
              variant="outline"
              size="sm"
            >
              {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              テスト通知
            </Button>
          )}
        </div>
      </div>

      {debugData && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Firebase設定</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(debugData.firebaseConfig, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>FCMトークン</CardTitle>
              <CardDescription>
                アクティブなデバイス: {debugData.fcmTokens?.total || 0}台
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(debugData.fcmTokens, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edge Functions</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(debugData.edgeFunctions, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近のアクティビティ</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(debugData.recentActivity, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 診断結果のサマリー */}
      {debugData && (
        <Card>
          <CardHeader>
            <CardTitle>🏥 診断結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Firebase設定チェック */}
              {!debugData.firebaseConfig.hasVapidKey && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>VAPID Keyが設定されていません。</strong><br />
                    FirebaseコンソールからVAPID Keyを取得して環境変数に設定してください。
                  </AlertDescription>
                </Alert>
              )}

              {/* FCMトークンチェック */}
              {debugData.fcmTokens.total === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>FCMトークンが登録されていません。</strong><br />
                    通知設定画面で「通知を有効にする」ボタンを押してください。
                  </AlertDescription>
                </Alert>
              )}

              {/* Edge Function チェック */}
              {!debugData.edgeFunctions.autoNotification.accessible && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>auto-notification Edge Functionにアクセスできません。</strong><br />
                    Edge Functionがデプロイされているか確認してください。
                  </AlertDescription>
                </Alert>
              )}

              {/* 全て正常な場合 */}
              {debugData.firebaseConfig.hasVapidKey && 
               debugData.fcmTokens.total > 0 && 
               debugData.edgeFunctions.autoNotification.accessible && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>通知システムは正常に設定されています！</strong><br />
                    フォローやいいねをしたときに通知が送信されるはずです。
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationDebugPage; 