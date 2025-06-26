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
  minimumOverlay?: boolean; // 最小限のオーバーレイ（再生ボタンのみ）
  fallbackSources?: string[]; // フォールバック用の動画ソース
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
  fallbackSources = []
}): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);
  const [allSources] = useState([src, ...fallbackSources]);
  const [retryCount, setRetryCount] = useState(0);
  const [firstFrameLoaded, setFirstFrameLoaded] = useState(false);

  useEffect(() => {
    // モバイルデバイス判定
    const userAgent = navigator.userAgent;
    const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
      window.innerWidth <= 768;
    
    setIsMobile(isMobileDevice);
    
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    
    const handleLoadedData = () => {
      setThumbnailLoaded(true);
      setIsLoading(false);
      setHasError(false);
      setRetryCount(0);
      setFirstFrameLoaded(true);
      
      // 動画の最初のフレーム（0秒）に移動
      if (video.currentTime !== 0) {
        video.currentTime = 0;
      }
      
      if (loadTimeout) {
        clearTimeout(loadTimeout);
        setLoadTimeout(null);
      }
    };

    const handleCanPlay = () => {
      setThumbnailLoaded(true);
      setIsLoading(false);
      setHasError(false);
      setRetryCount(0);
      setFirstFrameLoaded(true);
      
      // 動画の最初のフレームに確実に移動
      if (video.currentTime !== 0) {
        video.currentTime = 0;
      }
      
      if (loadTimeout) {
        clearTimeout(loadTimeout);
        setLoadTimeout(null);
      }
    };

    const handleLoadedMetadata = () => {
      // メタデータが読み込まれた時点で最初のフレームを表示
      setThumbnailLoaded(true);
      setFirstFrameLoaded(true);
      
      // 動画の最初のフレームに移動
      video.currentTime = 0;
      
      // モバイルでは少し待ってからローディング状態を解除
      if (isMobileDevice) {
        setTimeout(() => {
          setIsLoading(false);
          setHasError(false);
          setRetryCount(0);
          
          if (loadTimeout) {
            clearTimeout(loadTimeout);
            setLoadTimeout(null);
          }
        }, 200);
      } else {
        setIsLoading(false);
        setHasError(false);
        setRetryCount(0);
        
        if (loadTimeout) {
          clearTimeout(loadTimeout);
          setLoadTimeout(null);
        }
      }
    };

    const handleSeeked = () => {
      // シーク完了時に最初のフレームが表示される
      setFirstFrameLoaded(true);
      setThumbnailLoaded(true);
      setIsLoading(false);
    };
    
    const handleError = (e: Event) => {
      console.error('Video loading error:', e, 'Current source:', allSources[currentSrcIndex], 'Retry count:', retryCount);
      
      if (loadTimeout) {
        clearTimeout(loadTimeout);
        setLoadTimeout(null);
      }
      
      // リトライ回数が2回未満の場合は同じソースで再試行
      if (retryCount < 2) {
        console.log('Retrying same source:', allSources[currentSrcIndex], 'Attempt:', retryCount + 1);
        setRetryCount(prev => prev + 1);
        setIsLoading(true);
        setHasError(false);
        
        setTimeout(() => {
          if (video) {
            video.load();
          }
        }, 1000 * (retryCount + 1));
        return;
      }
      
      // 次のソースを試す
      if (currentSrcIndex < allSources.length - 1) {
        console.log('Trying next source:', allSources[currentSrcIndex + 1]);
        setCurrentSrcIndex(prev => prev + 1);
        setRetryCount(0);
        setIsLoading(true);
        setHasError(false);
      } else {
        console.error('All video sources failed to load');
        setHasError(true);
        setIsLoading(false);
        setRetryCount(0);
      }
    };
    
    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
      
      // モバイルの場合はタイムアウトを短めに設定
      const timeoutDuration = isMobileDevice ? 8000 : 12000;
      
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
      const timeout = setTimeout(() => {
        console.warn('Video loading timeout:', allSources[currentSrcIndex]);
        
        if (currentSrcIndex < allSources.length - 1) {
          console.log('Timeout - trying next source:', allSources[currentSrcIndex + 1]);
          setCurrentSrcIndex(prev => prev + 1);
          setRetryCount(0);
          setIsLoading(true);
          setHasError(false);
        } else {
          console.error('All video sources timed out');
          setIsLoading(false);
          setHasError(true);
          setRetryCount(0);
        }
      }, timeoutDuration);
      setLoadTimeout(timeout);
    };

    const handleSuspend = () => {
      console.warn('Video loading suspended');
      // モバイルでsuspendが発生した場合、ローディング状態を解除
      if (isMobileDevice) {
        setTimeout(() => {
          if (isLoading && !firstFrameLoaded) {
            setIsLoading(false);
          }
        }, 2000);
      }
    };

    const handleStalled = () => {
      console.warn('Video loading stalled');
      // モバイルでstalledが発生した場合、ローディング状態を解除
      if (isMobileDevice) {
        setTimeout(() => {
          if (isLoading && !firstFrameLoaded) {
            setIsLoading(false);
          }
        }, 3000);
      }
    };

    const handleWaiting = () => {
      // バッファリング中
      if (!isMobileDevice) {
        setIsLoading(true);
      }
    };

    const handleCanPlayThrough = () => {
      // 十分にバッファリングされて再生可能
      setIsLoading(false);
      setFirstFrameLoaded(true);
      setThumbnailLoaded(true);
      
      // 動画の最初のフレームに確実に移動
      if (video.currentTime !== 0) {
        video.currentTime = 0;
      }
    };

    // 動画が読み込まれた直後に最初のフレームを表示するための処理
    const handleTimeUpdate = () => {
      // 再生中でない場合は、常に最初のフレームに戻す
      if (!isPlaying && video.currentTime !== 0) {
        video.currentTime = 0;
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('suspend', handleSuspend);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('suspend', handleSuspend);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
    };
  }, [allSources, currentSrcIndex, loadTimeout, retryCount, isPlaying]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowControls(true);
    if (hoverToPlay && videoRef.current && !isMobile) {
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowControls(false);
    if (hoverToPlay && videoRef.current && !isMobile) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!tapToPlay || !videoRef.current) {
      if (onLinkClick) {
        onLinkClick();
      }
      return;
    }
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Play failed:', error);
          if (isMobile) {
            videoRef.current?.load();
          }
        });
      }
    }
  };

  const handlePlayButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation(); // より確実にイベント伝播を止める
    
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Play failed:', error);
          if (isMobile) {
            videoRef.current?.load();
          }
        });
      }
    }
  };

  const handleVideoAreaClick = (e: React.MouseEvent) => {
    // イベントがボタンから発生した場合は処理しない
    if ((e.target as HTMLElement).closest('[data-play-button="true"]')) {
      return;
    }
    
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('Play failed:', error);
              videoRef.current?.load();
            });
          }
        }
      }
      return;
    }
    
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Play failed:', error);
          });
        }
      }
    } else if (onLinkClick) {
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

  // モバイル対応のpreload設定
  const getPreloadSetting = () => {
    // 最初のフレームを表示するためにmetadataを読み込み
    return 'metadata';
  };

  return (
    <div 
      className={`relative overflow-hidden group ${className}`}
      onMouseEnter={!isMobile ? handleMouseEnter : undefined}
      onMouseLeave={!isMobile ? handleMouseLeave : undefined}
      onClick={!isMobile ? handleClick : undefined}
    >
      {!hasError ? (
        <video
          ref={videoRef}
          src={allSources[currentSrcIndex]}
          className="w-full h-full object-cover"
          autoPlay={false}
          muted={isMuted}
          loop={loop}
          controls={controls}
          playsInline
          preload={getPreloadSetting()}
          // poster属性は使用せず、動画の最初のフレームを表示
          {...(!isMobile && { crossOrigin: "anonymous" })}
        >
          {allSources.map((source, index) => {
            const extension = source.split('.').pop()?.toLowerCase();
            let mimeType = 'video/mp4';
            
            switch (extension) {
              case 'mov':
                mimeType = 'video/quicktime';
                break;
              case 'webm':
                mimeType = 'video/webm';
                break;
              case 'ogv':
                mimeType = 'video/ogg';
                break;
              case 'avi':
                mimeType = 'video/x-msvideo';
                break;
              case 'mkv':
                mimeType = 'video/x-matroska';
                break;
              default:
                mimeType = 'video/mp4';
            }
            
            return (
              <source key={index} src={source} type={mimeType} />
            );
          })}
          お使いのブラウザは動画の再生に対応していません。
        </video>
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-gray-500 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">動画を読み込めませんでした</p>
            {onLinkClick && (
              <button 
                onClick={onLinkClick}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                詳細を見る
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* ローディング表示 - 最初のフレームが読み込まれるまでのみ表示 */}
      {!hasError && isLoading && showThumbnail && !firstFrameLoaded && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-white">動画を読み込み中...</p>
            {retryCount > 0 && !isMobile && (
              <p className="text-xs text-white/80 mt-1">再試行中... ({retryCount}/2)</p>
            )}
            {isMobile && (
              <p className="text-xs text-white/80 mt-1">少々お待ちください</p>
            )}
          </div>
        </div>
      )}
      
      {/* カスタムコントロール */}
      {!controls && (
        <>
          {/* 再生/一時停止オーバーレイ - モバイルでは別のイベントハンドラーを使用 */}
          {!isMobile && (
            <div 
              className="absolute inset-0 transition-all duration-300 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20"
              onClick={handleClick}
            >
              {(!isPlaying || showControls) && !isPlaying && (
                <button 
                  onClick={handlePlayButtonClick}
                  className={`bg-black/80 backdrop-blur-sm rounded-full p-3 shadow-lg transition-all duration-300 hover:bg-black hover:scale-110 ${
                    showControls || !hoverToPlay ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  data-play-button="true"
                >
                  <Play className="h-6 w-6 fill-white" />
                </button>
              )}
            </div>
          )}
          
          {/* モバイル: 動画エリアクリック領域（再生ボタン以外の部分） */}
          {isMobile && (
            <div 
              className="absolute inset-0"
              onClick={handleVideoAreaClick}
            />
          )}
          
          {/* モバイル: 再生ボタンオーバーレイ */}
          {isMobile && !isPlaying && (firstFrameLoaded || thumbnailLoaded) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="bg-black/80 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-100 pointer-events-auto z-10"
                onClick={handlePlayButtonClick}
                data-play-button="true"
              >
                <Play className="h-5 w-5 fill-white" />
              </div>
            </div>
          )}

          {/* 音声コントロール（再生中は非表示）- minimumOverlayの場合は非表示 */}
          {!isPlaying && !minimumOverlay && (firstFrameLoaded || thumbnailLoaded) && (
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
          )}

          {/* 動画インジケーター（再生中は非表示）- minimumOverlayの場合は非表示 */}
          {!isPlaying && !minimumOverlay && (firstFrameLoaded || thumbnailLoaded) && (
            <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              動画
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoPlayer;