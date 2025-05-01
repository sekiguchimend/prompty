import React, { useRef } from 'react';
import { Button } from "../../components/ui/button";
import { Image, Upload, XCircle } from "lucide-react";
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