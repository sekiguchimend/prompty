
import React, { useState } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, FileText } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const formSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  content: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CreatePost = () => {
  const navigate = useNavigate();
  const [wordCount, setWordCount] = useState(0);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Form submitted:", data);
    // Here you would typically save the post to your backend
    // For now we'll just log it and redirect
    alert("投稿が保存されました");
    navigate("/");
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    form.setValue("content", content);
    setWordCount(content.length);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 戻る
          </button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => form.reset()}
              className="border-gray-300"
            >
              下書き保存
            </Button>
            <Button 
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
            >
              公開に進む
            </Button>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="記事タイトル"
                        className="text-2xl font-bold border-none shadow-none px-0 focus-visible:ring-0"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="最近、調子はどうですか？"
                        className="min-h-[200px] border-none shadow-none resize-none focus-visible:ring-0 mt-6"
                        onChange={handleContentChange}
                        value={field.value}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end text-sm text-gray-500">
                {wordCount} 文字
              </div>
            </div>
          </form>
        </Form>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreatePost;
