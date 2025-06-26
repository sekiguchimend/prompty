import { supabase, getInstanceId } from './supabase-unified';

/**
 * 認証状態の診断ユーティリティ
 * 開発環境でのデバッグに使用
 */
export const authDiagnostics = {
  
  /**
   * 現在の認証状態を詳細に表示
   */
  async logCurrentAuthState() {
    console.log('🔍 === AUTH DIAGNOSTICS ===');
    console.log(`🔧 Unified Client Instance ID: ${getInstanceId()}`);
    
    try {
      // セッション情報を取得
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('📋 Session Data:', sessionData);
      if (sessionError) {
        console.error('❌ Session Error:', sessionError);
      }

      // ユーザー情報を取得
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('👤 User Data:', userData);
      if (userError) {
        console.error('❌ User Error:', userError);
      }

      // ローカルストレージの認証トークンを確認
      if (typeof window !== 'undefined') {
        const authToken = localStorage.getItem('supabase.auth.token');
        console.log('💾 Local Storage Auth Token:', authToken ? 'Present' : 'Not found');
        
        if (authToken) {
          try {
            const tokenData = JSON.parse(authToken);
            console.log('🔐 Token Expires At:', new Date(tokenData.expires_at * 1000));
            console.log('🔐 Token Current Time:', new Date());
            console.log('🔐 Token Valid:', new Date(tokenData.expires_at * 1000) > new Date());
          } catch (e) {
            console.error('❌ Token parsing error:', e);
          }
        }
      }

    } catch (error) {
      console.error('❌ Diagnostics Error:', error);
    }
    
    console.log('🔍 === END DIAGNOSTICS ===');
  },

  /**
   * 認証状態をリセットして再初期化
   */
  async resetAndReinitialize() {
    console.log('🔄 Resetting auth state...');
    
    try {
      await supabase.auth.signOut();
      
      // ローカルストレージをクリア
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
      }
      
      console.log('✅ Auth state reset completed');
    } catch (error) {
      console.error('❌ Reset failed:', error);
    }
  },

  /**
   * 複数のSupabaseクライアントインスタンスの存在を確認
   */
  checkForMultipleInstances() {
    console.log('🔍 Checking for multiple Supabase instances...');
    
    // Windowオブジェクトに一時的にインスタンス情報を保存
    if (typeof window !== 'undefined') {
      if (!window.__supabaseInstances) {
        window.__supabaseInstances = [];
      }
      
      const currentInstanceId = getInstanceId();
      if (currentInstanceId && !window.__supabaseInstances.includes(currentInstanceId)) {
        window.__supabaseInstances.push(currentInstanceId);
      }
      
      console.log('📊 Total Supabase instances detected:', window.__supabaseInstances.length);
      console.log('📊 Instance IDs:', window.__supabaseInstances);
      
      if (window.__supabaseInstances.length > 1) {
        console.warn('⚠️ Multiple Supabase instances detected! This may cause auth sync issues.');
      }
    }
  }
};

// グローバルに診断機能を公開（開発環境のみ）
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).authDiagnostics = authDiagnostics;
  console.log('🔧 Auth diagnostics available at window.authDiagnostics');
}

// 型定義を拡張
declare global {
  interface Window {
    __supabaseInstances?: string[];
    authDiagnostics?: typeof authDiagnostics;
  }
} 