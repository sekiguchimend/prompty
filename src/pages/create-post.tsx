import React, { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { HelpCircle, Send, Loader2, ArrowLeft, Settings, Sparkles, Code } from 'lucide-react';
import Footer from "../components/footer";
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
  type Prompt,
  PostModeSelector,
  StepBasedForm,
  StandardForm,
  // CodeGenerationTab,
  type GeneratedCodeProject
} from '../components/create-post';
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "../lib/auth-context";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabaseClient';

// カテゴリの型定義
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
}

// Supabase接続情報をチェックする関数（開発中のみ使用）
const checkSupabaseConfiguration = () => {
  // 本番環境ではこの機能を無効化
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.log('Supabase設定チェック開始...');
  
  // 環境変数をチェック
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // 設定情報を表示（キーは部分的に隠す）
  console.log('Supabase設定:', {
    url: supabaseUrl || '未設定',
    anonKeySet: supabaseAnonKey ? '設定済み' : '未設定',
    anonKeyLength: supabaseAnonKey?.length || 0
  });
  
  // supabaseインスタンスの状態確認
  if (!supabase) {
    console.error('Supabaseクライアントが初期化されていません');
    return;
  }
  
  // ストレージ機能のテスト（匿名アクセス）
  const testBucket = async () => {
    try {
      // バケット一覧取得を試みる（匿名ユーザーでも取得可能かテスト）
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('ストレージアクセスエラー:', error);
      } else {
        console.log('利用可能なバケット一覧:', data?.map(b => b.name) || []);
        
        // prompt-thumbnailsバケットが存在するか確認
        const thumbnailBucket = data?.find(b => b.name === 'prompt-thumbnails');
        if (thumbnailBucket) {
          console.log('サムネイル用バケットが存在します:', thumbnailBucket);
          
          // バケットのアクセス権をテスト
          try {
            const { data: files } = await supabase.storage
              .from('prompt-thumbnails')
              .list();
            
            console.log('バケット内のファイル一覧取得成功:', files?.length || 0);
          } catch (e) {
            console.error('バケットアクセスエラー:', e);
          }
        } else {
          console.warn('サムネイル用バケットが存在しません - 自動作成が必要です');
        }
      }
    } catch (e) {
      console.error('ストレージテストエラー:', e);
    }
  };
  
  // テスト実行
  testBucket();
};

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
    aiModel: "claude-4-sonnet",
    customAiModel: "",
    pricingType: "free",
    price: 0,
    projectDescription: "",
    thumbnail: "",
    projectUrl: "",
    categoryId: null, // カテゴリIDを追加
    previewLines: 3, // プレビュー行数を追加
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [isAnonymousSubmission, setIsAnonymousSubmission] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadedMediaType, setUploadedMediaType] = useState<'image' | 'video' | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  
  // 投稿モード選択のための状態を追加
  type PostMode = 'selection' | 'standard' | 'step' | 'code-generation';
  const [postMode, setPostMode] = useState<PostMode>('selection');
  // ステップベースのフォーム用の状態を追加
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const TOTAL_STEPS = 8; // 全ステップ数（プロジェクト情報の各項目、プロンプト入力、確認と投稿）
  
  // コード生成用の状態を追加
  const [generatedCodeProjects, setGeneratedCodeProjects] = useState<GeneratedCodeProject[]>([]);
  
  // カテゴリ一覧を取得
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('カテゴリ取得エラー:', error);
        toast({
          title: "エラー",
          description: "カテゴリの取得に失敗しました",
          variant: "destructive",
        });
      } else if (data) {
        console.log('カテゴリ取得成功:', data.length);
        setCategories(data);
      }
    } catch (error) {
      console.error('カテゴリ取得例外:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };
  
  // 初期化時にSupabase設定をチェックしカテゴリ一覧を取得
  useEffect(() => {
    // 開発環境のみで実行
    if (process.env.NODE_ENV !== 'production') {
      checkSupabaseConfiguration();
    }
    
    // カテゴリ一覧を取得
    fetchCategories();
  }, []);

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
      thumbnail: data.thumbnail || "",
      categoryId: data.categoryId || null 
    });
    
    // サムネイル画像があれば処理 - thumbnailFileが既に設定されている場合は処理しない
    if (data.thumbnail && data.thumbnail.startsWith('data:') && !thumbnailFile) {
      // サムネイル処理を実行
      handleThumbnailChange(data.thumbnail);
    } else if (data.thumbnail) {
    } else {
      // サムネイルがない場合は明示的にnullをセット
      setThumbnailFile(null);
      setUploadedMediaType(null);
    }
  };
  
  // サムネイル画像を直接処理する関数（同期的に状態を更新）
  const handleThumbnailChange = (thumbnailDataUrl: string) => {
    try {
      if (!thumbnailDataUrl || !thumbnailDataUrl.startsWith('data:')) {
        setThumbnailFile(null);
        setUploadedMediaType(null);
        return;
      }
      
      // 既に同じデータが処理されている場合はスキップ
      if (thumbnailFile && projectSettings.thumbnail === thumbnailDataUrl) {
        return;
      }
      
      
      // ファイル名を生成（タイムスタンプを含める）
      const timestamp = Date.now();
      const filename = `thumbnail-${timestamp}`;
      
      // データURLをFileオブジェクトに変換
      const file = dataURLtoFile(thumbnailDataUrl, filename);
      
      
      // 状態を直接更新
      setThumbnailFile(file);
      
    } catch (error) {
      setThumbnailFile(null);
      setUploadedMediaType(null);
    }
  };

  // Fileオブジェクトを直接受け取る関数（ThumbnailUploaderから呼ばれる）
  const handleThumbnailFileChange = (file: File | null) => {
    console.log('🖼️ 直接ファイル処理:', file ? { name: file.name, size: file.size, type: file.type } : 'ファイルなし');
    
    setThumbnailFile(file);
    
    if (file) {
      // メディアタイプを設定
      const isVideo = file.type.startsWith('video/');
      setUploadedMediaType(isVideo ? 'video' : 'image');
      console.log('📁 メディアタイプ設定:', isVideo ? 'video' : 'image');
      
      // プレビュー用にdata URLを生成（projectSettingsに保存）
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setProjectSettings(prev => ({ ...prev, thumbnail: result }));
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedMediaType(null);
      setProjectSettings(prev => ({ ...prev, thumbnail: '' }));
    }
  };
  
  // サムネイル画像をBase64からFileオブジェクトに変換（改良版）
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    try {
      // データURLの形式を確認
      if (!dataurl.startsWith('data:')) {
        throw new Error('無効なデータURL形式');
      }
      
      // データURLをヘッダーとデータ部分に分割
      const parts = dataurl.split(';base64,');
      if (parts.length !== 2) {
        throw new Error('無効なBase64データURL形式');
      }
      
      // MIMEタイプを抽出し、画像形式かチェック
      let mimeType = parts[0].replace('data:', '');
      
      // サポートする画像・動画形式の定義
      const supportedImageTypes = [
        'image/jpeg', 'image/png', 'image/gif', 
        'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'
      ];
      
      const supportedVideoTypes = [
        'video/mp4', 'video/webm', 'video/mov', 
        'video/avi', 'video/quicktime'
      ];
      
      // MIMEタイプのチェック（画像・動画両方をサポート）
      const isImage = mimeType.startsWith('image/');
      const isVideo = mimeType.startsWith('video/');
      
      if (!isImage && !isVideo) {
        // 画像でも動画でもない場合はデフォルトで画像として扱う
        mimeType = 'image/png';
      } else if (isImage && !supportedImageTypes.includes(mimeType)) {
        // サポートされていない画像形式の場合はpngをデフォルトに
        mimeType = 'image/png';
      } else if (isVideo && !supportedVideoTypes.includes(mimeType)) {
        // サポートされていない動画形式の場合はmp4をデフォルトに
        mimeType = 'video/mp4';
      }
      
      
      try {
        // Base64デコード
        const byteString = atob(parts[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // バイト配列に変換
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        
        // ファイル拡張子の検出（画像・動画に対応）
        let fileExt = mimeType.split('/')[1] || 'png';
        
        // 特定のMIMEタイプに対する拡張子マッピング
        const mimeToExtMapping: { [key: string]: string } = {
          'video/quicktime': 'mov',
          'image/jpeg': 'jpg',
          'image/svg+xml': 'svg'
        };
        
        if (mimeToExtMapping[mimeType]) {
          fileExt = mimeToExtMapping[mimeType];
        }
        
        // 拡張子が含まれていない場合はファイル名に追加
        let finalFilename = filename;
        if (!filename.includes('.')) {
          finalFilename = `${filename}.${fileExt}`;
        }
        
        // Blobを作成し、そこからFileを生成
        const blob = new Blob([uint8Array], { type: mimeType });
        const file = new File([blob], finalFilename, { type: mimeType });
        
  
        
        return file;
      } catch (e) {
        throw new Error('Base64デコードに失敗しました');
      }
    } catch (error) {
      // エラー時はダミーの空画像を返す
      const emptyBlob = new Blob([], { type: 'image/png' });
      return new File([emptyBlob], filename, { type: 'image/png' });
    }
  };
  
  // ストレージにサムネイル画像をアップロード
  // ストレージにサムネイル画像をアップロード
const uploadThumbnailToStorage = async (file: File): Promise<string | null> => {
  if (!file) {
    return null;
  }
  
  try {
    
    // 最新の認証セッションを取得
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    // 認証トークンの詳細なログ
    let authToken = null;
    if (currentSession?.access_token) {
      authToken = currentSession.access_token;
      const tokenLength = authToken.length;
     
    } else {
      console.warn('認証トークンがありません - 匿名アップロードを試みます');
    }

    // FormDataを作成
    const formData = new FormData();
    formData.append('thumbnailImage', file);
    
    // APIリクエストヘッダーの設定
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // API経由でアップロード
  
    
    const response = await fetch('/api/media/thumbnail-upload', {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('サムネイルアップロードAPI応答エラー:', response.status, errorText);
      throw new Error(`アップロードに失敗しました: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.publicUrl) {
      console.error('公開URL取得エラー:', result);
      throw new Error('公開URLの取得に失敗しました');
    }
    
    // メディアタイプ情報を保存
    if (result.mediaType) {
      setUploadedMediaType(result.mediaType);
      console.log('📁 アップロードされたメディアタイプ:', result.mediaType);
    } else {
      console.log('⚠️ アップロードAPIからmedia_typeが返されませんでした');
    }
    
    
    // URLが実際に有効かチェック
    try {
      const imageTest = new Image();
      imageTest.src = result.publicUrl;
      
      // 画像のロードを待つ
      await new Promise((resolve, reject) => {
        imageTest.onload = resolve;
        imageTest.onerror = reject;
        // 5秒のタイムアウト
        setTimeout(() => reject(new Error('画像URLの検証がタイムアウトしました')), 5000);
      });
      
    } catch (imageError) {
    }
    
    return result.publicUrl;
  } catch (error) {
    toast({
      title: "サムネイルエラー",
      description: "画像のアップロードに失敗しました。",
      variant: "destructive",
    });
    return null;
  }
};

  // プロンプトの追加
  const handlePromptSubmit = (data: PromptFormValues) => {
    
    // 常に一意のIDを生成（既存のIDとの重複を避ける）
    const uniqueId = data.promptNumber;
    
    // IDが既に存在するかチェック
    if (prompts.some(p => p.id === uniqueId)) {
      // 既存IDがある場合は最大ID+1を使用
      const nextId = Math.max(...prompts.map(p => p.id), 0) + 1;
      
      // 新しいプロンプトを追加
      const newPrompt: Prompt = {
        id: nextId,
        prompt_title: `プロンプト #${nextId}`, // 自動生成タイトル
        prompt_content: data.fullPrompt, // プロンプト本文を使用
        createdAt: new Date()
      };
      
      setPrompts([...prompts, newPrompt]);
      
      // 次のプロンプト番号を設定
      setPromptNumber(nextId + 1);
      
      // 成功メッセージ
      toast({
        title: "プロンプト追加",
        description: `プロンプト #${nextId} が追加されました`,
        variant: "default",
      });
    } else {
      // 新しいプロンプトを追加
      const newPrompt: Prompt = {
        id: uniqueId,
        prompt_title: `プロンプト #${uniqueId}`, // 自動生成タイトル
        prompt_content: data.fullPrompt, // プロンプト本文を使用
        createdAt: new Date()
      };
      
      setPrompts([...prompts, newPrompt]);
      
      // 次のプロンプト番号を設定
      setPromptNumber(uniqueId + 1);
      
      // 成功メッセージ
      toast({
        title: "プロンプト追加",
        description: `プロンプト #${uniqueId} が追加されました`,
        variant: "default",
      });
    }
  };

  // 既存プロンプトの編集
  const handleEditPrompt = (prompt: Prompt) => {
    // 編集モードに設定（既存のプロンプトIDを新しいプロンプトとして追加しない）
    // 代わりに新しいプロンプト番号を使用
    const nextNumber = Math.max(...prompts.map(p => p.id), 0) + 1;
    setPromptNumber(nextNumber);
    
    // フォームに既存の内容を設定するためにイベントを発行
    window.dispatchEvent(new CustomEvent('edit-prompt', { 
      detail: { 
        id: nextNumber, 
        data: prompt.prompt_content
      } 
    }));
    
    toast({
      title: "編集モード",
      description: `プロンプト #${prompt.id} の内容を編集モードにしました`,
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

  // 有料記事の場合、Stripeアカウント設定をチェック
  if (projectSettings.pricingType === "paid") {
    try {
      toast({
        title: "確認中",
        description: "Stripeアカウント設定を確認中...",
        variant: "default",
      });

      // 現在のユーザーのプロフィール情報を取得
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', user?.id)
        .single();

      if (profileError || !profile?.stripe_account_id) {
        toast({
          title: "Stripeアカウントが必要です",
          description: "有料記事を投稿するには、まずStripeアカウントを設定してください。設定ページに移動しますか？",
          variant: "destructive",
        });

        const goToSettings = window.confirm(
          "有料記事を投稿するには、Stripeアカウントの設定が必要です。\n設定ページに移動しますか？"
        );

        if (goToSettings) {
          router.push('/settings?tab=stripe');
        }
        return;
      }

      // Stripeアカウントの状態を確認
      try {
        const accountResponse = await fetch('/api/stripe/check-account-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ accountId: profile.stripe_account_id }),
        });

        if (!accountResponse.ok) {
          throw new Error('アカウント状態の確認に失敗しました');
        }

        const accountData = await accountResponse.json();
        
        if (accountData.status !== 'complete') {
          toast({
            title: "Stripeアカウント設定が未完了です",
            description: "有料記事を投稿するには、Stripeアカウントの設定を完了してください。",
            variant: "destructive",
          });

          const completeSetup = window.confirm(
            "Stripeアカウントの設定が未完了です。\n設定を完了しますか？"
          );

          if (completeSetup) {
            router.push('/settings?tab=stripe');
          }
          return;
        }

      } catch (accountCheckError) {
      }
    } catch (stripeCheckError) {
      toast({
        title: "エラー",
        description: "Stripeアカウントの確認中にエラーが発生しました。",
        variant: "destructive",
      });
      return;
    }
  }

  // 既に処理中なら何もしない（二重実行防止）
  if (isSubmitting) {
    return;
  }

  
  
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
    
    // サムネイル処理のデバッグ情報
    console.log('🖼️ サムネイル処理開始:', {
      thumbnailFile: !!thumbnailFile,
      projectSettingsThumbnail: !!projectSettings.thumbnail,
      isDataUrl: projectSettings.thumbnail?.startsWith('data:'),
      thumbnailValue: projectSettings.thumbnail?.substring(0, 50) + '...'
    });
    
    // サムネイル画像があれば処理
    if (thumbnailFile || (projectSettings.thumbnail && projectSettings.thumbnail.startsWith('data:'))) {
      toast({
        title: "処理中",
        description: "サムネイル画像をアップロード中...",
        variant: "default",
      });
      
      // 既存のファイルを優先的に使用
      let imageFile = thumbnailFile;
      
      // thumbnailFileがなければ、dataURLから一度だけ生成
      if (!imageFile && projectSettings.thumbnail && projectSettings.thumbnail.startsWith('data:')) {
        const timestamp = Date.now();
        const filename = `thumbnail-${timestamp}`;
        // undefined対策（文字列であることを保証）
        const dataUrl = projectSettings.thumbnail || '';
        imageFile = dataURLtoFile(dataUrl, filename);
        
       
      }
      
      // 画像ファイルがあればアップロード
      if (imageFile) {
        thumbnailUrl = await uploadThumbnailToStorage(imageFile);
        
        // アップロード結果を確認
        if (thumbnailUrl) {
          
          // サムネイルURLの有効性を再確認
          try {
            const urlCheckResponse = await fetch(thumbnailUrl, { method: 'HEAD' });
            if (!urlCheckResponse.ok) {
             
              
              // Content-Typeを確認
              const contentTypeHeader = urlCheckResponse.headers.get('content-type');
              
              if (contentTypeHeader?.includes('application/json')) {
                
                // ユーザーに確認
                const retryUpload = window.confirm(
                  'サムネイル画像に問題があります。再度アップロードを試みますか？'
                );
                
                if (retryUpload) {
                  // 再試行（新しいAPIエンドポイントを使って再アップロード）
                  if (imageFile) {
                    
                    // FormDataを使用して再アップロード
                    const formData = new FormData();
                    formData.append('thumbnailImage', imageFile);

                    // 認証トークンを取得（再試行直前に取得）
                    const { data: { session: retrySession } } = await supabase.auth.getSession();
                    const retryAuthToken = retrySession?.access_token;

                    const retryResponse = await fetch('/api/thumbnail/upload', {
                      method: 'POST',
                      headers: {
                        // 再取得したトークンを使用
                        ...(retryAuthToken ? { 'Authorization': `Bearer ${retryAuthToken}` } : {})
                      },
                      body: formData,
                    });
                    
                    if (!retryResponse.ok) {
                      const skipThumbnail = window.confirm(
                        '再アップロードも失敗しました。サムネイルなしで投稿を続けますか？'
                      );
                      
                      if (!skipThumbnail) {
                        setIsSubmitting(false);
                        return;
                      }
                      thumbnailUrl = null;
                    } else {
                      const retryResult = await retryResponse.json();
                      if (retryResult.publicUrl) {
                        thumbnailUrl = retryResult.publicUrl;
                      } else {
                        thumbnailUrl = null;
                      }
                    }
                  }
                } else {
                  // ユーザーがキャンセルした場合はサムネイルなしで続行
                  thumbnailUrl = null;
                }
              }
            }
          } catch (urlCheckError) {
            // エラーがあっても処理を続行
          }
        } else {
          const continueWithoutThumbnail = window.confirm(
            'サムネイル画像のアップロードに失敗しました。サムネイルなしで投稿を続けますか？'
          );
          
          if (!continueWithoutThumbnail) {
            setIsSubmitting(false);
            return;
          }
        }
      } else {
        console.log('⚠️ 画像ファイルが見つかりません');
      }
    } else {
      console.log('⚠️ サムネイル処理をスキップ - 条件に合致しません:', {
        thumbnailFile: !!thumbnailFile,
        hasThumbnail: !!projectSettings.thumbnail,
        isDataUrl: projectSettings.thumbnail?.startsWith('data:')
      });
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

    // 最終メディアタイプの決定（デバッグ情報付き）
    let finalMediaType = uploadedMediaType || 'image';
    
    // サムネイルURLからもメディアタイプを推定してフォールバック
    if (!uploadedMediaType && thumbnailUrl) {
      const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
      const isVideoFromUrl = videoExtensions.some(ext => thumbnailUrl.toLowerCase().includes(ext));
      if (isVideoFromUrl) {
        finalMediaType = 'video';
        console.log('🔄 URLからメディアタイプを推定: video');
      }
    }
    
    console.log('📝 投稿データのメディア情報:', {
      uploadedMediaType,
      finalMediaType,
      thumbnailUrl,
      hasThumbnailFile: !!thumbnailFile
    });
    
    // プロンプトプロジェクトのメインデータを保存
    const requestBody = {
      title: projectSettings.projectTitle || "無題のプロジェクト",
      description: projectSettings.projectDescription || "",
      content: projectSettings.projectDescription || "", // プロジェクト説明をcontentに
      thumbnail_url: thumbnailUrl, // Supabase Storageの公開URL
      media_type: finalMediaType, // 最終的なメディアタイプ
      category_id: projectSettings.categoryId, // カテゴリーIDを追加
      price: projectSettings.pricingType === "paid" ? projectSettings.price : 0,
      is_free: projectSettings.pricingType === "free",
      ai_model: projectSettings.aiModel === "custom" 
        ? projectSettings.customAiModel 
        : projectSettings.aiModel,
      author_id: finalAuthorId, // 必ず最新のauthorIdを使う
      site_url: projectSettings.projectUrl || null, // プロジェクトURLを送信
      prompt_title: prompts[0].prompt_title, // 最初のプロンプトのタイトル
      prompt_content: prompts.length === 1 
        ? prompts[0].prompt_content // 単一プロンプトの場合
        : prompts.map((prompt, index) => 
            `プロンプト${index + 1}:\n${prompt.prompt_content}`
          ).join('\n\n---\n\n'), // 複数プロンプトの場合は番号付きで結合
      preview_lines: projectSettings.pricingType === "paid" ? projectSettings.previewLines : null,
    };

    // データベース制約のチェック
    if (!requestBody.prompt_title || requestBody.prompt_title.length < 5) {
      toast({
        title: "エラー",
        description: "プロンプトタイトルは5文字以上である必要があります",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!requestBody.prompt_content || requestBody.prompt_content.length < 10) {
      toast({
        title: "エラー",
        description: "プロンプト内容は10文字以上である必要があります",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    
    
    console.log('📤 投稿データ送信:', {
      title: requestBody.title,
      prompt_title: requestBody.prompt_title,
      media_type: requestBody.media_type,
      author_id: requestBody.author_id
    });

    const mainPromptResponse = await fetch('/api/prompts', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });
    
    console.log('📨 API応答ステータス:', mainPromptResponse.status);
    
    const responseText = await mainPromptResponse.text();
    console.log('📨 API応答内容:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON解析エラー:', parseError);
      throw new Error(`サーバーからの応答の解析に失敗しました: ${responseText}`);
    }
    
    if (!mainPromptResponse.ok || !responseData.success) {
      const errorMessage = responseData.message || responseData.error || 'プロンプト保存中にエラーが発生しました';
      console.error('❌ API投稿エラー:', {
        status: mainPromptResponse.status,
        error: errorMessage,
        response: responseData
      });
      throw new Error(errorMessage);
    }
    
    const promptId = responseData.data?.id || responseData.promptId;
    
    if (!promptId) {
    }
    
    // 複数のプロンプトを関連付けて保存（実装方法はバックエンドに依存）
    if (prompts.length > 1) {
      // 追加のプロンプトを関連付ける処理
      // 実装方法はバックエンドAPIの設計に依存します
    }
    
    // 有料記事の場合はStripe連携処理を実行
    if (projectSettings.pricingType === "paid" && promptId) {
      try {
        toast({
          title: "処理中",
          description: "Stripe商品情報を生成中...",
          variant: "default",
        });
                
        // 最新の認証セッションを取得
        const { data: sessionData } = await supabase.auth.getSession();
        
        // 認証トークンを確実に取得
        let accessToken = null;
        if (sessionData?.session?.access_token) {
          accessToken = sessionData.session.access_token;
        } else if (session?.access_token) {
          accessToken = session.access_token;
        } else {
          throw new Error('認証情報が見つかりません。再ログインしてください。');
        }

        // Stripe-syncAPIを呼び出し
        const stripeResponse = await fetch('/api/proxy/stripe-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`, // 必ず認証トークンを設定
          },
          body: JSON.stringify({ record: { id: promptId } }),
        });
        
        const responseText = await stripeResponse.text();
        
       
        if (!stripeResponse.ok) {
          // エラーの詳細を表示
         
          
          let errorMessage = "Stripe商品情報の生成に問題が発生しました";
          let errorDetails = "";
          
          // エラーの種類に応じたメッセージ
          if (stripeResponse.status === 404) {
            errorMessage = "Edge Functionが見つかりません。管理者にお問い合わせください。";
            errorDetails = "SUPABASE_FUNC_URLが正しく設定されていない可能性があります。";
          } else if (stripeResponse.status === 403) {
            errorMessage = "Edge Functionへのアクセス権限がありません。";
            errorDetails = "JWTトークンまたは認証設定の問題かもしれません。";
          } else if (stripeResponse.status === 401) {
            errorMessage = "認証に失敗しました。再ログインが必要かもしれません。";
            errorDetails = "JWTトークンが無効または期限切れです。";
          } else if (stripeResponse.status === 500) {
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorData.error || errorMessage;
              errorDetails = JSON.stringify(errorData);
            } catch (e) {
              // JSONパースエラー時は元のテキストを使用
              errorDetails = responseText;
            }
          }
                    
          // 警告を表示するが、メイン処理は続行
          toast({
            title: "注意",
            description: errorMessage + "（記事は投稿されました）",
            variant: "destructive",
          });
          
          // 開発者向け詳細情報をコンソールに出力
         
        } else {
          toast({
            title: "成功",
            description: "Stripe商品情報が正常に生成されました",
            variant: "default",
          });
        }
      } catch (stripeError) {
        // エラー詳細を取得
        const errorMessage = stripeError instanceof Error ? stripeError.message : '不明なエラー';
        const errorStack = stripeError instanceof Error ? stripeError.stack : undefined;
        
        // 警告を表示するが、メイン処理は続行
        toast({
          title: "注意",
          description: `Stripe連携処理でエラーが発生しました: ${errorMessage}（記事は投稿されました）`,
          variant: "destructive",
        });
      
      }
    }
    
    toast({
      title: "投稿成功",
      description: "プロジェクトが投稿されました",
      variant: "default",
    });
    
    // 投稿成功後のリダイレクト
    router.push("/");
    
  } catch (error) {
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

  // 投稿モード選択ハンドラー
  const handleSelectPostMode = (mode: 'standard' | 'step' | 'code-generation') => {
    setPostMode(mode);
  };

  // ステップを完了としてマークする
  const markStepAsCompleted = (step: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.add(step);
      return newSet;
    });
  };

  // 次のステップに進む
  const goToNextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // 前のステップに戻る
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // historyの表示・非表示を切り替える
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  // ボタンクリック時のハンドラー
  const handleBackButtonClick = () => {
    // 投稿モード選択画面の場合はブラウザの「戻る」ボタンと同じ挙動
    if (postMode === 'selection') {
      router.back();
    } else {
      // それ以外の場合は投稿モード選択画面に戻る
      setPostMode('selection');
    }
  };

  // ボタンのラベルを取得
  const getBackButtonLabel = () => {
    return postMode === 'selection' ? '戻る' : '投稿モード選択に戻る';
  };

  // コード生成プロジェクトの保存
  const handleCodeProjectSave = (project: GeneratedCodeProject) => {
    const projectWithId = {
      ...project,
      id: Date.now().toString(),
    };
    
    setGeneratedCodeProjects(prev => [projectWithId, ...prev]);
    
    // ローカルストレージに保存
    const existingProjects = JSON.parse(localStorage.getItem('prompty-code-projects') || '[]');
    localStorage.setItem('prompty-code-projects', JSON.stringify([projectWithId, ...existingProjects]));
    
    // 成功通知
    toast({
      title: "プロジェクトが保存されました",
      description: "コード生成プロジェクトが正常に保存されました",
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 mt-10">
        {/* 投稿モード選択か、入力フォームかを表示 */}
        {(() => {
          // 投稿モードに応じて表示を切り替え
          switch (postMode) {
            case 'selection':
              return (
                <>
                  <PostModeSelector onSelectMode={handleSelectPostMode} />
                </>
              );
            case 'standard':
            case 'step':
              return (
                <>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <button 
                      onClick={handleBackButtonClick}
                      className="text-gray-500 hover:text-black flex items-center"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" /> 
                      {getBackButtonLabel()}
                    </button>
                    
                    {postMode === 'standard' && (
                      <div className="flex flex-wrap gap-2">
                        <PromptGuideDialog onApplyExample={applyPromptExample} />
                        
                        {prompts.length > 0 && (
                          <Button 
                            variant="outline" 
                            onClick={toggleHistory}
                            className="border-gray-300 text-black text-sm"
                          >
                            {showHistory ? "履歴を隠す" : "履歴を表示"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* 認証状態表示 */}
                  {isAnonymousSubmission && (
                    <div className="w-full max-w-3xl mb-6 p-4 bg-red-50 border border-red-200 rounded-md shadow-sm">
                      <p className="text-red-800">
                        現在ログインしていません。プロンプトの投稿にはログインが必要です。
                        <a href="/Login" className="underline text-blue-600 font-bold ml-1">ログイン</a>して投稿してください。
                      </p>
                    </div>
                  )}
                  
                  {/* 投稿フォーム - モードに応じて表示を切り替え */}
                  {!isAnonymousSubmission && (
                    <>
                      {postMode === 'standard' ? (
                        // 通常投稿モード - 既存のUIコンポーネントを表示
                        <>
                          {/* プロジェクト設定フォーム */}
                          <div className="mb-8">
                            <ProjectSettingsForm
                              onSave={handleProjectSave}
                              onThumbnailFileChange={handleThumbnailFileChange}
                              defaultValues={projectSettings}
                              categories={categories}
                              isLoadingCategories={isLoadingCategories}
                              onRefreshCategories={fetchCategories}
                            />
                          </div>
                          
                          {/* プロンプト履歴 */}
                          {showHistory && prompts.length > 0 && (
                            <div className="mb-8">
                              <PromptHistory
                                prompts={prompts}
                                onEditPrompt={handleEditPrompt}
                              />
                            </div>
                          )}
                          
                          {/* プロンプト入力フォーム */}
                          <div className="mb-8">
                            <PromptForm
                              onSubmit={handlePromptSubmit}
                              initialPromptNumber={promptNumber}
                              aiModel={projectSettings.aiModel}
                              modelLabel={getModelLabel(projectSettings.aiModel)}
                              onInsertPreviewMarker={projectSettings.pricingType === 'paid' ? () => {
                                // マーカー挿入時のフィードバック
                                toast({
                                  title: "プレビュー終了位置を表示",
                                  description: "赤い線をドラッグして位置を調整できます",
                                  variant: "default",
                                });
                              } : undefined}
                              onPreviewLinesChange={(lines) => {
                                setProjectSettings(prev => ({ ...prev, previewLines: lines }));
                              }}
                              initialPreviewLines={projectSettings.previewLines}
                            />
                          </div>
                          
                          {/* プロジェクト投稿ボタン */}
                          <div className="mt-8">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                              {/* 投稿前の最終確認セクション */}
                              <div className="mb-6">
                                <div className="flex items-center space-x-3 mb-4">
                                  <Send className="h-6 w-6 text-green-600" />
                                  <div>
                                    <h3 className="text-xl font-bold text-gray-900">プロジェクト投稿準備完了</h3>
                                    <p className="text-sm text-gray-600 mt-1">すべての設定が完了しました。いよいよ投稿しましょう！</p>
                                  </div>
                                </div>
                              </div>

                              {/* 投稿前チェックリスト */}
                              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-6">
                                <h4 className="text-base font-semibold text-gray-900 mb-3">投稿前チェック</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <div className={`h-4 w-4 rounded-full mr-3 flex items-center justify-center text-xs ${projectSettings.projectTitle ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                      ✓
                                    </div>
                                    <span className={`text-sm ${projectSettings.projectTitle ? 'text-gray-900' : 'text-gray-500'}`}>
                                      プロジェクトタイトル: {projectSettings.projectTitle || '未設定'}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className={`h-4 w-4 rounded-full mr-3 flex items-center justify-center text-xs ${prompts.length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                      ✓
                                    </div>
                                    <span className={`text-sm ${prompts.length > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                                      プロンプト数: {prompts.length} 件
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className={`h-4 w-4 rounded-full mr-3 flex items-center justify-center text-xs ${projectSettings.aiModel ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                      ✓
                                    </div>
                                    <span className={`text-sm ${projectSettings.aiModel ? 'text-gray-900' : 'text-gray-500'}`}>
                                      AIモデル: {getModelLabel(projectSettings.aiModel) || '未設定'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* 投稿ボタン */}
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-600">
                                  <p className="mb-1">
                                    <span className="font-medium">料金設定:</span> {projectSettings.pricingType === 'free' ? '無料' : `¥${projectSettings.price}`}
                                  </p>
                                  <p>
                                    <span className="font-medium">公開範囲:</span> 一般公開
                                  </p>
                                </div>
                                
                            <Button 
                              onClick={submitProject}
                                  className={`${
                                    prompts.length === 0 || isSubmitting 
                                      ? 'bg-gray-400 cursor-not-allowed' 
                                      : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
                                  } text-white px-8 py-3 rounded-lg shadow-md transition-all duration-200 font-semibold`}
                              disabled={prompts.length === 0 || isSubmitting}
                                  size="lg"
                            >
                              {isSubmitting ? (
                                <>
                                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                      投稿中...
                                </>
                              ) : (
                                <>
                                      <Send className="h-5 w-5 mr-3" />
                                  プロジェクトを投稿
                                </>
                              )}
                            </Button>
                              </div>

                              {/* 注意事項 */}
                              {(prompts.length === 0 || !projectSettings.projectTitle) && (
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                      <svg className="h-4 w-4 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm text-amber-800">
                                        <span className="font-medium">投稿するには以下が必要です:</span>
                                        {!projectSettings.projectTitle && <span className="block">• プロジェクトタイトルの入力</span>}
                                        {prompts.length === 0 && <span className="block">• 最低1つのプロンプトの追加</span>}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        // ステップ投稿モード - StepBasedFormコンポーネントを使用
                        <StepBasedForm
                          currentStep={currentStep}
                          totalSteps={TOTAL_STEPS}
                          completedSteps={completedSteps}
                          projectSettings={projectSettings}
                          setProjectSettings={setProjectSettings}
                          categories={categories}
                          isLoadingCategories={isLoadingCategories}
                          onRefreshCategories={fetchCategories}
                          prompts={prompts}
                          handlePromptSubmit={handlePromptSubmit}
                          handleEditPrompt={handleEditPrompt}
                          promptNumber={promptNumber}
                          getModelLabel={getModelLabel}
                          markStepAsCompleted={markStepAsCompleted}
                          goToNextStep={goToNextStep}
                          goToPreviousStep={goToPreviousStep}
                          submitProject={submitProject}
                          isSubmitting={isSubmitting}
                        />
                      )}
                    </>
                  )}
                </>
              );
            case 'code-generation':
              return (
                <>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <button 
                      onClick={handleBackButtonClick}
                      className="text-gray-500 hover:text-black flex items-center"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" /> 
                      {getBackButtonLabel()}
                    </button>
                  </div>
                  
                  {/* 認証状態表示 */}
                  {isAnonymousSubmission && (
                    <div className="w-full max-w-3xl mb-6 p-4 bg-red-50 border border-red-200 rounded-md shadow-sm">
                      <p className="text-red-800">
                        現在ログインしていません。プロンプトの投稿にはログインが必要です。
                        <a href="/Login" className="underline text-blue-600 font-bold ml-1">ログイン</a>して投稿してください。
                      </p>
                    </div>
                  )}
                  
                  {/* 投稿フォーム - モードに応じて表示を切り替え */}
                  {!isAnonymousSubmission && (
                    <>
                      <div className="mb-8">
                        {/* CodeGenerationTabは一時的に無効化 */}
                        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                          {/* アイコン */}
                          <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                              <Settings className="w-8 h-8 text-gray-600" />
                            </div>
                          </div>

                          {/* タイトル */}
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            Code Generator
                          </h3>
                          
                          {/* ステータス */}
                          <div className="mb-6">
                            <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                              開発中
                            </span>
                          </div>

                          {/* 説明 */}
                          <p className="text-gray-600 mb-8">
                            現在開発中です。<br />
                            しばらくお待ちください。
                          </p>

                          {/* ボタン */}
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button 
                              onClick={() => window.open('/code-generator', '_blank')}
                              className="bg-gray-900 text-white px-6 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors"
                            >
                              Code Generatorを開く
                            </button>
                            <button 
                              onClick={() => setPostMode('standard')}
                              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors"
                            >
                              通常投稿に戻る
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              );
            default:
              return <div>不明なモード: {postMode}</div>;
          }
        })()}
      </main>
      
      <Footer />
    </div>
  );
};

export default CreatePost;