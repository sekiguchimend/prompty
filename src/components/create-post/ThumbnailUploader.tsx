import React, { useRef, useState } from 'react';
import { Button } from "../../components/ui/button";
import { Image, Upload, XCircle } from "lucide-react";

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
  
  // ファイル選択処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // ファイルサイズチェック
      const maxSizeMB = 5;
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`サムネイル画像は${maxSizeMB}MB以下にしてください`);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      
      // 親コンポーネントに通知
      onThumbnailChange(file);
    }
  };
  
  return (
    <div className="flex items-center gap-4">
      <div 
        className="w-32 h-32 border border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        {thumbnailPreview ? (
          <img 
            src={thumbnailPreview} 
            alt="サムネイルプレビュー" 
            className="w-full h-full object-cover"
          />
        ) : (
          <Image className="h-12 w-12 text-gray-400" />
        )}
      </div>
      
      <div className="flex flex-col gap-2">
        <Button 
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="border-gray-300 text-gray-700 text-xs py-1 h-7"
        >
          <Upload className="h-3 w-3 mr-1" />
          画像選択
        </Button>
        
        {thumbnailPreview && (
          <Button 
            type="button"
            variant="outline"
            size="sm"
            onClick={onThumbnailClear}
            className="border-gray-300 text-gray-700 px-2 py-1 h-7"
          >
            <XCircle className="h-3 w-3 mr-1" />
            削除
          </Button>
        )}
      </div>
      
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