import React, { useRef, useState } from 'react';
import { Button } from "../../components/ui/button";
import { Image, Upload, XCircle, Camera } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

interface ThumbnailUploaderProps {
  thumbnailPreview: string | null;
  onThumbnailChange: (file: File) => void;
  onThumbnailClear: () => void;
}

const ThumbnailUploader: React.FC<ThumbnailUploaderProps> = ({
  thumbnailPreview,
  onThumbnailChange,
  onThumbnailClear
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = useState(false);
  
  // ファイル選択処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      try {
        // ファイルサイズチェック
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          toast({
            title: "エラー",
            description: "ファイルサイズは5MB以下にしてください",
            variant: "destructive",
          });
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }

        // ファイルタイプチェック
        if (!file.type.startsWith('image/')) {
          toast({
            title: "エラー",
            description: "画像ファイルのみアップロードできます",
            variant: "destructive",
          });
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }

        // 明示的に対応している画像形式をチェック
        const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!supportedTypes.includes(file.type)) {
          console.warn(`未サポートの画像形式が検出されました: ${file.type}`);
          // エラーとはせず、ユーザーに通知のみ
          toast({
            title: "注意",
            description: `この画像形式(${file.type})は完全にサポートされていない可能性があります。JPG、PNG、GIF、WebPの使用を推奨します。`,
            variant: "destructive",
            duration: 5000,
          });
        }
        
        // 親コンポーネントに通知
        onThumbnailChange(file);
        
      } catch (err) {
        console.error('handleFileChange エラー:', err);
        toast({
          title: "エラー",
          description: "画像処理中に予期せぬエラーが発生しました",
          variant: "destructive",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  // ドラッグ&ドロップ処理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      
      // 同じバリデーションロジックを使用
      if (!file.type.startsWith('image/')) {
        toast({
          title: "エラー",
          description: "画像ファイルのみアップロードできます",
          variant: "destructive",
        });
        return;
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "エラー",
          description: "ファイルサイズは5MB以下にしてください",
          variant: "destructive",
        });
        return;
      }

      onThumbnailChange(file);
    }
  };
  
  return (
    <div className="relative">
      {/* メイン画像表示エリア */}
      <div 
        className={`relative w-full h-64 border-2 border-dashed rounded-xl overflow-hidden transition-all duration-200 cursor-pointer group ${
          isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : thumbnailPreview 
              ? 'border-gray-300 bg-white hover:border-gray-400' 
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {thumbnailPreview ? (
          // 画像が設定されている場合
          <>
            <img 
              src={thumbnailPreview} 
              alt="記事のメイン画像" 
              className="w-full h-full object-cover"
            />
            {/* ホバー時のオーバーレイ */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-3">
                <div className="bg-white rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Camera className="h-4 w-4" />
                  画像を変更
                </div>
              </div>
            </div>
            {/* 削除ボタン */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onThumbnailClear();
              }}
              className="absolute top-3 right-3 bg-white/90 hover:bg-white border-gray-300 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        ) : (
          // 画像が設定されていない場合
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors duration-200">
                <Image className="h-8 w-8 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">記事のメイン画像</h3>
              <p className="text-sm text-gray-600 max-w-xs">
                クリックして画像を選択するか、<br />
                ここに画像をドラッグ&ドロップしてください
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Upload className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">JPG, PNG, GIF, WebP (最大5MB)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 隠れたファイル入力 */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ThumbnailUploader; 