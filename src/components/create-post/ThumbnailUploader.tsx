import React, { useRef, useState } from 'react';
import { Button } from "../../components/ui/button";
import { Image, Upload, XCircle, Camera, Video, Play, Pause } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

interface ThumbnailUploaderProps {
  thumbnailPreview: string | null;
  onThumbnailChange: (file: File) => void;
  onThumbnailClear: () => void;
  mediaType?: 'image' | 'video' | null;
}



const ThumbnailUploader: React.FC<ThumbnailUploaderProps> = ({
  thumbnailPreview,
  onThumbnailChange,
  onThumbnailClear,
  mediaType
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  
  // ファイル選択処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      try {
        // ファイルサイズチェック（全ファイル40GB）
        const maxSize = 40 * 1024 * 1024 * 1024; // 40GB for all files
        const maxSizeText = '40GB';
        if (file.size > maxSize) {
          toast({
            title: "エラー",
            description: `ファイルサイズは${maxSizeText}以下にしてください`,
            variant: "destructive",
          });
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }

        // ファイルタイプチェック
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (!isImage && !isVideo) {
          toast({
            title: "エラー",
            description: "画像または動画ファイルを選択してください",
            variant: "destructive",
          });
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }

        
        // 親コンポーネントに通知（ファイルオブジェクト自体を渡す）
        onThumbnailChange(file);
        
      } catch (err) {
        toast({
          title: "エラー",
          description: "ファイルの処理に失敗しました",
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
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast({
          title: "エラー",
          description: "画像または動画ファイルのみアップロードできます",
          variant: "destructive",
        });
        return;
      }
      
      const maxSize = 40 * 1024 * 1024 * 1024; // 40GB for all files
      const maxSizeText = '40GB';
      if (file.size > maxSize) {
        toast({
          title: "エラー",
          description: `ファイルサイズは${maxSizeText}以下にしてください`,
          variant: "destructive",
        });
        return;
      }

      onThumbnailChange(file);
    }
  };

  // 動画制御の関数
  const handleVideoMouseEnter = () => {
    setIsVideoHovered(true);
    if (videoRef.current && mediaType === 'video') {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  const handleVideoMouseLeave = () => {
    setIsVideoHovered(false);
    if (videoRef.current && mediaType === 'video') {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsVideoPlaying(false);
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current && mediaType === 'video') {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play();
        setIsVideoPlaying(true);
      }
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
          // 画像または動画が設定されている場合
          <>
            {mediaType === 'video' && thumbnailPreview.startsWith('http') ? (
              <div 
                className="relative w-full h-full"
                onMouseEnter={handleVideoMouseEnter}
                onMouseLeave={handleVideoMouseLeave}
              >
                <video 
                  ref={videoRef}
                  src={thumbnailPreview} 
                  className="w-full h-full object-cover"
                  muted
                  loop
                  onClick={handleVideoClick}
                />
                {/* 動画制御オーバーレイ */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  {!isVideoPlaying && (
                    <div className="bg-white/90 rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Play className="h-6 w-6 text-gray-700" />
                    </div>
                  )}
                </div>
                {/* 動画インジケーター */}
                <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  動画
                </div>
              </div>
            ) : mediaType === 'video' && thumbnailPreview.startsWith('uploading_') ? (
              // 動画アップロード中の表示
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <Video className="h-12 w-12 text-blue-500 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-gray-600">動画をアップロード中...</p>
                  <p className="text-xs text-gray-500">{thumbnailPreview.replace('uploading_', '')}</p>
                </div>
              </div>
            ) : (
              <img 
                src={thumbnailPreview} 
                alt="記事のメイン画像" 
                className="w-full h-full object-cover"
              />
            )}
            
            {/* ホバー時のオーバーレイ（動画以外または動画停止時） */}
            {mediaType !== 'video' && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-3">
                  <div className="bg-white rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Camera className="h-4 w-4" />
                    画像を変更
                  </div>
                </div>
              </div>
            )}
            
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
              <h3 className="text-lg font-semibold text-gray-900">サムネ画像・動画</h3>
              <p className="text-sm text-gray-600 max-w-xs">
                ファイルを選択またはドロップ
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 隠れたファイル入力 */}
      <input
        type="file"
        accept="image/*,video/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ThumbnailUploader; 