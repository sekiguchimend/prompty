import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle, Send } from 'lucide-react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

// まとめてインポート
import {
  ProjectSettingsForm,
  PromptGuide,
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
  const [showGuide, setShowGuide] = useState(false);
  const [projectSettings, setProjectSettings] = useState<ProjectFormValues>({
    projectTitle: "新しいプロンプトプロジェクト",
    aiModel: "claude-3-5-sonnet",
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
    
    // ここでバックエンドにプロジェクト全体を送信する処理
    alert("プロジェクトが投稿されました");
    navigate("/");
  };

  // AIモデルのラベルを取得
  const getModelLabel = (modelValue: string) => {
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
          </div>
        </div>
        
        {/* プロジェクト設定フォーム */}
        <ProjectSettingsForm
          onSave={handleProjectSave}
          defaultValues={projectSettings}
        />
        
        {/* プロンプト作成ガイド */}
        {showGuide && (
          <PromptGuide onApplyExample={applyPromptExample} />
        )}
        
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