import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  alt?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  hoverToPlay?: boolean;
  tapToPlay?: boolean;
  showThumbnail?: boolean;
  onLinkClick?: () => void; // リンククリック用のコールバック
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  alt = "動画",
  className = "",
  autoPlay = false,
  muted = true,
  loop = true,
  controls = false,
  hoverToPlay = true,
  tapToPlay = true,
  showThumbnail = true,
  onLinkClick
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    console.log('🎬 VideoPlayerコンポーネントマウント:', {
      src,
      alt,
      hasVideo: !!videoRef.current
    });
    
    // モバイルデバイス判定
    setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadedData = () => {
      setThumbnailLoaded(true);
      console.log('🖼️ 動画サムネイル読み込み完了');
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [src, alt]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowControls(true);
    if (hoverToPlay && videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowControls(false);
    if (hoverToPlay && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!tapToPlay || !videoRef.current) {
      // 動画再生機能が無効の場合はリンクに飛ぶ
      if (onLinkClick) {
        onLinkClick();
      }
      return;
    }
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handlePlayButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // イベント伝播を停止してリンクに飛ばない
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleVideoAreaClick = (e: React.MouseEvent) => {
    // 再生ボタン以外の部分をクリックした場合
    if (onLinkClick) {
      onLinkClick();
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div 
      className={`relative overflow-hidden group ${className}`}
      onMouseEnter={!isMobile ? handleMouseEnter : undefined}
      onMouseLeave={!isMobile ? handleMouseLeave : undefined}
      onClick={isMobile ? handleVideoAreaClick : undefined}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        controls={controls}
        playsInline
        preload="metadata" // サムネイル表示のためメタデータを事前読み込み
        poster="" // ポスター画像は使わずに最初のフレームを表示
      />
      
      {/* ローディング表示 */}
      {!thumbnailLoaded && showThumbnail && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">動画を読み込み中...</p>
          </div>
        </div>
      )}
      
      {/* カスタムコントロール */}
      {!controls && (
        <>
          {/* 再生/一時停止オーバーレイ */}
          <div 
            className={`absolute inset-0 transition-all duration-300 flex items-center justify-center ${
              !isMobile ? 'bg-black bg-opacity-0 hover:bg-opacity-20' : ''
            }`}
            onClick={!isMobile ? handleClick : undefined}
          >
            {/* デスクトップ: ホバーで表示 */}
            {!isMobile && (!isPlaying || showControls) && (
              <button 
                onClick={handlePlayButtonClick}
                className={`bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg transition-all duration-300 hover:bg-white hover:scale-110 ${
                  showControls || !hoverToPlay ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 text-gray-700" />
                ) : (
                  <Play className="h-6 w-6 text-gray-700" />
                )}
              </button>
            )}
            
            {/* モバイル: 常に表示される再生ボタン */}
            {isMobile && (
              <button 
                onClick={handlePlayButtonClick}
                className={`bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg transition-all duration-300 hover:bg-white hover:scale-110 ${
                  !isPlaying ? 'opacity-100' : 'opacity-70'
                }`}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8 text-gray-700" />
                ) : (
                  <Play className="h-8 w-8 text-gray-700" />
                )}
              </button>
            )}
          </div>

          {/* 音声コントロール */}
          <button
            onClick={handleMuteToggle}
            className={`absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 ${
              showControls || isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>

          {/* 動画インジケーター */}
          <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            動画
          </div>
        </>
      )}
    </div>
  );
};

export default VideoPlayer;