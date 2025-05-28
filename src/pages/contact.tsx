import React, { useState, ChangeEvent, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { NewContact } from '../lib/schema';
import Head from 'next/head';
import Footer from '../components/footer';
import { useRouter } from 'next/router';
import { ChevronLeft, Send, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/auth-context';

// お問い合わせフォームのデータ型
type FormData = Omit<NewContact, 'is_read'>;

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'お名前を入力してください';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
      isValid = false;
    }

    if (!formData.subject.trim()) {
      newErrors.subject = '件名を入力してください';
      isValid = false;
    }

    if (!formData.message.trim()) {
      newErrors.message = 'メッセージを入力してください';
      isValid = false;
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'メッセージは10文字以上で入力してください';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // 入力時にエラーをクリア
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // 送信ステータスをリセット
    setSubmitStatus(null);
    
    // バリデーション
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Supabaseにデータを送信 (通常の方法)
      const { error } = await supabase.from('contacts').insert([
        {
          ...formData,
          is_read: false,
        }
      ]);
      
      // 通常のインサートが失敗したら、RPCを使用
      if (error) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('insert_contact', {
          p_name: formData.name,
          p_email: formData.email,
          p_subject: formData.subject,
          p_message: formData.message
        });
        
        // RPCも失敗した場合はエラーをスロー
        if (rpcError) throw rpcError;
        
      }
      
      // フォームをリセット
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      
      setSubmitStatus({
        success: true,
        message: 'お問い合わせありがとうございます。内容を確認次第、ご連絡いたします。'
      });
    } catch (error: any) {
      
      let errorMessage = '送信に失敗しました。お手数ですが、しばらくしてから再度お試しください。';
      
      // Supabaseエラーのハンドリング
      if (error.code === '23505') {
        errorMessage = '同じ内容のお問い合わせが既に送信されています。';
      } else if (error.code === '23503') {
        errorMessage = '入力内容に問題があります。確認して再度お試しください。';
      }
      
      setSubmitStatus({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>お問い合わせ - Prompty</title>
        <meta name="description" content="Promptyへのお問い合わせはこちらから" />
      </Head>
      
      <div className="flex min-h-screen flex-col">
        <div className="flex-1 bg-gray-50 py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <h1 className="text-3xl font-bold mb-2">お問い合わせ</h1>
              <p className="text-gray-600 mb-6">
                サービスに関するご質問、ご意見などがございましたら、下記フォームよりお気軽にお問い合わせください。
              </p>
              
              {submitStatus?.success && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
                  <p className="font-medium">{submitStatus.message}</p>
                  <p className="mt-2 text-sm">担当者より順次ご連絡いたします。今しばらくお待ちください。</p>
                </div>
              )}
              
              {submitStatus?.success === false && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                  <p className="font-medium">エラーが発生しました</p>
                  <p className="mt-1">{submitStatus.message}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block mb-2 font-medium text-gray-700">
                    お名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block mb-2 font-medium text-gray-700">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="subject" className="block mb-2 font-medium text-gray-700">
                    件名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.subject ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="message" className="block mb-2 font-medium text-gray-700">
                    メッセージ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.message ? 'border-red-500' : 'border-gray-300'
                    }`}
                  ></textarea>
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                  )}
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? '送信中...' : '送信する'}
                  </button>
                </div>
              </form>
              
              <div className="mt-10 pt-6 border-t border-gray-200">
                <h2 className="text-xl font-bold mb-4">その他のお問い合わせ方法</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700">メールでのお問い合わせ</h3>
                    <p className="text-gray-600">queue@queue-tech.jp</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700">よくある質問</h3>
                    <p className="text-gray-600">
                      <a href="/help-center" className="text-blue-600 hover:underline">
                        ヘルプセンター
                      </a>
                      でよくある質問とその回答をご確認いただけます。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
} 