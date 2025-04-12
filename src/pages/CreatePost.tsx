import React, { useState, useEffect, useRef } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Image, Upload, XCircle, Clock, ChevronDown, ChevronUp, Hash, HelpCircle, Lightbulb, CheckCircle, Send, Link } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

// プロンプト履歴の型定義
interface Prompt {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
}

// プロジェクト設定の型定義
interface ProjectSettings {
  title: string;
  aiModel: string;
  description?: string;
  thumbnail?: string;
  url?: string; // URL項目を追加
}

// 利用可能なAIモデルのリスト
const AI_MODELS = [
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5", label: "GPT-3.5" },
];

// プロンプト例
const PROMPT_EXAMPLES = [
  {
    title: "詳細な指示",
    content: "私はマーケティング担当者で、ECサイトの商品説明を作成しています。\n\n以下の商品について、ターゲット層は30代女性で、季節感と使いやすさを強調した300字程度の商品説明文を作成してください。\n\n商品: シルク素材の長袖ブラウス\n特徴: パールボタン、襟付き、オフィスカジュアル\n価格帯: 8,000円\n季節: 秋向け"
  },
  {
    title: "修正指示",
    content: "前回の内容をベースに以下の修正をお願いします。\n\n1. もう少しカジュアルな表現に変更\n2. 「特別な日に」という表現を「日常使いに」に変更\n3. 文字数を200字程度に短縮"
  },
  {
    title: "フォーマット指定",
    content: "以下の形式で出力してください。\n\n## タイトル\n[キャッチコピー]\n\n### 特徴\n- 特徴1\n- 特徴2\n- 特徴3\n\n### おすすめポイント\n[本文]\n\n### 使用シーン\n[シーンの説明]"
  }
];

// プロジェクトフォームスキーマにURLを追加
const projectFormSchema = z.object({
  projectTitle: z.string().min(1, "プロジェクトタイトルを入力してください"),
  aiModel: z.string().min(1, "AIモデルを選択してください"),
  projectDescription: z.string().optional(),
  thumbnail: z.string().optional(),
  projectUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")), // URL検証を追加
});

const promptFormSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  content: z.string().min(1, "プロンプト内容を入力してください"),
  promptNumber: z.number().min(1, "プロンプト番号は1以上である必要があります"),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;
type PromptFormValues = z.infer<typeof promptFormSchema>;
const CreatePost = () => {
  const navigate = useNavigate();
  const [wordCount, setWordCount] = useState(0);
  const [promptNumber, setPromptNumber] = useState(1);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [isProjectSaved, setIsProjectSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // プロジェクト設定フォーム
  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      projectTitle: "新しいプロンプトプロジェクト",
      aiModel: "claude-3-5-sonnet",
      projectDescription: "",
      thumbnail: "",
      projectUrl: "", // URL項目のデフォルト値を追加
    },
  });
  
  // プロンプト入力フォーム
  const promptForm = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      title: "",
      content: "",
      promptNumber: promptNumber,
    },
  });

  // プロンプト番号が変更されたらフォームの値も更新
  useEffect(() => {
    promptForm.setValue("promptNumber", promptNumber);
  }, [promptNumber, promptForm]);

  const onProjectSubmit = (data: ProjectFormValues) => {
    console.log("Project settings updated:", data);
    // ここでプロジェクト設定を保存
    setIsProjectSaved(true);
    alert("プロジェクト設定が保存されました");
  };

  const onPromptSubmit = (data: PromptFormValues) => {
    console.log("Prompt submitted:", data);
    
    // 新しいプロンプトを追加
    const newPrompt: Prompt = {
      id: promptNumber,
      title: data.title,
      content: data.content,
      createdAt: new Date()
    };
    
    setPrompts([...prompts, newPrompt]);
    
    // 次のプロンプト番号を設定
    setPromptNumber(promptNumber + 1);
    
    // フォームをリセット
    promptForm.reset({
      title: "",
      content: "",
      promptNumber: promptNumber + 1,
    });
    
    // 成功メッセージ
    alert(`プロンプト #${data.promptNumber} が追加されました`);
  };

  // プロジェクト全体を投稿
  const submitProject = () => {
    if (prompts.length === 0) {
      alert("少なくとも1つのプロンプトを追加してください");
      return;
    }
    
    const projectData = {
      ...projectForm.getValues(),
      prompts: prompts,
      thumbnail: thumbnailPreview
    };
    
    console.log("プロジェクト全体を投稿:", projectData);
    
    // ここでバックエンドにプロジェクト全体を送信する処理
    alert("プロジェクトが投稿されました");
    navigate("/");
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    promptForm.setValue("content", content);
    setWordCount(content.length);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setThumbnailPreview(result);
        projectForm.setValue("thumbnail", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearThumbnail = () => {
    setThumbnailPreview(null);
    projectForm.setValue("thumbnail", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const applyPromptExample = (example: typeof PROMPT_EXAMPLES[0]) => {
    promptForm.setValue("title", example.title);
    promptForm.setValue("content", example.content);
    setWordCount(example.content.length);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const getModelLabel = (modelValue: string) => {
    const model = AI_MODELS.find(m => m.value === modelValue);
    return model ? model.label : modelValue;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-black"
          >
            ← 戻る
          </button>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowGuide(!showGuide)}
              className="border-gray-300 text-black text-sm"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              ガイド
            </Button>
            {prompts.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setShowHistory(!showHistory)}
                className="border-gray-300 text-black text-sm"
              >
                {showHistory ? "履歴を隠す" : "履歴を表示"}
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={projectForm.handleSubmit(onProjectSubmit)}
              className="border-gray-300 text-black text-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              設定を保存
            </Button>
          </div>
        </div>
        
        {/* プロジェクト設定 */}
        <div className="mb-8 border border-gray-200 rounded-lg bg-white p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-black">プロジェクト設定</h2>
            {isProjectSaved && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                保存済み
              </div>
            )}
          </div>
          
          <Form {...projectForm}>
            <form className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* プロジェクトサムネイル */}
                <div className="w-full lg:w-36">
                  <FormLabel className="text-gray-700 mb-2 block text-sm">プロジェクトサムネイル</FormLabel>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-32 h-32 border border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {thumbnailPreview ? (
                        <img 
                          src={thumbnailPreview} 
                          alt="サムネイルプレビュー" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 lg:hidden">
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-gray-300 text-gray-700 text-xs py-1 h-7"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        画像選択
                      </Button>
                      
                      {thumbnailPreview && (
                        <Button 
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearThumbnail}
                          className="border-gray-300 text-gray-700 px-2 py-1 h-7"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          削除
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  
                  <div className="hidden lg:flex gap-1 mt-2">
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-gray-300 text-gray-700 text-xs py-1 h-7 w-full"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      画像選択
                    </Button>
                    
                    {thumbnailPreview && (
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearThumbnail}
                        className="border-gray-300 text-gray-700 px-2 py-1 h-7"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* プロジェクト情報 */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <FormField
                      control={projectForm.control}
                      name="projectTitle"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-gray-700">プロジェクトタイトル</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="プロジェクトタイトル"
                              className="border-gray-300"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={projectForm.control}
                      name="aiModel"
                      render={({ field }) => (
                        <FormItem className="w-full md:w-48">
                          <FormLabel className="text-gray-700">使用AIモデル</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="border-gray-300 bg-white">
                              <SelectValue placeholder="AIモデル選択" />
                            </SelectTrigger>
                            <SelectContent>
                              {AI_MODELS.map((model) => (
                                <SelectItem key={model.value} value={model.value}>
                                  {model.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* URLフィールドを追加 */}
                  <FormField
                    control={projectForm.control}
                    name="projectUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">プロジェクトURL（任意）</FormLabel>
                        <FormControl>
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <div className="flex items-center justify-center border-r border-gray-300 h-10 w-10 bg-gray-50 text-gray-400">
                              <Link className="h-4 w-4" />
                            </div>
                            <Input
                              placeholder="https://example.com"
                              className="border-0 rounded-none focus:ring-0"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        {projectForm.formState.errors.projectUrl && (
                          <p className="text-xs text-red-600 mt-1">
                            {projectForm.formState.errors.projectUrl.message}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={projectForm.control}
                    name="projectDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">プロジェクト概要</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="このプロジェクトの目的や概要を入力してください"
                            className="h-20 border-gray-300 resize-none"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>
        
        {/* プロンプト作成ガイド */}
        {showGuide && (
          <div className="mb-6 border border-gray-200 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center mb-2">
              <Lightbulb className="h-5 w-5 text-gray-700 mr-2" />
              <h3 className="text-lg font-medium text-gray-800">効果的なプロンプトの書き方</h3>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-gray-700 hover:text-black">
                  基本のプロンプト構造
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600">
                  <ol className="list-decimal pl-5 space-y-2">
                    <li><strong>コンテキスト</strong>: あなたの立場や状況を説明</li>
                    <li><strong>指示</strong>: 具体的に何をしてほしいかを明確に</li>
                    <li><strong>情報</strong>: 必要な情報を箇条書きなどで整理</li>
                    <li><strong>フォーマット</strong>: 希望する回答の形式や長さ</li>
                    <li><strong>例</strong>: 必要に応じて例を提示</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-gray-700 hover:text-black">
                  プロンプト改善のコツ
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>一度に複数の質問や指示を出すよりも、ステップバイステップで進めるほうが効果的です</li>
                    <li>「〜を避けてください」よりも「〜をしてください」という肯定的な表現のほうが良い結果になります</li>
                    <li>詳細を具体的に指定するほど、期待通りの回答を得られやすくなります</li>
                    <li>長すぎるプロンプトは逆効果になることがあります。簡潔さと詳細さのバランスを心がけましょう</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-gray-700 hover:text-black">
                  プロンプト例
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {PROMPT_EXAMPLES.map((example, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-3 bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-800">{example.title}</h4>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => applyPromptExample(example)}
                            className="text-xs border-gray-300"
                          >
                            適用
                          </Button>
                        </div>
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap">{example.content}</pre>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
        
        {/* プロンプト履歴 */}
        {showHistory && prompts.length > 0 && (
          <div className="mb-6 border border-gray-200 rounded-lg bg-white p-4">
            <h3 className="text-lg font-medium mb-4 text-black">プロンプト履歴</h3>
            <div className="space-y-4">
              {prompts.map((prompt, index) => (
                <div key={prompt.id} className="relative">
                  {/* 左側のタイムライン */}
                  <div className="absolute left-2 sm:left-4 top-0 bottom-0 flex flex-col items-center">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-black text-white font-medium shadow-sm z-10">
                      {prompt.id}
                    </div>
                    {index < prompts.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-300 my-1"></div>
                    )}
                  </div>
                  
                  {/* プロンプト内容 */}
                  <div className="ml-12 sm:ml-16 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <h4 className="font-medium text-black">{prompt.title}</h4>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(prompt.createdAt)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{prompt.content}</p>
                    
                    <div className="flex justify-end mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-xs text-gray-600 hover:text-black"
                        onClick={() => {
                          // 過去のプロンプトを現在のフォームに読み込む
                          promptForm.setValue("title", prompt.title);
                          promptForm.setValue("content", prompt.content);
                          setWordCount(prompt.content.length);
                        }}
                      >
                        このプロンプトを編集
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 現在のプロンプトへの接続線 */}
              {prompts.length > 0 && (
                <div className="relative h-8">
                  <div className="absolute left-2 sm:left-4 top-0 bottom-0 flex flex-col items-center">
                    <div className="w-0.5 h-full bg-gray-300"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 新規プロンプト入力フォーム */}
        <Form {...promptForm}>
          <form onSubmit={promptForm.handleSubmit(onPromptSubmit)} className="space-y-8">
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
              {/* ヘッダー: プロンプト番号と使用AIモデル表示 */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-black text-white font-medium shadow-sm mr-4">
                    {promptNumber}
                  </div>
                  <h3 className="text-lg font-medium text-black">新しいプロンプト</h3>
                </div>
                
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                  {getModelLabel(projectForm.watch("aiModel"))}
                </div>
              </div>
              
              {/* タイトルと番号調整 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <FormField
                  control={promptForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="flex-1 w-full">
                      <FormControl>
                        <Input
                          placeholder="プロンプトのタイトル"
                          className="text-lg font-medium border-gray-300"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button 
                    type="button"
                    onClick={() => promptNumber > 1 && setPromptNumber(promptNumber - 1)}
                    className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                    disabled={promptNumber <= 1}
                  >
                    <ChevronDown size={16} />
                  </button>
                  <div className="flex items-center px-2">
                    <Hash className="h-4 w-4 text-gray-500 mr-1" />
                    <input
                      type="number"
                      value={promptNumber}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          setPromptNumber(value);
                        }
                      }}
                      className="w-8 text-center border-none focus:outline-none"
                      min="1"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setPromptNumber(promptNumber + 1)}
                    className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                  >
                    <ChevronUp size={16} />
                  </button>
                </div>
              </div>
              
              {/* プロンプト内容 */}
              <FormField
                control={promptForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="AIに送信するプロンプト内容を入力してください..."
                        className="min-h-[200px] border-gray-300 resize-none"
                        onChange={handleContentChange}
                        value={field.value}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between items-center text-sm text-gray-500 mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    プロンプト #{promptNumber}
                  </span>
                </div>
                <div>
                  {wordCount} 文字
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500 italic">
                このプロンプトは {getModelLabel(projectForm.watch("aiModel"))} に送信されます
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  type="submit"
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  プロンプトを追加
                </Button>
                <Button 
                  onClick={submitProject}
                  className="bg-black hover:bg-gray-800 text-white"
                  disabled={prompts.length === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  プロジェクトを投稿
                </Button>
              </div>
            </div>
          </form>
        </Form>
        
        {/* プロンプト作成のヒント（フォーム下部に表示） */}
        {!showGuide && (
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setShowGuide(true)}
              className="text-gray-500 hover:text-black"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              効果的なプロンプトの書き方を見る
            </Button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default CreatePost;