import React from 'react';
import { Button } from '../ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Type, 
  Bot, 
  DollarSign, 
  FileText, 
  Tag, 
  Image, 
  MessageSquare, 
  Send 
} from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

// ステップ情報の定義
interface StepInfo {
  label: string;
  icon: any;
  color: string;
  bgColor: string;
}

const stepInfoMap: Record<number, StepInfo> = {
  1: { label: "タイトル", icon: Type, color: "text-blue-600", bgColor: "bg-blue-50" },
  2: { label: "AIモデル", icon: Bot, color: "text-purple-600", bgColor: "bg-purple-50" },
  3: { label: "価格", icon: DollarSign, color: "text-green-600", bgColor: "bg-green-50" },
  4: { label: "説明", icon: FileText, color: "text-orange-600", bgColor: "bg-orange-50" },
  5: { label: "カテゴリ", icon: Tag, color: "text-red-600", bgColor: "bg-red-50" },
  6: { label: "サムネイル", icon: Image, color: "text-pink-600", bgColor: "bg-pink-50" },
  7: { label: "プロンプト", icon: MessageSquare, color: "text-indigo-600", bgColor: "bg-indigo-50" },
  8: { label: "投稿", icon: Send, color: "text-teal-600", bgColor: "bg-teal-50" },
};

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  completedSteps,
  goToNextStep,
  goToPreviousStep
}) => {
  const currentStepInfo = stepInfoMap[currentStep];
  const CurrentIcon = currentStepInfo?.icon || MessageSquare;

  return (
    <div className="w-full">
      {/* 現在のステップヘッダー */}
      <div className={`rounded-xl border border-gray-200 shadow-sm p-6 mb-6 ${currentStepInfo?.bgColor || 'bg-gray-50'}`}>
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center ${currentStepInfo?.color || 'text-gray-600'} shadow-sm`}>
            <CurrentIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentStepInfo?.label || `ステップ ${currentStep}`}
            </h2>
            <p className="text-sm text-gray-600">
              ステップ {currentStep} / {totalSteps}
            </p>
          </div>
        </div>
        
        {/* 進行状況バー */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>進行状況</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gray-800 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ステップ一覧 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const step = idx + 1;
            const stepInfo = stepInfoMap[step];
            const Icon = stepInfo?.icon || MessageSquare;
            const isCompleted = completedSteps.has(step);
            const isCurrent = step === currentStep;
            
            return (
              <div 
                key={step} 
                className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
                  isCurrent 
                    ? stepInfo?.bgColor || 'bg-gray-50'
                    : isCompleted 
                      ? 'bg-gray-100' 
                      : 'bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-2 ${
                  isCurrent
                    ? `border-gray-300 ${stepInfo?.color || 'text-gray-800'} bg-white shadow-sm`
                    : isCompleted
                      ? 'border-gray-300 bg-gray-800 text-white'
                      : 'border-gray-200 text-gray-400 bg-white'
                }`}>
                  {isCompleted && !isCurrent ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className={`text-xs text-center font-medium leading-tight ${
                  isCurrent
                    ? 'text-gray-900'
                    : isCompleted
                      ? 'text-gray-700'
                      : 'text-gray-400'
                }`}>
                  {stepInfo?.label.split(' ').map((word, i) => (
                    <div key={i}>{word}</div>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* ナビゲーションボタン */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === 1}
          className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          前のステップ
        </Button>
        
        <div className="flex items-center space-x-3">
          {completedSteps.has(currentStep) && currentStep < totalSteps && (
            <div className="flex items-center text-green-600 text-sm font-medium">
              <CheckCircle className="h-4 w-4 mr-1" />
              完了
            </div>
          )}
          
          {currentStep < totalSteps && (
            <Button
              variant="outline"
              onClick={goToNextStep}
              disabled={!completedSteps.has(currentStep)}
              className={`${
                completedSteps.has(currentStep) 
                  ? 'border-gray-800 text-gray-800 hover:bg-gray-50' 
                  : 'border-gray-300 text-gray-400 cursor-not-allowed'
              }`}
            >
              次のステップ
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepNavigation; 