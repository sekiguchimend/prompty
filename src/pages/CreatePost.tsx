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
import { supabase } from '../lib/supabaseClient';

const CreatePost = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user, session, isLoading } = useAuth(); // isLoadingを追加
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
  
  // 認証状態が確定するまでauthorIdをセットしない
  useEffect(() => {
    if (isLoading) return; // ローディング中は何もしない
    if (user) {
      setAuthorId(user.id);
      setIsAnonymousSubmission(false);
    } else {
      setAuthorId(`anon-${uuidv4()}`);
      setIsAnonymousSubmission(true);
    }
  }, [user, isLoading]);

  // プロジェクト設定の保存（ProjectSettingsFormから自動的に呼び出される）
  const handleProjectSave = (data: ProjectFormValues) => {
    // プロジェクト設定を更新
    setProjectSettings({
      ...data,
      thumbnail: data.thumbnail || "" 
    });
    
    // サムネイル画像があれば処理
    if (data.thumbnail && data.thumbnail.startsWith('data:')) {
      console.log('サムネイル画像を検出、Fileオブジェクトに変換します');
      // サムネイル処理を実行
      handleThumbnailChange(data.thumbnail);
    } else {
      // サムネイルがない場合は明示的にnullをセット
      setThumbnailFile(null);
    }
  };
  
  // サムネイル画像を直接処理する関数（同期的に状態を更新）
  const handleThumbnailChange = (thumbnailDataUrl: string) => {
    try {
      if (!thumbnailDataUrl || !thumbnailDataUrl.startsWith('data:')) {
        console.warn('無効なサムネイルデータ');
        setThumbnailFile(null);
        return;
      }
      
      console.log('サムネイルデータ処理開始');
      
      // 画像タイプを取得
      const mimeMatch = thumbnailDataUrl.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const fileExt = mimeType.split('/')[1] || 'png';
      
      // Base64データURLをFileオブジェクトに変換
      const fileName = `thumbnail-${Date.now()}.${fileExt}`;
      const file = dataURLtoFile(thumbnailDataUrl, fileName);
      
      console.log('サムネイルファイル作成完了:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // 状態を直接更新
      setThumbnailFile(file);
      console.log('thumbnailFileを更新しました');
      
    } catch (error) {
      console.error('サムネイル処理エラー:', error);
      setThumbnailFile(null);
    }
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
      
      console.log('dataURLtoFile 変換成功:', {
        filename,
        mime,
        contentLength: bstr.length
      });
      
      return new File([u8arr], filename, { type: mime });
    } catch (error) {
      console.error('dataURLtoFile 変換エラー:', error);
      throw new Error('画像データの処理中にエラーが発生しました');
    }
  };
  
  // ストレージにサムネイル画像をアップロード
  const uploadThumbnailToStorage = async (file: File): Promise<string | null> => {
    if (!file) {
      console.error('サムネイルアップロード: ファイルがnullです');
      return null;
    }
    try {
      console.log('サムネイルアップロード開始...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      // バケット名
      const bucketName = 'prompt-thumbnails';
      // ファイル情報設定
      const fileExt = file.name.split('.').pop() || 'png';
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
        
        const bucketData = await bucketResponse.json();
        console.log('バケット作成APIレスポンス:', bucketData);
        
        if (!bucketResponse.ok) {
          console.error('バケット作成APIエラー:', bucketData);
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
        name: file.name,
        type: file.type,
        size: file.size
      });
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type // ContentTypeを明示的に指定
        });
      if (error) {
        console.error('アップロードエラー詳細:', error);
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
        console.error('filePath:', filePath, 'bucketName:', bucketName);
        throw new Error('公開URLの取得に失敗しました');
      }
      console.log('公開URL:', urlData.publicUrl);
      // アップロードしたサムネイルへの正しいURLを返す
      return urlData.publicUrl;
    } catch (error) {
      console.error('サムネイルのアップロードエラー詳細:', error);
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
    // 未ログインユーザーは投稿できないように
    if (isAnonymousSubmission) {
      toast({
        title: "ログインが必要です",
        description: "投稿するにはログインしてください",
        variant: "destructive",
      });
      router.push('/Login');
      return;
    }

    console.log('[DEBUG] submitProject時の状態:');
    console.log('[DEBUG] - projectSettings.thumbnail:', projectSettings.thumbnail ? `存在します(${projectSettings.thumbnail.length}文字)` : 'なし');
    console.log('[DEBUG] - thumbnailFile:', thumbnailFile ? `存在します(${thumbnailFile.name})` : 'なし');
    
    if (prompts.length === 0) {
      toast({
        title: "エラー",
        description: "少なくとも1つのプロンプトを追加してください",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // サムネイル画像のアップロード
      let thumbnailUrl = null;
      let fileToUpload = thumbnailFile;
      
      // もし直接thumbnailFileがあればそれを使用
      if (fileToUpload) {
        console.log('[DEBUG] thumbnailFileが存在します。これを使用します:', fileToUpload.name);
      } 
      // なければprojectSettings.thumbnailからFileを生成
      else if (projectSettings.thumbnail && projectSettings.thumbnail.startsWith('data:')) {
        console.log('[DEBUG] thumbnailFileがないためprojectSettings.thumbnailから生成します');
        // 同期的に変換処理を行う
        handleThumbnailChange(projectSettings.thumbnail);
        // 状態更新が非同期のため、直接変換結果を取得
        fileToUpload = dataURLtoFile(
          projectSettings.thumbnail,
          `thumbnail-${Date.now()}.${projectSettings.thumbnail.match(/data:image\/([^;]+);/)?.[1] || 'png'}`
        );
        console.log('[DEBUG] 生成したファイル:', fileToUpload.name);
      } else {
        console.log('[DEBUG] サムネイルデータがないためスキップします');
      }
      
      // ファイルがあればアップロードを実行
      if (fileToUpload) {
        toast({
          title: "処理中",
          description: "サムネイル画像をアップロード中...",
          variant: "default",
        });
        console.log('[DEBUG] uploadThumbnailToStorageにファイルを渡します:', fileToUpload.name);
        thumbnailUrl = await uploadThumbnailToStorage(fileToUpload);
        console.log('[DEBUG] アップロード結果URL:', thumbnailUrl || 'アップロード失敗');
        
        if (!thumbnailUrl) {
          const continueWithoutThumbnail = window.confirm(
            'サムネイル画像のアップロードに失敗しました。サムネイルなしで投稿を続けますか？'
          );
          
          if (!continueWithoutThumbnail) {
            setIsSubmitting(false);
            return;
          }
        }
      } else {
        console.log('[DEBUG] サムネイルファイルがないためアップロードをスキップします');
      }

      // 投稿直前に認証状態を再取得
      let finalAuthorId = authorId;
      let isAnonymous = isAnonymousSubmission;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (user?.id) {
          finalAuthorId = user.id;
          isAnonymous = false;
        } else if (sessionData.session?.user?.id) {
          finalAuthorId = sessionData.session.user.id;
          isAnonymous = false;
        }
      } catch (e) {
        // 何もしない（authorIdは匿名IDのまま）
      }

      // リクエストヘッダーの設定
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (user && session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      toast({
        title: "処理中",
        description: "プロンプトデータを送信中...",
        variant: "default",
      });

      // プロンプトプロジェクトのメインデータを保存
      const requestBody = {
        title: prompts[0].title || projectSettings.projectTitle || "無題のプロンプト",
        description: projectSettings.projectDescription || "",
        content: prompts[0].content, // 最初のプロンプトの内容をメインコンテンツとして使用
        thumbnail_url: thumbnailUrl, // アップロードしたサムネイルのURL
        category_id: null, // カテゴリIDがあれば指定
        price: projectSettings.pricingType === "paid" ? projectSettings.price : 0,
        is_free: projectSettings.pricingType === "free",
        ai_model: projectSettings.aiModel === "custom" 
          ? projectSettings.customAiModel 
          : projectSettings.aiModel,
        author_id: finalAuthorId, // 必ず最新のauthorIdを使う
        site_url: projectSettings.projectUrl || null // プロジェクトURLを送信
      };

      console.log('[DEBUG] API送信データ:', requestBody);
      
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
      
      // router.push("/"); // 投稿後にホームに遷移しないようにコメントアウト
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
          <div className="w-full max-w-3xl mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">
              現在ログインしていません。プロンプトの投稿にはログインが必要です。
              <a href="/Login" className="underline text-blue-600 font-bold ml-1">ログイン</a>して投稿してください。
            </p>
          </div>
        )}
        
        {/* プロジェクト設定フォーム */}
        {!isAnonymousSubmission && (
          <ProjectSettingsForm
            onSave={handleProjectSave}
            defaultValues={projectSettings}
          />
        )}
        
        {/* プロンプト履歴 */}
        {!isAnonymousSubmission && showHistory && prompts.length > 0 && (
          <PromptHistory
            prompts={prompts}
            onEditPrompt={handleEditPrompt}
          />
        )}
        
        {/* プロンプト入力フォーム */}
        {!isAnonymousSubmission && (
          <PromptForm
            onSubmit={handlePromptSubmit}
            initialPromptNumber={promptNumber}
            aiModel={projectSettings.aiModel}
            modelLabel={getModelLabel(projectSettings.aiModel)}
          />
        )}
        
        {/* プロジェクト投稿ボタン */}
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={submitProject}
            className="bg-black hover:bg-gray-800 text-white"
            disabled={isAnonymousSubmission || prompts.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                送信中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {isAnonymousSubmission ? "ログインが必要です" : "プロジェクトを投稿"}
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