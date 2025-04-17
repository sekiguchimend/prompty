import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, Send, Loader2, ArrowLeft } from 'lucide-react';
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useRouter } from 'next/router';
// まとめてインポート
import {
  ProjectSettingsForm,
  PromptGuideDialog,
  PromptForm,
  PromptHistory,
  AI_MODELS,
  PROMPT_EXAMPLES,
  type ProjectFormValues,
  type PromptFormValues,
  type Prompt
} from '../components/create-post';
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "../lib/auth-context";
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

const CreatePost = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user, session } = useAuth(); // 認証情報の取得
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promptNumber, setPromptNumber] = useState(1);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [projectSettings, setProjectSettings] = useState<ProjectFormValues>({
    projectTitle: "新しいプロンプトプロジェクト",
    aiModel: "claude-3-5-sonnet",
    customAiModel: "",
    pricingType: "free",
    price: 0,
    projectDescription: "",
    thumbnail: "",
    projectUrl: "",
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [isAnonymousSubmission, setIsAnonymousSubmission] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  // Supabase クライアントの初期化
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  useEffect(() => {
    // ユーザーIDをステートに設定
    if (user) {
      setAuthorId(user.id);
      setIsAnonymousSubmission(false);
    } else {
      // 匿名ユーザーの場合は一時的なIDを生成
      setAuthorId(`anon-${uuidv4()}`);
      setIsAnonymousSubmission(true);
    }
  }, [user]);

  // プロジェクト設定の保存
  const handleProjectSave = (data: ProjectFormValues) => {
    console.log("Project settings updated:", data);
    setProjectSettings(data);
    
    // サムネイル画像があれば保存
    if (data.thumbnail && data.thumbnail.startsWith('data:')) {
      handleThumbnailUpload(data.thumbnail);
    }
    
    toast({
      title: "設定保存完了",
      description: "プロジェクト設定が保存されました",
      variant: "default",
    });
  };
  
  // サムネイル画像をBase64からFileオブジェクトに変換
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    try {
      const arr = dataurl.split(',');
      if (arr.length < 2) {
        console.error('無効なデータURL形式:', dataurl.substring(0, 50) + '...');
        throw new Error('無効なデータURL形式');
      }
      
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new File([u8arr], filename, { type: mime });
    } catch (error) {
      console.error('dataURLtoFile 変換エラー:', error);
      throw new Error('画像データの処理中にエラーが発生しました');
    }
  };
  
  // サムネイル画像のアップロード処理
  const handleThumbnailUpload = async (thumbnailDataUrl: string) => {
    try {
      if (!thumbnailDataUrl || thumbnailDataUrl.length < 100) {
        console.warn('無効なサムネイルデータ:', thumbnailDataUrl);
        return;
      }
      
      console.log('サムネイルデータ (最初の100文字):', thumbnailDataUrl.substring(0, 100));
      
      // 画像タイプを取得
      const mimeMatch = thumbnailDataUrl.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const fileExt = mimeType.split('/')[1] || 'png';
      
      // Base64データURLをFileオブジェクトに変換
      const fileName = `thumbnail-${Date.now()}.${fileExt}`;
      const file = dataURLtoFile(thumbnailDataUrl, fileName);
      
      console.log('サムネイルファイル情報:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      setThumbnailFile(file);
      console.log('サムネイル画像の準備完了:', file.name);
    } catch (error) {
      console.error('サムネイル画像の準備エラー:', error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "サムネイル画像の準備中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };
  
  // ストレージにサムネイル画像をアップロード
  const uploadThumbnailToStorage = async (): Promise<string | null> => {
    if (!thumbnailFile) return null;
    
    try {
      console.log('サムネイルアップロード開始...');
      
      // バケット名
      const bucketName = 'prompt-thumbnails';
      
      // ファイル情報設定
      const fileExt = thumbnailFile.name.split('.').pop();
      const fileName = `thumbnail-${Date.now()}`;
      const filePath = `${fileName}.${fileExt}`;
      
      console.log(`ファイル '${filePath}' をアップロード準備中...`);
      
      // 必ずサーバー側でバケットを作成・設定
      try {
        const bucketResponse = await fetch('/api/create-bucket', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bucketName: bucketName,
          }),
        });
        
        if (!bucketResponse.ok) {
          console.error('バケット作成APIエラー');
          throw new Error('バケット作成に失敗しました');
        }
        
        console.log('バケット作成リクエスト完了');
      } catch (bucketError) {
        console.error('バケット作成リクエストエラー:', bucketError);
        throw new Error('バケット設定中にエラーが発生しました');
      }
      
      // ファイルアップロード
      console.log(`ファイル '${filePath}' をアップロード中...`);
      
      // アップロード前のファイル情報ログ
      console.log('アップロードファイル情報:', {
        name: thumbnailFile.name,
        type: thumbnailFile.type,
        size: thumbnailFile.size
      });
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, thumbnailFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: thumbnailFile.type // ContentTypeを明示的に指定
        });
      
      if (error) {
        console.error('アップロードエラー:', error);
        throw error;
      }
      
      console.log('アップロード成功:', data);
      
      // 公開URLを取得
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      // 処理が成功したことを確認
      if (!urlData || !urlData.publicUrl) {
        console.error('公開URL取得エラー:', urlData);
        throw new Error('公開URLの取得に失敗しました');
      }
      
      console.log('公開URL:', urlData.publicUrl);
      
      // アップロードしたサムネイルへの正しいURLを返す
      return urlData.publicUrl;
    } catch (error) {
      console.error('サムネイルのアップロードエラー:', error);
      toast({
        title: "サムネイルエラー",
        description: "画像のアップロードに失敗しました。別の画像を試すか、管理者に連絡してください。",
        variant: "destructive",
      });
      return null;
    }
  };

  // プロンプトの追加
  const handlePromptSubmit = (data: PromptFormValues) => {
    console.log("Prompt submitted:", data);
    
    // 新しいプロンプトを追加
    const newPrompt: Prompt = {
      id: data.promptNumber,
      title: data.title,
      content: data.content,
      createdAt: new Date()
    };
    
    setPrompts([...prompts, newPrompt]);
    
    // 次のプロンプト番号を設定
    setPromptNumber(data.promptNumber + 1);
    
    // 成功メッセージ
    toast({
      title: "プロンプト追加",
      description: `プロンプト #${data.promptNumber} が追加されました`,
      variant: "default",
    });
  };

  // 既存プロンプトの編集
  const handleEditPrompt = (prompt: Prompt) => {
    // 編集は新しいプロンプトとして追加する形で実装
    setPromptNumber(prompt.id);
    toast({
      title: "編集モード",
      description: `プロンプト #${prompt.id} を編集モードにしました`,
      variant: "default",
    });
  };

  // プロンプト例の適用
  const applyPromptExample = (example: typeof PROMPT_EXAMPLES[0]) => {
    // プロンプトフォームは子コンポーネントで管理するため、ここでは何もしない
    // 実際の処理はPromptFormコンポーネントに委譲
    toast({
      title: "例の適用",
      description: "選択したプロンプト例を適用しました",
      variant: "default",
    });
  };

  // APIとの通信関数
  const saveProject = async (promptData: any) => {
    try {
      // リクエストヘッダーの設定
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // 認証情報が存在する場合は追加
      if (user && session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      // APIリクエストの実行
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers,
        body: JSON.stringify(promptData),
      });
      
      // レスポンスのパース
      const result = await response.json();
      
      // エラーハンドリング
      if (!response.ok) {
        // APIから返されたエラーコードに基づいたハンドリング
        if (result.code === 'title_length') {
          throw new Error('タイトルは5文字以上である必要があります');
        } else if (result.code === 'content_length') {
          throw new Error('コンテンツは10文字以上である必要があります');
        } else if (result.code === 'permission_denied') {
          throw new Error('この投稿を行う権限がありません。ログイン状態を確認してください。');
        } else if (result.code === 'invalid_api_key') {
          throw new Error('サーバー設定エラー: API キーが無効です。管理者にお問い合わせください。');
        } else {
          throw new Error(result.error || '投稿中にエラーが発生しました');
        }
      }
      
      return result;
    } catch (error) {
      console.error('投稿エラー:', error);
      throw error;
    }
  };

  // プロジェクト全体を投稿
  const submitProject = async () => {
    if (prompts.length === 0) {
      toast({
        title: "エラー",
        description: "少なくとも1つのプロンプトを追加してください",
        variant: "destructive",
      });
      return;
    }
    
    // author_idがnullの場合は一時的なIDを生成
    if (!authorId) {
      setAuthorId(`anon-${uuidv4()}`);
    }
    
    setIsSubmitting(true);
    
    try {
      // サムネイル画像のアップロード
      let thumbnailUrl = null;
      if (thumbnailFile) {
        toast({
          title: "処理中",
          description: "サムネイル画像をアップロード中...",
          variant: "default",
        });
        thumbnailUrl = await uploadThumbnailToStorage();
      }
      
      console.log('サムネイルURL:', thumbnailUrl);
      
      // リクエストヘッダーの設定
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // 認証情報が存在する場合は追加
      if (user && session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    
      toast({
        title: "処理中",
        description: "プロンプトデータを送信中...",
        variant: "default",
      });
      
      // まず、プロンプトプロジェクトのメインデータを保存
      const requestBody = {
        title: projectSettings.projectTitle || "無題のプロンプト",
        description: projectSettings.projectDescription || "",
        content: prompts[0].content, // 最初のプロンプトの内容をメインコンテンツとして使用
        thumbnail_url: thumbnailUrl, // アップロードしたサムネイルのURL
        category_id: null, // カテゴリIDがあれば指定
        price: projectSettings.pricingType === "paid" ? projectSettings.price : 0,
        is_free: projectSettings.pricingType === "free",
        ai_model: projectSettings.aiModel === "custom" 
          ? projectSettings.customAiModel 
          : projectSettings.aiModel,
        author_id: authorId || `anon-${uuidv4()}` // 作者IDを追加
      };
      
      console.log('リクエストデータ:', JSON.stringify(requestBody, null, 2));
      
      const mainPromptResponse = await fetch('/api/prompts/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });
      
      console.log('レスポンスステータス:', mainPromptResponse.status);
      
      const responseText = await mainPromptResponse.text();
      console.log('レスポンステキスト:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSONパースエラー:', parseError);
        throw new Error(`サーバーからの応答の解析に失敗しました: ${responseText}`);
      }
      
      if (!mainPromptResponse.ok || !responseData.success) {
        const errorMessage = responseData.message || responseData.error || 'プロンプト保存中にエラーが発生しました';
        console.error('APIエラー:', responseData);
        throw new Error(errorMessage);
      }
      
      const promptId = responseData.data?.id || responseData.promptId;
      console.log('保存されたプロンプトID:', promptId);
      
      if (!promptId) {
        console.warn('警告: プロンプトIDが返されませんでした');
      }
      
      // 複数のプロンプトを関連付けて保存（実装方法はバックエンドに依存）
      if (prompts.length > 1) {
        // 追加のプロンプトを関連付ける処理
        // 実装方法はバックエンドAPIの設計に依存します
      }
      
      toast({
        title: "投稿成功",
        description: "プロジェクトが投稿されました",
        variant: "default",
      });
      
      router.push("/");
    } catch (error) {
      console.error("プロジェクト投稿エラー:", error);
      toast({
        title: "投稿エラー",
        description: error instanceof Error ? error.message : "サーバーエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // AIモデルのラベルを取得
  const getModelLabel = (modelValue: string) => {
    // カスタムモデルの場合はモデル名をそのまま返す
    if (modelValue === "custom") {
      return projectSettings.customAiModel || "カスタムモデル";
    }
    
    // 定義済みモデルの場合はラベルを返す
    const model = AI_MODELS.find(m => m.value === modelValue);
    return model ? model.label : modelValue;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 mt-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <button 
            onClick={() => router.back()}
            className="text-gray-500 hover:text-black flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> 戻る
          </button>
          
          <div className="flex flex-wrap gap-2">
            <PromptGuideDialog onApplyExample={applyPromptExample} />
            
            {prompts.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setShowHistory(!showHistory)}
                className="border-gray-300 text-black text-sm"
              >
                {showHistory ? "履歴を隠す" : "履歴を表示"}
              </Button>
            )}
          </div>
        </div>
        
        {/* 認証状態表示 */}
        {isAnonymousSubmission && (
          <div className="w-full max-w-3xl mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">
              現在ログインしていません。プロンプトは「匿名」として投稿されます。
              自分の名前で投稿したい場合は、<a href="/login" className="underline text-blue-600">ログイン</a>してください。
            </p>
          </div>
        )}
        
        {/* プロジェクト設定フォーム */}
        <ProjectSettingsForm
          onSave={handleProjectSave}
          defaultValues={projectSettings}
        />
        
        {/* プロンプト履歴 */}
        {showHistory && prompts.length > 0 && (
          <PromptHistory
            prompts={prompts}
            onEditPrompt={handleEditPrompt}
          />
        )}
        
        {/* プロンプト入力フォーム */}
        <PromptForm
          onSubmit={handlePromptSubmit}
          initialPromptNumber={promptNumber}
          aiModel={projectSettings.aiModel}
          modelLabel={getModelLabel(projectSettings.aiModel)}
        />
        
        {/* プロジェクト投稿ボタン */}
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={submitProject}
            className="bg-black hover:bg-gray-800 text-white"
            disabled={prompts.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                送信中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                プロジェクトを投稿
              </>
            )}
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreatePost;