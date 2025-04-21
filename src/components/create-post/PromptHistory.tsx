import React from 'react';
import { Button } from "@/components/ui/button";
import { Clock } from 'lucide-react';

// プロンプト履歴の型定義
export interface Prompt {
  id: number;
  prompt_title: string;
  prompt_content: string;
  createdAt: Date;
}

interface PromptHistoryProps {
  prompts: Prompt[];
  onEditPrompt: (prompt: Prompt) => void;
}

const PromptHistory: React.FC<PromptHistoryProps> = ({ prompts, onEditPrompt }) => {
  // 時間のフォーマット関数
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  if (prompts.length === 0) {
    return null;
  }

  return (
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
                <h4 className="font-medium text-black">{prompt.prompt_title}</h4>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(prompt.createdAt)}
                </div>
              </div>
              
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{prompt.prompt_content}</p>
              
              <div className="flex justify-end mt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs text-gray-600 hover:text-black"
                  onClick={() => onEditPrompt(prompt)}
                >
                  このプロンプトを編集
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {/* 現在のプロンプトへの接続線 */}
        <div className="relative h-8">
          <div className="absolute left-2 sm:left-4 top-0 bottom-0 flex flex-col items-center">
            <div className="w-0.5 h-full bg-gray-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptHistory; 