import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/use-toast';
import Footer from '../components/footer';
import { supabase } from '../lib/supabaseClient';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { CheckCircle2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// サーバーサイドレンダリングを無効化
const MotionDiv = dynamic(() => import('framer-motion').then(mod => ({ 
  default: mod.motion.div 
})), { ssr: false });

const MotionH1 = dynamic(() => import('framer-motion').then(mod => ({ 
  default: mod.motion.h1 
})), { ssr: false });

const MotionP = dynamic(() => import('framer-motion').then(mod => ({ 
  default: mod.motion.p 
})), { ssr: false });

// フィードバックのタイプ定義
interface FeedbackData {
  feedback_type: string;
  email?: string;
  message: string;
  is_read?: boolean;
}

const Feedback = () => {
  const [feedbackType, setFeedbackType] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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
    
    // フィードバックデータを構築
    const feedbackData: FeedbackData = {
      feedback_type: feedbackType,
      message: message.trim(),
      is_read: false // 初期値は未読
    };
    
    // メールアドレスが入力されている場合のみ追加
    if (email.trim()) {
      feedbackData.email = email.trim();
    }
    
    try {
      // まず標準のinsertを試す
      const { error } = await supabase
        .from('feedback')
        .insert([feedbackData as unknown as Record<string, unknown>]);
      
      if (error) {
        // 通常のinsertが失敗した場合はRPCを試す
        const { error: rpcError } = await supabase.rpc('insert_feedback', {
          p_feedback_type: feedbackData.feedback_type,
          p_email: feedbackData.email || null,
          p_message: feedbackData.message,
          p_is_read: false
        });
        
        if (rpcError) throw rpcError;
      }
      
      // 送信成功
      setIsSubmitted(true);
      
      // フォームをリセット
      setFeedbackType('');
      setEmail('');
      setMessage('');
    } catch (error: any) {
      toast({
        title: "送信に失敗しました",
        description: error.message || "通信エラーが発生しました。しばらく経ってからもう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
  };

  // 送信完了画面
  if (isSubmitted) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 container max-w-3xl mx-auto px-4 py-12 flex items-center justify-center">
          <MotionDiv 
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <MotionDiv
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </MotionDiv>
            
            <MotionH1 
              className="text-2xl font-bold mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              フィードバックを送信しました
            </MotionH1>
            
            <MotionP 
              className="text-gray-600 mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              貴重なご意見ありがとうございます。<br />
              いただいたフィードバックはサービス改善に活用させていただきます。
            </MotionP>
            
            <MotionDiv
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                onClick={handleReset}
                className="mr-4 bg-black hover:bg-gray-800"
              >
                新しいフィードバックを送信
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                ホームに戻る
              </Button>
            </MotionDiv>
          </MotionDiv>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
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
                {isSubmitting ? '送信中...' : 'フィードバックを送信'}
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
      
      <Footer />
    </div>
  );
};

export default Feedback; 
