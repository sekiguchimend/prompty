import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

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
  onLinkClick?: () => void;
  minimumOverlay?: boolean;
  fallbackSources?: string[];
  timeout?: number;
  fallbackImage?: string;
  fullFeatured?: boolean; // YouTube風の高機能プレイヤーを使用するかどうか
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
  onLinkClick,
  minimumOverlay = false,
  fallbackSources = [],
  timeout = 10000,
  fallbackImage = '/images/default-thumbnail.svg',
  fullFeatured = false
}): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [firstFrameLoaded, setFirstFrameLoaded] = useState(false);
  const [showFallbackImage, setShowFallbackImage] = useState(false);
  
  // 新しい状態変数（YouTube風機能用）
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile] = useState(
    typeof window !== 'undefined' &&
    (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent) ||
     window.innerWidth <= 768)
  );

  // 初回ロード判定（シーク時の canplay で currentTime が 0 に戻るのを防ぐ）
  const isFirstLoadRef = useRef(true);

  // ブラウザ検出
  const getBrowserInfo = useCallback(() => {
    if (typeof window === 'undefined') return { name: 'unknown', version: 0 };
    
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return { name: 'safari', version: 1 };
    } else if (userAgent.includes('Chrome')) {
      return { name: 'chrome', version: 1 };
    } else if (userAgent.includes('Firefox')) {
      return { name: 'firefox', version: 1 };
    } else if (userAgent.includes('Edge')) {
      return { name: 'edge', version: 1 };
    }
    
    return { name: 'unknown', version: 0 };
  }, []);

  // 簡潔な動画形式判定
  const getVideoFormat = useCallback((url: string) => {
    const extension = url.split('.').pop()?.toLowerCase() || 'unknown';
    return extension;
  }, []);
    
  // 動画形式に応じたMIMEタイプ取得（ブラウザ別最適化）
  const getMimeType = useCallback((url: string) => {
    const format = getVideoFormat(url);
    const browser = getBrowserInfo();
    
    const mimeMap: Record<string, string> = {
      'mp4': 'video/mp4',
      'm4v': 'video/mp4',
      'webm': 'video/webm',
      'ogv': 'video/ogg',
      'ogg': 'video/ogg',
      'mov': browser.name === 'safari' ? 'video/quicktime' : 'video/mp4', // Chrome系ではmp4として処理
      'qt': 'video/quicktime',
      '3gp': 'video/3gpp',
      'avi': 'video/x-msvideo',
      'wmv': 'video/x-ms-wmv'
    };
    return mimeMap[format] || 'video/mp4';
  }, [getVideoFormat, getBrowserInfo]);

  // ブラウザ対応判定（MOVはSafariで優先対応）
  const isFormatSupported = useCallback((url: string) => {
    const format = getVideoFormat(url);
    const browser = getBrowserInfo();
    
    // 基本対応形式
    const basicSupported = ['mp4', 'm4v', 'webm', 'ogv', 'ogg'];
      
    // MOVファイルのブラウザ別対応
    if (format === 'mov') {
      return browser.name === 'safari' ? true : false; // Safari以外は対応困難
    }
    
    return basicSupported.includes(format);
  }, [getVideoFormat, getBrowserInfo]);

  // プリロード設定の最適化
  const getOptimalPreload = useCallback((url: string) => {
    const format = getVideoFormat(url);
    const browser = getBrowserInfo();
    
    if (format === 'mov') {
      // MOVファイルはブラウザ別に最適化
      if (browser.name === 'safari') {
        return 'metadata'; // Safariでは通常のプリロード
      } else {
        return 'none'; // その他のブラウザでは軽量化
      }
    }
    
    return 'metadata'; // その他の形式は通常プリロード
  }, [getVideoFormat, getBrowserInfo]);

  // 時間更新処理
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  // 読み込み完了処理
  const handleLoadSuccess = useCallback(() => {
    const format = getVideoFormat(src);
    const browser = getBrowserInfo();
    console.log(`✅ 動画読み込み成功 (${format} - ${browser.name}):`, src);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
      setFirstFrameLoaded(true);
          setIsLoading(false);
          setHasError(false);
    setShowFallbackImage(false);
    
    // 初回ロード時のみ 0 秒にリセット
    if (isFirstLoadRef.current && videoRef.current && videoRef.current.currentTime !== 0) {
      videoRef.current.currentTime = 0;
      isFirstLoadRef.current = false;
    }
  }, [src, getVideoFormat, getBrowserInfo]);

  // メタデータ読み込み完了処理
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
    handleLoadSuccess();
  }, [handleLoadSuccess]);

  // エラー処理
  const handleVideoError = useCallback((event?: any) => {
    const format = getVideoFormat(src);
    const browser = getBrowserInfo();
    console.error(`❌ 動画読み込みエラー (${format} - ${browser.name}):`, src, event);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setHasError(true);
      setIsLoading(false);
    setFirstFrameLoaded(false);
    
    // 対応形式でもエラーが発生した場合はフォールバック画像を表示
    setShowFallbackImage(true);
  }, [src, getVideoFormat, getBrowserInfo]);

  // 再生関連イベント
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // タイムアウト設定（形式とブラウザ別最適化）
  const setupVideoTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
      
    const format = getVideoFormat(src);
    const browser = getBrowserInfo();
    
    // 形式とブラウザ別タイムアウト時間
    let timeoutDuration = timeout;
    if (format === 'mov') {
      timeoutDuration = browser.name === 'safari' ? 8000 : 15000; // Safari以外は長めに
    }
    
    timeoutRef.current = setTimeout(() => {
      console.warn(`⏰ 動画読み込みタイムアウト (${format} - ${browser.name}):`, src);
      
      setIsLoading(false);
      
      if (isFormatSupported(src)) {
        // 対応形式は動画として強制表示
        console.log(`🎬 ${format}形式を動画として強制表示 (${browser.name}):`, src);
        setFirstFrameLoaded(true);
        setHasError(false);
        setShowFallbackImage(false);
      } else {
        // 未対応形式はフォールバック画像
        console.log(`🖼️ ${format}形式をフォールバック画像として表示 (${browser.name}):`, src);
        setHasError(true);
        setShowFallbackImage(true);
      }
    }, timeoutDuration);
  }, [src, timeout, getVideoFormat, getBrowserInfo, isFormatSupported]);
      
  // MOV専用の初期化処理
  const initializeMOVVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || getVideoFormat(src) !== 'mov') return;
    
    const browser = getBrowserInfo();
    console.log(`🎥 MOV動画専用初期化 (${browser.name}):`, src);
    
    // Safari以外でのMOV対応強化
    if (browser.name !== 'safari') {
      // より積極的な読み込み試行
      const tryLoad = () => {
        if (video.readyState >= 1) { // HAVE_METADATA
          handleLoadSuccess();
        } else {
          video.load(); // 強制再読み込み
        }
      };
      
      // 少し遅らせてから試行
      setTimeout(tryLoad, 1000);
    }
  }, [src, getVideoFormat, getBrowserInfo, handleLoadSuccess]);

  // 初期化とイベントリスナー設定
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log(`🚀 VideoPlayer初期化開始:`, src);

    // イベントリスナー設定
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadSuccess);
    video.addEventListener('canplay', handleLoadSuccess);
    video.addEventListener('canplaythrough', handleLoadSuccess);
    video.addEventListener('error', handleVideoError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);

    // タイムアウト開始
    setupVideoTimeout();
    
    // MOV専用処理
    initializeMOVVideo();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadSuccess);
      video.removeEventListener('canplay', handleLoadSuccess);
      video.removeEventListener('canplaythrough', handleLoadSuccess);
      video.removeEventListener('error', handleVideoError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [src, handleLoadedMetadata, handleLoadSuccess, handleVideoError, handlePlay, handlePause, handleTimeUpdate, setupVideoTimeout, initializeMOVVideo]);

  // フルスクリーン状態の監視
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // src変更時のリセット
  useEffect(() => {
    console.log(`🔄 VideoPlayer リセット:`, src);
    setIsLoading(true);
    setHasError(false);
    setFirstFrameLoaded(false);
    setShowFallbackImage(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  // クリックハンドラー（PC表示時は動画制御優先）
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasError || showFallbackImage || !firstFrameLoaded) {
      onLinkClick?.();
      return;
    }
    
    // PC表示時は動画の再生/停止を優先
    if (!isMobile && videoRef.current && firstFrameLoaded) {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
        videoRef.current.play().catch(() => {});
      }
      return;
    }
    
    // モバイル表示時またはtapToPlayが無効の場合はリンククリック
    if (!tapToPlay || !videoRef.current) {
      onLinkClick?.();
      return;
    }
    
      if (isPlaying) {
        videoRef.current.pause();
      } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isMobile, tapToPlay, onLinkClick, isPlaying, hasError, firstFrameLoaded, showFallbackImage]);

  // マウスイベント（PC表示時はホバー再生を無効化）
  const handleMouseEnter = useCallback(() => {
    if (isMobile || hasError || showFallbackImage) return;
    setIsHovered(true);
    setShowControls(true);
    // PC表示時はホバーでの自動再生を無効化
    // if (hoverToPlay && videoRef.current && firstFrameLoaded) {
    //   videoRef.current.play().catch(() => {});
    // }
  }, [isMobile, hasError, showFallbackImage]);

  const handleMouseLeave = useCallback(() => {
    if (isMobile || hasError || showFallbackImage) return;
    setIsHovered(false);
    setShowControls(false);
    // PC表示時はホバー終了時の自動停止も無効化
    // if (hoverToPlay && videoRef.current) {
    //   videoRef.current.pause();
    //   videoRef.current.currentTime = 0;
    // }
  }, [isMobile, hasError, showFallbackImage]);

  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // 新しいイベントハンドラー

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // 親要素のクリックハンドラーにイベントが伝播しないように制御
    e.preventDefault();
    e.stopPropagation();

    if (!videoRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    // シーク位置に再生ヘッドを移動
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    
    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /* ----------------------------------------------------
   *  リアルタイム進捗反映（requestAnimationFrame）
   * --------------------------------------------------*/
  useEffect(() => {
    if (!isPlaying) return; // 再生中のみ追跡

    let frameId: number;

    const update = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [isPlaying]);

  return (
    <div 
      className={`relative overflow-hidden group ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {showFallbackImage ? (
        // フォールバック画像表示
        <div className="w-full h-full relative">
          <img
            src={fallbackImage}
            alt={alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-black bg-opacity-60 text-white rounded-full p-3">
              <Play className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
            動画 ({getVideoFormat(src).toUpperCase()})
          </div>
        </div>
      ) : (
        // 動画表示
        <>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay={false}
          muted={isMuted}
          loop={loop}
          controls={controls}
          playsInline
            preload={getOptimalPreload(src)}
            style={{
              display: 'block',
              opacity: firstFrameLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
          >
            <source src={src} type={getMimeType(src)} />
            {fallbackSources.map((source, index) => (
              <source key={index} src={source} type={getMimeType(source)} />
            ))}
          お使いのブラウザは動画の再生に対応していません。
        </video>

          {/* ローディング表示 */}
          {isLoading && !firstFrameLoaded && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">動画読み込み中...</p>
              </div>
            </div>
          )}

          {/* YouTube風コントロールバー（fullFeaturedモードかつホバー時のみ） */}
          {fullFeatured && !minimumOverlay && (isHovered || showControls) && firstFrameLoaded && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
              {/* 中央の再生/一時停止ボタン（再生中でホバー時のみ） */}
              {isPlaying && isHovered && (
                <div className="absolute inset-0 flex items-center justify-center">
              <button 
                    onClick={handleClick}
                    className="bg-black bg-opacity-70 text-white rounded-full p-3 hover:bg-opacity-90 transition-opacity duration-200"
              >
                    <Pause className="h-6 w-6" />
              </button>
        </div>
      )}
      
              {/* 下部コントロールバー */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {/* プログレスバー */}
                <div className="mb-3">
                  <div 
                    className="w-full h-1 bg-white bg-opacity-30 rounded-full cursor-pointer hover:h-2 transition-all duration-200 relative"
                    onClick={handleSeek}
                  >
                    <div 
                      className="h-full bg-red-500 rounded-full relative"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                    </div>
          </div>
        </div>
      
                {/* コントロールボタン群 */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-3">
                    {/* 再生/一時停止 */}
                    <button
              onClick={handleClick}
                      className="hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors duration-200"
            >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                    
                    {/* 音量コントロール */}
                    <div className="flex items-center space-x-2 group">
                      <button
                        onClick={handleMuteToggle}
                        className="hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors duration-200"
                      >
                        {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                                             <input
                         type="range"
                         min="0"
                         max="1"
                         step="0.1"
                         value={volume}
                         onChange={handleVolumeChange}
                         className="w-16 h-1 bg-white bg-opacity-30 rounded-full appearance-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                         style={{
                           background: `linear-gradient(to right, white 0%, white ${volume * 100}%, rgba(255, 255, 255, 0.3) ${volume * 100}%, rgba(255, 255, 255, 0.3) 100%)`
                         }}
                       />
                    </div>
                    
                    {/* 時間表示 */}
                    <span className="text-sm text-white">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* 再生速度 */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        className="hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors duration-200 flex items-center space-x-1"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="text-sm">{playbackRate}x</span>
                      </button>
                      
                      {/* 再生速度メニュー */}
                      {showSpeedMenu && (
                        <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-90 rounded-md py-2 text-sm min-w-[80px]">
                          {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                <button 
                              key={speed}
                              onClick={() => handleSpeedChange(speed)}
                              className={`block w-full text-left px-3 py-1 hover:bg-white hover:bg-opacity-20 ${
                                speed === playbackRate ? 'text-red-500' : 'text-white'
                  }`}
                            >
                              {speed}x
                </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* フルスクリーン */}
                    <button
                      onClick={handleFullscreen}
                      className="hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors duration-200"
                    >
                      <Maximize className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* PC表示時の動画バッジ（再生していない時は常に表示） */}
          {!isMobile && firstFrameLoaded && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black bg-opacity-70 text-white rounded-full p-3 shadow-lg">
                <Play className="h-6 w-6" />
              </div>
            </div>
          )}

          {/* モバイル用再生ボタン */}
          {(minimumOverlay || isMobile) && firstFrameLoaded && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black bg-opacity-60 text-white rounded-full p-2">
                <Play className="h-4 w-4" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoPlayer;