import React from 'react';
import { Button } from "@/components/ui/button";
import { Clock, FileText, Edit, History, Download } from 'lucide-react';

// プロンプト履歴の型定義
export interface Prompt {
  id: number;
  prompt_title: string;
  prompt_content: string;
  yaml_content?: string;
  file_content?: string;
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

  // YAMLファイルをダウンロード
  const handleDownloadYaml = (yaml_content: string, promptId: number) => {
    if (!yaml_content) return;
    
    const blob = new Blob([yaml_content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt_${promptId}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
        {prompts.map((prompt, index) => (
        <div key={`prompt-${prompt.id}-${index}`} className="relative group animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${index * 100}ms` }}>
          {/* タイムライン接続線 */}
          <div className="absolute left-5 top-0 bottom-0 flex flex-col items-center">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-600 text-white font-bold text-xs shadow-md z-10 group-hover:scale-110 group-hover:bg-orange-700 transition-all duration-300">
                {prompt.id}
              </div>
              {index < prompts.length - 1 && (
              <div className="w-0.5 h-full bg-orange-300 my-1 group-hover:bg-orange-400 transition-colors duration-300"></div>
              )}
            </div>
            
          {/* プロンプト内容カード */}
          <div className="ml-16 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 overflow-hidden group">
            {/* カードヘッダー */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 group-hover:bg-orange-50 transition-colors duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-semibold text-gray-900 text-base flex items-center group-hover:text-orange-700 transition-colors duration-300">
                  <FileText className="h-4 w-4 mr-2 text-blue-600 group-hover:text-orange-600 transition-colors duration-300" />
                  {prompt.prompt_title}
                </h4>
                <div className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full group-hover:bg-orange-100 group-hover:text-orange-700 transition-colors duration-300">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(prompt.createdAt)}
                </div>
                </div>
              </div>
              
            {/* プロンプト内容 */}
            <div className="p-4">
              <div className="bg-gray-50 rounded p-3 border border-gray-200 max-h-32 overflow-y-auto group-hover:bg-gray-100 transition-colors duration-300">
                <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed font-mono">{prompt.prompt_content}</p>
              </div>
              
              {/* アクションボタン */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                {prompt.yaml_content && (
                  <Button 
                      variant="outline" 
                    size="sm"
                      className="text-green-700 border-green-300 hover:bg-green-50 flex items-center text-xs hover:scale-105 transition-all duration-300"
                    onClick={() => handleDownloadYaml(prompt.yaml_content!, prompt.id)}
                  >
                      <Download className="h-3 w-3 mr-1" />
                      YAML保存
                  </Button>
                )}
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
      <div className="relative h-6 animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${prompts.length * 100}ms` }}>
        <div className="absolute left-5 top-0 bottom-0 flex flex-col items-center">
          <div className="w-0.5 h-full bg-orange-300"></div>
        </div>
        <div className="ml-16">
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200 inline-flex items-center hover:bg-blue-50 hover:border-blue-300 transition-colors duration-300">
            ⬇️ 新しいプロンプトをここに追加
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptHistory; 