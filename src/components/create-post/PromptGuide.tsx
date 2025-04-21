import React from 'react';
import { Button } from "../../components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Lightbulb } from 'lucide-react';

// プロンプト例
export const PROMPT_EXAMPLES = [
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

interface PromptGuideProps {
  onApplyExample: (example: typeof PROMPT_EXAMPLES[0]) => void;
  inDialog?: boolean; // ダイアログ内に表示される場合のプロパティ
}

const PromptGuide: React.FC<PromptGuideProps> = ({ onApplyExample, inDialog = false }) => {
  return (
    <div className={`${inDialog ? '' : 'mb-6 border border-gray-200 rounded-lg bg-gray-50'} p-4`}>
      {!inDialog && (
        <div className="flex items-center mb-2">
          <Lightbulb className="h-5 w-5 text-gray-700 mr-2" />
          <h3 className="text-lg font-medium text-gray-800">効果的なプロンプトの書き方</h3>
        </div>
      )}
      
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
                      onClick={() => onApplyExample(example)}
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
  );
};

export default PromptGuide; 