import React, { useState } from 'react';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/use-toast';
import Header from '../components/Header';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const Feedback = () => {
  const [feedbackType, setFeedbackType] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackType) {
      toast({
        title: "種類を選択してください",
        variant: "destructive",
      });
      return;
    }
    
    if (!message.trim()) {
      toast({
        title: "フィードバック内容を入力してください",
        variant: "destructive",
      });
      return;
    }
    
    // 送信中状態に設定
    setIsSubmitting(true);
    
    // 実際のAPI送信の代わりに、送信成功をシミュレーション
    setTimeout(() => {
      toast({
        title: "フィードバックを送信しました",
        description: "ご意見ありがとうございます。検討させていただきます。",
      });
      
      // フォームをリセット
      setFeedbackType('');
      setEmail('');
      setMessage('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-2">フィードバック</h1>
          <p className="text-gray-500 mb-6">
            promptyをより良くするためのご意見・ご要望をお聞かせください。いただいた内容は今後のサービス改善に活用させていただきます。
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="feedback-type" className="block text-sm font-medium">
                フィードバックの種類 <span className="text-red-500">*</span>
              </label>
              <Select value={feedbackType} onValueChange={setFeedbackType}>
                <SelectTrigger id="feedback-type" className="w-full">
                  <SelectValue placeholder="種類を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="bug">バグ報告</SelectItem>
                    <SelectItem value="feature">機能リクエスト</SelectItem>
                    <SelectItem value="improvement">改善提案</SelectItem>
                    <SelectItem value="question">質問</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                メールアドレス（任意）
              </label>
              <Input
                id="email"
                type="email"
                placeholder="返信が必要な場合はメールアドレスを入力してください"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                ※返信が必要な場合のみ入力してください。個別のお問い合わせには対応できない場合があります。
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-medium">
                フィードバック内容 <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="message"
                placeholder="具体的な内容をお書きください"
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-y"
              />
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full md:w-auto bg-black hover:bg-gray-800"
                disabled={isSubmitting}
              >
                {isSubmitting ? '送信中...' : '送信する'}
              </Button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h2 className="text-lg font-semibold mb-4">よくある質問</h2>
            <ul className="space-y-3">
              <li>
                <h3 className="font-medium">Q: フィードバックはどのように活用されますか？</h3>
                <p className="text-sm text-gray-600 mt-1">
                  A: いただいたフィードバックは開発チームによって確認され、サービス改善のための貴重な情報として活用されます。
                </p>
              </li>
              <li>
                <h3 className="font-medium">Q: 返信はありますか？</h3>
                <p className="text-sm text-gray-600 mt-1">
                  A: 基本的に個別の返信は行っておりませんが、メールアドレスを記入いただいた場合で、詳細の確認が必要な内容については返信させていただく場合があります。
                </p>
              </li>
              <li>
                <h3 className="font-medium">Q: バグを報告する際に必要な情報は何ですか？</h3>
                <p className="text-sm text-gray-600 mt-1">
                  A: 発生した問題、再現手順、お使いのデバイスやブラウザの情報をできるだけ詳しくお書きいただけると調査がスムーズに進みます。
                </p>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Feedback; 