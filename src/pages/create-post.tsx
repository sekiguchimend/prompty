import React, { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { HelpCircle, Send, Loader2, ArrowLeft } from 'lucide-react';
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
  StandardForm
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
    aiModel: "claude-3-5-sonnet",
    customAiModel: "",
    pricingType: "free",
    price: 0,
    projectDescription: "",
    thumbnail: "",
    projectUrl: "",
    categoryId: null, // カテゴリIDを追加
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [isAnonymousSubmission, setIsAnonymousSubmission] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  
  // 投稿モード選択のための状態を追加
  type PostMode = 'selection' | 'standard' | 'step';
  const [postMode, setPostMode] = useState<PostMode>('selection');
  // ステップベースのフォーム用の状態を追加
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const TOTAL_STEPS = 8; // 全ステップ数（プロジェクト情報の各項目、プロンプト入力、確認と投稿）
  
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
      console.log('サムネイル画像を検出、Fileオブジェクトに変換します');
      // サムネイル処理を実行
      handleThumbnailChange(data.thumbnail);
    } else if (data.thumbnail) {
      console.log('サムネイル画像はすでに処理済みかBase64形式ではありません');
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
      
      // 既に同じデータが処理されている場合はスキップ
      if (thumbnailFile && projectSettings.thumbnail === thumbnailDataUrl) {
        console.log('同一サムネイルデータが既に処理済みのためスキップします');
        return;
      }
      
      console.log('サムネイルデータ処理開始');
      
      // ファイル名を生成（タイムスタンプを含める）
      const timestamp = Date.now();
      const filename = `thumbnail-${timestamp}`;
      
      // データURLをFileオブジェクトに変換
      const file = dataURLtoFile(thumbnailDataUrl, filename);
      
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
  
  // サムネイル画像をBase64からFileオブジェクトに変換（改良版）
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    try {
      // データURLの形式を確認
      if (!dataurl.startsWith('data:')) {
        console.error('無効なデータURL形式');
        throw new Error('無効なデータURL形式');
      }
      
      // データURLをヘッダーとデータ部分に分割
      const parts = dataurl.split(';base64,');
      if (parts.length !== 2) {
        console.error('無効なBase64データURL形式');
        throw new Error('無効なBase64データURL形式');
      }
      
      // MIMEタイプを抽出し、画像形式かチェック
      let mimeType = parts[0].replace('data:', '');
      
      // サポートする画像形式の定義
      const supportedImageTypes = [
        'image/jpeg', 'image/png', 'image/gif', 
        'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'
      ];
      
      // MIMEタイプが画像でない場合は強制的に画像形式に変更
      if (!mimeType.startsWith('image/')) {
        console.warn(`非画像MIMEタイプ "${mimeType}" を検出、"image/png" に変更します`);
        mimeType = 'image/png';
      } else if (!supportedImageTypes.includes(mimeType)) {
        console.warn(`未サポートの画像形式 "${mimeType}" を検出、サポートされている形式に変更します`);
        mimeType = 'image/png'; // サポートされていない画像形式の場合もpngをデフォルトに
      }
      
      console.log('画像データURL処理:', {
        mimeType: mimeType,
        filenameSuggested: filename
      });
      
      try {
        // Base64デコード
        const byteString = atob(parts[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // バイト配列に変換
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        
        // ファイル拡張子の検出
        const fileExt = mimeType.split('/')[1] || 'png';
        
        // 拡張子が含まれていない場合はファイル名に追加
        let finalFilename = filename;
        if (!filename.includes('.')) {
          finalFilename = `${filename}.${fileExt}`;
        }
        
        // Blobを作成し、そこからFileを生成
        // contentTypeを必ず画像形式にする
        const blob = new Blob([uint8Array], { type: mimeType });
        const file = new File([blob], finalFilename, { type: mimeType });
        
        console.log('データURLからファイル変換成功:', {
          name: file.name,
          type: file.type,
          size: file.size
        });
        
        return file;
      } catch (e) {
        console.error('Base64デコードエラー:', e);
        throw new Error('Base64デコードに失敗しました');
      }
    } catch (error) {
      console.error('dataURLtoFile 変換エラー:', error);
      // エラー時はダミーの空画像を返す
      const emptyBlob = new Blob([], { type: 'image/png' });
      return new File([emptyBlob], filename, { type: 'image/png' });
    }
  };
  
  // ストレージにサムネイル画像をアップロード
  // ストレージにサムネイル画像をアップロード
const uploadThumbnailToStorage = async (file: File): Promise<string | null> => {
  if (!file) {
    console.error('サムネイルアップロード: ファイルがnullです');
    return null;
  }
  
  try {
    console.log('サムネイルアップロード処理開始:', file.name);
    
    // 最新の認証セッションを取得
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    // 認証トークンの詳細なログ
    let authToken = null;
    if (currentSession?.access_token) {
      authToken = currentSession.access_token;
      const tokenLength = authToken.length;
      console.log('認証トークン情報:', {
        長さ: tokenLength,
        先頭: authToken.substring(0, 10) + '...',
        末尾: '...' + authToken.substring(tokenLength - 10),
        ドット数: authToken.split('.').length - 1
      });
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
    console.log('サーバーサイドAPIを使用してアップロード開始', {
      認証ヘッダー: authToken ? '設定済み' : 'なし'
    });
    
    const response = await fetch('/api/thumbnail/upload', {
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
    
    console.log('サムネイルアップロード成功:', result.publicUrl);
    
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
      
      console.log('画像URL検証成功');
    } catch (imageError) {
      console.warn('画像URL検証に失敗しましたが、処理を続行します:', imageError);
      // 検証に失敗しても続行する
    }
    
    return result.publicUrl;
  } catch (error) {
    console.error('サムネイルアップロードエラー:', error);
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
    console.log("Prompt submitted:", data);
    
    // 常に一意のIDを生成（既存のIDとの重複を避ける）
    const uniqueId = data.promptNumber;
    
    // IDが既に存在するかチェック
    if (prompts.some(p => p.id === uniqueId)) {
      // 既存IDがある場合は最大ID+1を使用
      const nextId = Math.max(...prompts.map(p => p.id), 0) + 1;
      console.log(`ID ${uniqueId} は既に存在します。代わりに ${nextId} を使用します。`);
      
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

  // 既に処理中なら何もしない（二重実行防止）
  if (isSubmitting) {
    console.log('既に投稿処理中です。処理をスキップします。');
    return;
  }

  console.log('投稿処理を開始します:', {
    thumbnail: projectSettings.thumbnail ? `存在します(${projectSettings.thumbnail.length}文字)` : 'なし',
    thumbnailFile: thumbnailFile ? `存在します(${thumbnailFile.name})` : 'なし',
    prompts: prompts.length 
  });
  
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
        console.log('thumbnailFileがないため、dataURLから直接生成します');
        const timestamp = Date.now();
        const filename = `thumbnail-${timestamp}`;
        // undefined対策（文字列であることを保証）
        const dataUrl = projectSettings.thumbnail || '';
        imageFile = dataURLtoFile(dataUrl, filename);
        
        console.log('thumbnailFile生成完了:', {
          name: imageFile.name,
          type: imageFile.type,
          size: imageFile.size
        });
      }
      
      // 画像ファイルがあればアップロード
      if (imageFile) {
        console.log('画像ファイルをアップロードします:', imageFile.name);
        thumbnailUrl = await uploadThumbnailToStorage(imageFile);
        
        // アップロード結果を確認
        if (thumbnailUrl) {
          console.log('画像アップロード成功:', thumbnailUrl);
          
          // サムネイルURLの有効性を再確認
          try {
            const urlCheckResponse = await fetch(thumbnailUrl, { method: 'HEAD' });
            if (!urlCheckResponse.ok) {
              console.warn('最終的なサムネイルURL確認エラー:', 
                urlCheckResponse.status, urlCheckResponse.statusText);
              
              // Content-Typeを確認
              const contentTypeHeader = urlCheckResponse.headers.get('content-type');
              console.log('応答のContent-Type:', contentTypeHeader);
              
              if (contentTypeHeader?.includes('application/json')) {
                console.error('画像が正しく保存されていません。JSONが返されています。');
                
                // ユーザーに確認
                const retryUpload = window.confirm(
                  'サムネイル画像に問題があります。再度アップロードを試みますか？'
                );
                
                if (retryUpload) {
                  // 再試行（新しいAPIエンドポイントを使って再アップロード）
                  if (imageFile) {
                    console.log('再アップロード試行中...');
                    
                    // FormDataを使用して再アップロード
                    const formData = new FormData();
                    formData.append('thumbnailImage', imageFile);

                    // 認証トークンを取得（再試行直前に取得）
                    const { data: { session: retrySession } } = await supabase.auth.getSession();
                    const retryAuthToken = retrySession?.access_token;

                    // 再試行時に送信する認証トークンをログに出力
                    console.log('再試行時に送信する認証トークン:', retryAuthToken ? retryAuthToken.substring(0, 10) + '...' : 'トークンなし');

                    // API経由でアップロード
                    const retryResponse = await fetch('/api/thumbnail/upload', {
                      method: 'POST',
                      headers: {
                        // 再取得したトークンを使用
                        ...(retryAuthToken ? { 'Authorization': `Bearer ${retryAuthToken}` } : {})
                      },
                      body: formData,
                    });
                    
                    if (!retryResponse.ok) {
                      console.error('再アップロードAPI応答エラー:', await retryResponse.text());
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
                        console.log('再アップロード成功:', thumbnailUrl);
                      } else {
                        console.error('再アップロード応答に公開URLがありません');
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
            console.warn('サムネイルURL接続エラー:', urlCheckError);
            // エラーがあっても処理を続行
          }
        } else {
          console.error('画像アップロード失敗');
          const continueWithoutThumbnail = window.confirm(
            'サムネイル画像のアップロードに失敗しました。サムネイルなしで投稿を続けますか？'
          );
          
          if (!continueWithoutThumbnail) {
            setIsSubmitting(false);
            return;
          }
        }
      } else {
        console.log('有効な画像ファイルがないため、アップロードをスキップします');
      }
    } else {
      console.log('サムネイル画像がないため、アップロードをスキップします');
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
      title: projectSettings.projectTitle || "無題のプロジェクト",
      description: projectSettings.projectDescription || "",
      content: projectSettings.projectDescription || "", // プロジェクト説明をcontentに
      thumbnail_url: thumbnailUrl, // Supabase Storageの公開URL
      category_id: projectSettings.categoryId, // カテゴリーIDを追加
      price: projectSettings.pricingType === "paid" ? projectSettings.price : 0,
      is_free: projectSettings.pricingType === "free",
      ai_model: projectSettings.aiModel === "custom" 
        ? projectSettings.customAiModel 
        : projectSettings.aiModel,
      author_id: finalAuthorId, // 必ず最新のauthorIdを使う
      site_url: projectSettings.projectUrl || null, // プロジェクトURLを送信
      prompt_title: prompts[0].prompt_title, // 最初のプロンプトのタイトル
      prompt_content: prompts[0].prompt_content // 最初のプロンプトの内容
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

    console.log('[DEBUG] API送信データ:', {
      ...requestBody,
      prompt_title_length: requestBody.prompt_title.length,
      prompt_content_length: requestBody.prompt_content.length,
      prompt_content_preview: requestBody.prompt_content.substring(0, 50) + '...',
      category_id: requestBody.category_id || 'カテゴリー未選択'
    });
    
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
    
    // 有料記事の場合はStripe連携処理を実行
    if (projectSettings.pricingType === "paid" && promptId) {
      try {
        toast({
          title: "処理中",
          description: "Stripe商品情報を生成中...",
          variant: "default",
        });
        
        console.log('Stripe連携処理開始:', promptId);
        
        // 最新の認証セッションを取得
        const { data: sessionData } = await supabase.auth.getSession();
        
        // 認証トークンを確実に取得
        let accessToken = null;
        if (sessionData?.session?.access_token) {
          accessToken = sessionData.session.access_token;
          console.log('最新の認証トークンを取得しました:', accessToken.substring(0, 10) + '...');
        } else if (session?.access_token) {
          accessToken = session.access_token;
          console.log('既存セッションから認証トークンを使用します:', accessToken.substring(0, 10) + '...');
        } else {
          console.error('認証トークンがありません - Stripe連携ができません');
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
        console.log(`Stripe連携レスポンス: ${stripeResponse.status}`, responseText);
        
        // 詳細なレスポンス診断ログ
        console.log('Stripe連携詳細診断:', {
          status: stripeResponse.status,
          statusText: stripeResponse.statusText,
          headers: {
            contentType: stripeResponse.headers.get('content-type'),
            contentLength: stripeResponse.headers.get('content-length')
          },
          url: '/api/proxy/stripe-sync',
          promptId: promptId
        });
        
        if (!stripeResponse.ok) {
          // エラーの詳細を表示
          console.error('Stripe連携エラー:', {
            status: stripeResponse.status,
            statusText: stripeResponse.statusText,
            response: responseText
          });
          
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
          
          console.error('Stripe連携エラー詳細:', errorMessage, errorDetails);
          
          // 警告を表示するが、メイン処理は続行
          toast({
            title: "注意",
            description: errorMessage + "（記事は投稿されました）",
            variant: "destructive",
          });
          
          // 開発者向け詳細情報をコンソールに出力
          console.log('開発者向けStripe連携エラー詳細:', {
            message: errorMessage,
            details: errorDetails,
            timestamp: new Date().toISOString(),
            env: {
              nodeEnv: process.env.NODE_ENV,
              hasFuncUrl: !!process.env.SUPABASE_FUNC_URL,
              funcUrlLength: process.env.SUPABASE_FUNC_URL?.length || 0
            }
          });
        } else {
          console.log('Stripe連携成功:', responseText);
          toast({
            title: "成功",
            description: "Stripe商品情報が正常に生成されました",
            variant: "default",
          });
        }
      } catch (stripeError) {
        console.error('Stripe連携例外:', stripeError);
        // エラー詳細を取得
        const errorMessage = stripeError instanceof Error ? stripeError.message : '不明なエラー';
        const errorStack = stripeError instanceof Error ? stripeError.stack : undefined;
        
        // 警告を表示するが、メイン処理は続行
        toast({
          title: "注意",
          description: `Stripe連携処理でエラーが発生しました: ${errorMessage}（記事は投稿されました）`,
          variant: "destructive",
        });
        
        // 開発者向け詳細情報
        console.error('Stripe連携例外詳細:', {
          message: errorMessage,
          stack: errorStack,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    toast({
      title: "投稿成功",
      description: "プロジェクトが投稿されました",
      variant: "default",
    });
    
    // 投稿成功後のリダイレクト
    // router.push("/"); 
    
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

  // 投稿モード選択ハンドラー
  const handleSelectPostMode = (mode: 'standard' | 'step') => {
    console.log(`選択されたモード: ${mode}`);
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