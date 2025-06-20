import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from "../../components/ui/use-toast";
import { dataURLtoFile } from '../../utils/file-upload';
import type { ProjectFormValues } from './ProjectSettingsForm';
import ProjectSettingsForm from './ProjectSettingsForm';

// カテゴリの型定義
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
}

interface ProjectSettingsHandlerProps {
  onProjectSettingsChange: (settings: ProjectFormValues) => void;
  onThumbnailFileChange: (file: File | null) => void;
  defaultSettings?: ProjectFormValues;
}

export const ProjectSettingsHandler: React.FC<ProjectSettingsHandlerProps> = ({
  onProjectSettingsChange,
  onThumbnailFileChange,
  defaultSettings
}) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [projectSettings, setProjectSettings] = useState<ProjectFormValues>(
    defaultSettings || {
      projectTitle: "",
      aiModel: "",
      pricingType: "free",
      price: 0,
      projectDescription: "",
      thumbnail: "",
      projectUrl: "",
      categoryId: null,
    }
  );
  
  // カテゴリ一覧を取得
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        toast({
          title: "エラー",
          description: "カテゴリの取得に失敗しました",
          variant: "destructive",
        });
      } else if (data) {
        setCategories(data);
      }
    } catch (error) {
      // Error handling without console logging
    } finally {
      setIsLoadingCategories(false);
    }
  };
  
  // 初期化時にカテゴリ一覧を取得
  useEffect(() => {
    fetchCategories();
  }, []);

  // プロジェクト設定の保存
  const handleProjectSave = (data: ProjectFormValues) => {
    // プロジェクト設定を更新
    const updatedSettings = {
      ...data,
      thumbnail: data.thumbnail || "",
      categoryId: data.categoryId || null 
    };
    
    setProjectSettings(updatedSettings);
    onProjectSettingsChange(updatedSettings);
    
    // サムネイル画像があれば処理
    if (data.thumbnail && data.thumbnail.startsWith('data:')) {
      // サムネイル処理を実行
      handleThumbnailChange(data.thumbnail);
    } else if (data.thumbnail) {
      // サムネイル画像はすでに処理済みかBase64形式ではありません
    } else {
      // サムネイルがない場合は明示的にnullをセット
      onThumbnailFileChange(null);
    }
  };
  
  // サムネイル画像を直接処理する関数（同期的に状態を更新）
  const handleThumbnailChange = (thumbnailDataUrl: string) => {
    try {
      if (!thumbnailDataUrl || !thumbnailDataUrl.startsWith('data:')) {
        onThumbnailFileChange(null);
        return;
      }
      
      // ファイル名を生成（タイムスタンプを含める）
      const timestamp = Date.now();
      const filename = `thumbnail-${timestamp}`;
      
      // データURLをFileオブジェクトに変換
      const file = dataURLtoFile(thumbnailDataUrl, filename);
      
      // 親コンポーネントに通知
      onThumbnailFileChange(file);
      
    } catch (error) {
      onThumbnailFileChange(null);
    }
  };

  return (
    <div>
      {/* このコンポーネントでは状態管理のみを行い、UIは提供しません */}
      {/* カテゴリとロード状態の状態は以下のように公開できます */}
      <ProjectSettingsForm
        onSave={handleProjectSave}
        defaultValues={projectSettings}
        categories={categories}
        isLoadingCategories={isLoadingCategories}
        onRefreshCategories={fetchCategories}
      />
    </div>
  );
};

export default ProjectSettingsHandler; 