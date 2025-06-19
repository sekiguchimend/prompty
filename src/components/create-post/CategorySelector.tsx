import React, { useState, useEffect } from 'react';
import { FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { PlusCircle, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { useToast } from "../../components/ui/use-toast";
import { useForm, Control, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from '../../lib/supabaseClient';
import { categoryCache, type Category } from '../../lib/cache/category-cache';

// Categoryの型はcategory-cacheからエクスポート
export type { Category };

// 新規カテゴリフォームのスキーマ（カテゴリ名のみ）
const newCategorySchema = z.object({
  name: z.string().min(2, "カテゴリ名は2文字以上入力してください"),
});

type NewCategoryFormValues = z.infer<typeof newCategorySchema>;

interface CategorySelectorProps {
  control: Control<any>;
  setValue?: (name: string, value: any, options?: any) => void;
  categories: Category[];
  isLoading: boolean;
  onRefresh: () => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  control,
  setValue,
  categories,
  isLoading,
  onRefresh
}) => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState<any>(null);
  const [internalValue, setInternalValue] = useState<string>("");
  
  // 上位5つのカテゴリを取得（人気順）（メモ化で最適化）
  const topCategories = React.useMemo(() => categories.slice(0, 5), [categories]);
  
  // 検索結果をフィルタリング（メモ化で最適化）
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);
  
  
  // 新規カテゴリ作成フォーム
  const createCategoryForm = useForm<NewCategoryFormValues>({
    resolver: zodResolver(newCategorySchema),
    defaultValues: {
      name: "",
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
      
      // キャッシュを無効化
      categoryCache.invalidate();
      
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
        render={({ field }) => {
          // 検索ダイアログで使用するためにfieldを保存とinternalValueの同期
          React.useEffect(() => {
            setSelectedField(field);
            setInternalValue(field.value || "");
          }, [field]);

          // 選択されたカテゴリの名前を取得
          const selectedCategory = categories.find(cat => cat.id === field.value);
          const selectedCategoryName = selectedCategory?.name;

          // onValueChangeハンドラーを定義（通常の選択と検索の両方で使用）
          const handleValueChange = (value: string) => {
            console.log('🔄 CategorySelector: handleValueChange called with value:', value);
            if (value === "search_more") {
              console.log('🔍 CategorySelector: Opening search dialog');
              setIsSearchDialogOpen(true);
            } else if (value !== "" || field.value === null) {
              // 空文字列の場合は、現在値がnullの場合のみ処理（初期化時）
              // 既に値がある場合は、空文字列での上書きを防ぐ
              console.log('📝 CategorySelector: Setting category value:', value);
              console.log('📝 CategorySelector: Current field value before change:', field.value);
              
              // 内部値を更新してSelectコンポーネントの表示を制御
              setInternalValue(value);
              field.onChange(value);
              console.log('📝 CategorySelector: Field.onChange called');
              
              // setValueがあれば、それも呼び出してフォームの状態を確実に更新
              if (setValue) {
                console.log('📝 CategorySelector: setValue function available, calling setValue');
                setValue("categoryId", value, { shouldValidate: true, shouldDirty: true });
                console.log('📝 CategorySelector: setValue called with categoryId:', value);
              } else {
                console.log('⚠️ CategorySelector: setValue function not available');
              }
            } else {
              console.log('⚠️ CategorySelector: Ignoring empty value change to prevent clearing existing selection');
            }
          };

          return (
            <FormItem>
              {/* <FormLabel className="text-gray-700">カテゴリ</FormLabel> */}
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Select
                    value={internalValue}
                    onValueChange={handleValueChange}
                    disabled={isLoading}
                  >
                  <SelectTrigger className="border-gray-300 bg-white">
                    <SelectValue 
                      placeholder={isLoading ? "読み込み中..." : "カテゴリを選択"}
                    >
                      {selectedCategoryName || (isLoading ? "読み込み中..." : "カテゴリを選択")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {/* 選択されたカテゴリーがtopCategoriesに含まれていない場合は追加表示 */}
                    {selectedCategory && !topCategories.find(cat => cat.id === selectedCategory.id) && (
                      <SelectItem key={selectedCategory.id} value={selectedCategory.id}>
                        {selectedCategory.name}
                      </SelectItem>
                    )}
                    {topCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="search_more" className="text-blue-600 font-medium">
                      <div className="flex items-center">
                        <Search className="h-4 w-4 mr-2" />
                        他のカテゴリを検索...
                      </div>
                    </SelectItem>
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
          );
        }}
      />

      {/* 新規カテゴリ作成ダイアログ */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] mx-4 w-[calc(100vw-2rem)] sm:w-full">
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

      {/* カテゴリ検索ダイアログ */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="sm:max-w-[500px] mx-4 w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>カテゴリを検索</DialogTitle>
            <DialogDescription>
              カテゴリ名で検索して選択してください。
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Input
              placeholder="カテゴリ名を入力..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-gray-300"
            />
            
            <div className="max-h-60 overflow-y-auto">
              {filteredCategories.length > 0 ? (
                <div className="space-y-2">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        console.log('🔍 CategorySelector: Search dialog category clicked:', category.name, 'ID:', category.id);
                        console.log('🔍 CategorySelector: selectedField available:', !!selectedField);
                        console.log('🔍 CategorySelector: setValue function available:', !!setValue);
                        
                        // 通常の選択と全く同じロジックを使用
                        if (selectedField) {
                          console.log('🔍 CategorySelector: Current selectedField value before change:', selectedField.value);
                          
                          // 内部値を更新してSelectコンポーネントの表示を制御
                          setInternalValue(category.id);
                          selectedField.onChange(category.id);
                          console.log('🔍 CategorySelector: selectedField.onChange called with:', category.id);
                          
                          // setValueがあれば、それも呼び出してフォームの状態を確実に更新
                          if (setValue) {
                            console.log('🔍 CategorySelector: Calling setValue with categoryId:', category.id);
                            setValue("categoryId", category.id, { shouldValidate: true, shouldDirty: true });
                            console.log('🔍 CategorySelector: setValue completed');
                          } else {
                            console.log('⚠️ CategorySelector: setValue function not available in search dialog');
                          }
                        } else {
                          console.log('❌ CategorySelector: selectedField not available');
                        }
                        
                        console.log('🔍 CategorySelector: Closing search dialog');
                        setIsSearchDialogOpen(false);
                        setSearchQuery("");
                      }}
                      className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-gray-500 mt-1">{category.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>検索結果がありません</p>
                  <p className="text-sm">別のキーワードで検索してみてください</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsSearchDialogOpen(false);
                setSearchQuery("");
              }}
            >
              キャンセル
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CategorySelector; 