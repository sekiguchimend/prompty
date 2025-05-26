import React from 'react';
import { Button } from "../ui/button";
import { Clock, FileText, Edit, History } from 'lucide-react';

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
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
          <History className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">プロンプト履歴</h3>
          <p className="text-sm text-gray-600">今回のセッションで作成したプロンプト一覧</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {prompts.map((prompt, index) => (
          <div key={`prompt-${prompt.id}-${index}`} className="relative group animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 overflow-hidden">
              {/* ヘッダー部分 */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-sm group-hover:scale-110 transition-transform duration-300">
                      #{prompt.id}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 group-hover:text-orange-700 transition-colors duration-300">
                        {prompt.prompt_title}
                      </h4>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(prompt.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">保存済み</span>
                  </div>
                </div>
              </div>

              {/* コンテンツ部分 */}
              <div className="p-4">
                <div className="bg-gray-50 rounded p-3 border border-gray-200 max-h-32 overflow-y-auto group-hover:bg-gray-100 transition-colors duration-300">
                  <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed font-mono">{prompt.prompt_content}</p>
                </div>
                
                {/* アクションボタン */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {prompt.prompt_content.length} 文字
                    </span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-orange-700 border-orange-300 hover:bg-orange-50 flex items-center hover:scale-105 transition-all duration-300 text-xs"
                    onClick={() => onEditPrompt(prompt)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    このプロンプトを編集
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* 現在のプロンプトへの接続線 */}
        <div className="flex justify-center py-4">
          <div className="w-px h-8 bg-gradient-to-b from-orange-300 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default PromptHistory; 