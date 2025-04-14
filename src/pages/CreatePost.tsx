import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle, Send } from 'lucide-react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

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
} from '@/components/create-post';

const CreatePost = () => {
  const navigate = useNavigate();
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
  
  // プロジェクト設定の保存
  const handleProjectSave = (data: ProjectFormValues) => {
    console.log("Project settings updated:", data);
    setProjectSettings(data);
    alert("プロジェクト設定が保存されました");
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
    alert(`プロンプト #${data.promptNumber} が追加されました`);
  };

  // 既存プロンプトの編集
  const handleEditPrompt = (prompt: Prompt) => {
    // 編集は新しいプロンプトとして追加する形で実装
    setPromptNumber(prompt.id);
  };

  // プロンプト例の適用
  const applyPromptExample = (example: typeof PROMPT_EXAMPLES[0]) => {
    // プロンプトフォームは子コンポーネントで管理するため、ここでは何もしない
    // 実際の処理はPromptFormコンポーネントに委譲
  };

  // プロジェクト全体を投稿
  const submitProject = () => {
    if (prompts.length === 0) {
      alert("少なくとも1つのプロンプトを追加してください");
      return;
    }
    
    const projectData = {
      ...projectSettings,
      prompts: prompts
    };
    
    console.log("プロジェクト全体を投稿:", projectData);
    
    // 料金情報の表示
    const priceInfo = projectSettings.pricingType === "paid" 
      ? `${projectSettings.price}円` 
      : "無料";
    
    // ここでバックエンドにプロジェクト全体を送信する処理
    alert(`プロジェクトが投稿されました（${priceInfo}）`);
    navigate("/");
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
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-black"
          >
            ← 戻る
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
            disabled={prompts.length === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            プロジェクトを投稿
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreatePost;