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
  const uploadThumbnailToStorage = async (file: File): Promise<string | null> => {
    if (!file) {
      console.error('サムネイルアップロード: ファイルがnullです');
      return null;
    }
    
    try {
      console.log('サムネイルアップロード処理開始:', file.name);
      
      // 認証トークンを取得（認証済みユーザーの場合）
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      // トークンのデバッグ情報を詳細に出力
      if (authToken) {
        const tokenLength = authToken.length;
        const tokenStart = authToken.substring(0, 20);
        const tokenEnd = authToken.substring(tokenLength - 20);
        console.log('トークンデバッグ情報：', {
          長さ: tokenLength,
          先頭20文字: tokenStart,
          末尾20文字: tokenEnd,
          ドット数: authToken.split('.').length - 1 // JWTは通常2つのドットを含む
        });
      } else {
        console.log('トークンがありません');
      }
      
      // ★★★ 追加: 送信する認証トークンをログに出力 ★★★
      console.log('送信する認証トークン:', authToken ? authToken.substring(0, 10) + '...' : 'トークンなし');

      // FormDataを作成
      const formData = new FormData();
      formData.append('thumbnailImage', file);
      
      // API経由でアップロード（アバターと同じサーバーサイド処理を使用）
      console.log('サーバーサイドAPIを使用してアップロード開始');
      const response = await fetch('/api/thumbnail/upload', {
        method: 'POST',
        headers: {
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
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
        prompt_title: data.prompt_title || `プロンプト #${nextId}`, // 自動生成タイトル
        prompt_content: data.prompt_content,
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
        prompt_title: data.prompt_title || `プロンプト #${uniqueId}`, // 自動生成タイトル
        prompt_content: data.prompt_content,
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
        content: prompt.prompt_content 
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

                      // ★★★ 修正: 再試行時に送信する認証トークンをログに出力 ★★★
                      console.log('再試行時に送信する認証トークン:', retryAuthToken ? retryAuthToken.substring(0, 10) + '...' : 'トークンなし');

                      // API経由でアップロード
                      const retryResponse = await fetch('/api/thumbnail/upload', {
                        method: 'POST',
                        headers: {
                          // ★★★ 修正: 再取得したトークンを使用 ★★★
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
          
          // Stripe-syncAPIを呼び出し
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;

          // Stripe-syncAPIを呼び出し
          const stripeResponse = await fetch('/api/proxy/stripe-sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken || ''}`, // 認証ヘッダーを追加
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
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
          <div className="w-full max-w-3xl mb-6 p-4 bg-red-50 border border-red-200 rounded-md shadow-sm">
            <p className="text-red-800">
              現在ログインしていません。プロンプトの投稿にはログインが必要です。
              <a href="/Login" className="underline text-blue-600 font-bold ml-1">ログイン</a>して投稿してください。
            </p>
          </div>
        )}
        
        {/* プロジェクト設定フォーム */}
        {!isAnonymousSubmission && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8 overflow-hidden">
            <ProjectSettingsForm
              onSave={handleProjectSave}
              defaultValues={projectSettings}
              categories={categories}
              isLoadingCategories={isLoadingCategories}
              onRefreshCategories={fetchCategories}
            />
          </div>
        )}
        
        {/* プロンプト履歴 */}
        {!isAnonymousSubmission && showHistory && prompts.length > 0 && (
          <div className="mb-8">
            <PromptHistory
              prompts={prompts}
              onEditPrompt={handleEditPrompt}
            />
          </div>
        )}
        
        {/* プロンプト入力フォーム */}
        {!isAnonymousSubmission && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8 overflow-hidden">
            <PromptForm
              onSubmit={handlePromptSubmit}
              initialPromptNumber={promptNumber}
              aiModel={projectSettings.aiModel}
              modelLabel={getModelLabel(projectSettings.aiModel)}
            />
          </div>
        )}
        
        {/* プロジェクト投稿ボタン */}
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={submitProject}
            className="bg-black hover:bg-gray-800 text-white px-6 py-2"
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