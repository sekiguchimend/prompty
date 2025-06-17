import React, { useState, useEffect } from 'react';
import { FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { PlusCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { useToast } from "../../components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from '../../lib/supabaseClient';

// カテゴリの型定義
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
}

// 新規カテゴリフォームのスキーマ
const newCategorySchema = z.object({
  name: z.string().min(2, "カテゴリ名は2文字以上入力してください"),
  description: z.string().optional(),
});

type NewCategoryFormValues = z.infer<typeof newCategorySchema>;

interface CategorySelectorProps {
  control: any;
  categories: Category[];
  isLoading: boolean;
  onRefresh: () => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  control,
  categories,
  isLoading,
  onRefresh
}) => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  
  // 新規カテゴリ作成フォーム
  const createCategoryForm = useForm<NewCategoryFormValues>({
    resolver: zodResolver(newCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    }
  });

  // カテゴリ名からスラッグを生成（URLセーフな文字列）
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  // 新規カテゴリ作成処理
  const handleCreateCategory = async (data: NewCategoryFormValues) => {
    setIsCreating(true);
    try {
      // スラッグを生成
      const slug = generateSlug(data.name);
      
      // 認証トークンを取得
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('ログインが必要です。ログイン状態を確認してください。');
      }
      
      // APIを使用してカテゴリを作成する
      const response = await fetch('/api/categories/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: data.name,
          slug: slug,
          description: data.description || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'カテゴリの作成に失敗しました');
      }
      
      const result = await response.json();
      
      toast({
        title: "カテゴリ作成完了",
        description: `「${data.name}」カテゴリを作成しました`,
        variant: "default",
      });
      
      // ダイアログを閉じる
      setIsCreateDialogOpen(false);
      
      // フォームをリセット
      createCategoryForm.reset();
      
      // カテゴリ一覧を更新
      onRefresh();
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "カテゴリ作成中に問題が発生しました",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <FormField
        control={control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            {/* <FormLabel className="text-gray-700">カテゴリ</FormLabel> */}
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Select
                  value={field.value || ""}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className="border-gray-300 bg-white">
                    <SelectValue placeholder={isLoading ? "読み込み中..." : "カテゴリを選択"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                className="border-gray-300 h-10"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">新規作成</span>
              </Button>
            </div>
          </FormItem>
        )}
      />

      {/* 新規カテゴリ作成ダイアログ */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>新規カテゴリの作成</DialogTitle>
            <DialogDescription>
              新しいカテゴリを作成します。カテゴリ名は必須です。
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={createCategoryForm.handleSubmit(handleCreateCategory)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  カテゴリ名
                </label>
                <Input
                  id="name"
                  placeholder="例: プログラミング、画像生成、etc."
                  className="border-gray-300"
                  {...createCategoryForm.register("name")}
                />
                {createCategoryForm.formState.errors.name && (
                  <p className="text-xs text-red-600 mt-1">
                    {createCategoryForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  説明（任意）
                </label>
                <Input
                  id="description"
                  placeholder="カテゴリの簡単な説明"
                  className="border-gray-300"
                  {...createCategoryForm.register("description")}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    作成中...
                  </>
                ) : (
                  "作成する"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CategorySelector; 