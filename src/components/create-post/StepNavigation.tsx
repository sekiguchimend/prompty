import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

// ステップラベルの取得関数
const getStepLabel = (step: number): string => {
  switch (step) {
    case 1: return "プロジェクトタイトル";
    case 2: return "AIモデル選択";
    case 3: return "価格設定";
    case 4: return "プロジェクト説明";
    case 5: return "カテゴリ選択";
    case 6: return "サムネイル画像";
    case 7: return "プロンプト入力";
    case 8: return "確認と投稿";
    default: return `ステップ ${step}`;
  }
};

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  completedSteps,
  goToNextStep,
  goToPreviousStep
}) => {
  return (
    <div className="w-full">
      {/* ステップ進行状況 */}
      <div className="mb-8">
        <div className="flex flex-col">
          {/* 現在のステップ表示 */}
          <div className="flex items-center mb-2">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center
                bg-gray-100 text-black border-2 border-black mr-3"
            >
              <span>{currentStep}</span>
            </div>
            <span className="text-base font-bold">
              {getStepLabel(currentStep)}
            </span>
          </div>
          
          {/* 進行状況テキスト */}
          <div className="text-sm text-gray-500 mb-2">
            ステップ {currentStep} / {totalSteps}
          </div>
        </div>
        
        {/* 進行状況バー */}
        <div className="relative mt-2">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
            <div 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-black"
              style={{ width: `${(currentStep - 1) / (totalSteps - 1) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* ステップ表示（縮小版） */}
        <div className="flex justify-between mt-2 px-2">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const step = idx + 1;
            return (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`w-3 h-3 rounded-full
                    ${step < currentStep || completedSteps.has(step)
                      ? 'bg-gray-800'
                      : step === currentStep
                        ? 'bg-black'
                        : 'bg-gray-300'}`}
                ></div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* ナビゲーションボタン */}
      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === 1}
          className="border-gray-300 text-black"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> 前のステップ
        </Button>
        
        {currentStep < totalSteps && (
          <Button
            variant="outline"
            onClick={goToNextStep}
            disabled={!completedSteps.has(currentStep)}
            className={`${completedSteps.has(currentStep) ? 'border-black text-black' : 'border-gray-300 text-gray-400'}`}
          >
            次のステップ <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default StepNavigation; 