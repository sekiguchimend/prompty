import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown, GripHorizontal } from 'lucide-react';

interface PreviewMarkerOverlayProps {
  content: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onPreviewLinesChange?: (lines: number) => void;
  onContentChange?: (content: string) => void;
  initialPreviewLines?: number;
}

export const PreviewMarkerOverlay: React.FC<PreviewMarkerOverlayProps> = ({
  content,
  textareaRef,
  onPreviewLinesChange,
  onContentChange,
  initialPreviewLines
}) => {
  const [markerPosition, setMarkerPosition] = useState<{ top: number; left: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewLines, setPreviewLines] = useState<number>(initialPreviewLines || 3);
  const [isMobile, setIsMobile] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // マーカータグを挿入する関数
  const insertMarkerAtLine = useCallback((content: string, targetLine: number) => {
    // 既存のマーカーを削除
    const contentWithoutMarker = content.replace(/<!-- PREVIEW_END -->/g, '');
    
    // 行に分割
    const lines = contentWithoutMarker.split('\n');
    
    // 指定された行数の位置にマーカーを挿入
    const insertIndex = Math.min(targetLine - 1, lines.length - 1);
    
    // 行の末尾にマーカーを追加
    if (insertIndex >= 0 && insertIndex < lines.length) {
      lines[insertIndex] = lines[insertIndex] + '<!-- PREVIEW_END -->';
    } else if (lines.length > 0) {
      // 行数が足りない場合は最後の行に追加
      lines[lines.length - 1] = lines[lines.length - 1] + '<!-- PREVIEW_END -->';
    }
    
    return lines.join('\n');
  }, []);

  // 行数から位置を計算する関数
  const calculatePositionFromLines = useCallback((lines: number) => {
    if (!textareaRef.current || !content) return null;

    const textarea = textareaRef.current;
    const computedStyle = window.getComputedStyle(textarea);
    const fontSize = parseFloat(computedStyle.fontSize);
    const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.4;
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingLeft = parseFloat(computedStyle.paddingLeft);
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
    const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;

    // 指定された行数の位置を計算
    const top = borderTop + paddingTop + ((lines - 1) * lineHeight);
    const left = borderLeft + paddingLeft;

    return { top, left };
  }, [content, textareaRef]);

  // 位置から行数を計算する関数（タッチイベント対応）
  const calculateLinesFromPosition = useCallback((clientY: number, isTouchEvent: boolean = false) => {
    if (!textareaRef.current) return 1;

    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    
    const computedStyle = window.getComputedStyle(textarea);
    const fontSize = parseFloat(computedStyle.fontSize);
    const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.4;
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;

    // 位置から行数を逆算
    const adjustedY = relativeY - borderTop - paddingTop;
    const calculatedLines = Math.round(adjustedY / lineHeight) + 1;
    
    // 最小1行、最大は50行まで許可（十分な範囲を確保）
    const lines = Math.max(1, Math.min(calculatedLines, 50));
    
    if (isTouchEvent) {
      console.log('行数計算（タッチ）:', {
        clientY,
        relativeY,
        adjustedY,
        lineHeight,
        calculatedLines,
        finalLines: lines,
        contentLines: content.split('\n').length
      });
    }
    
    return lines;
  }, [content, textareaRef]);

  // 初期位置の設定
  useEffect(() => {
    if (!content) {
      setMarkerPosition(null);
      return;
    }

    const position = calculatePositionFromLines(previewLines);
    if (position) {
      setMarkerPosition(position);
    }
  }, [content, previewLines, calculatePositionFromLines]);

  // ドラッグ中の処理（マウス）
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    // 新しい行数を計算
    const newLines = calculateLinesFromPosition(e.clientY);
    
    // 行数が変わった場合のみ更新（パフォーマンス向上）
    if (newLines !== previewLines) {
      setPreviewLines(newLines);
      const newPosition = calculatePositionFromLines(newLines);
      if (newPosition) {
        setMarkerPosition(newPosition);
      }
    }
  }, [isDragging, previewLines, calculateLinesFromPosition, calculatePositionFromLines]);

  // タッチ移動処理
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    if (!touch) return;
    
    // 新しい行数を計算
    const newLines = calculateLinesFromPosition(touch.clientY, true);
    
    // 行数が変わった場合のみ更新（パフォーマンス向上）
    if (newLines !== previewLines) {
      setPreviewLines(newLines);
      const newPosition = calculatePositionFromLines(newLines);
      if (newPosition) {
        setMarkerPosition(newPosition);
      }
    }
  }, [isDragging, previewLines, calculateLinesFromPosition, calculatePositionFromLines]);

  // ドラッグ終了の処理
  const handleEnd = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // マーカータグを実際のコンテンツに挿入
    const updatedContent = insertMarkerAtLine(content, previewLines);
    
    // 親コンポーネントに変更を通知
    if (onContentChange) {
      onContentChange(updatedContent);
    }
    
    if (onPreviewLinesChange) {
      onPreviewLinesChange(previewLines);
    }
  }, [previewLines, onPreviewLinesChange, onContentChange, content, insertMarkerAtLine]);

  // マウス/タッチ開始
  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  // 行数調整ボタン（スマホ向け）
  const adjustLines = (delta: number) => {
    const newLines = Math.max(1, Math.min(previewLines + delta, 50));
    setPreviewLines(newLines);
    const newPosition = calculatePositionFromLines(newLines);
    if (newPosition) {
      setMarkerPosition(newPosition);
    }
    
    // すぐに内容に反映
    const updatedContent = insertMarkerAtLine(content, newLines);
    if (onContentChange) {
      onContentChange(updatedContent);
    }
    if (onPreviewLinesChange) {
      onPreviewLinesChange(newLines);
    }
  };

  // グローバルイベントリスナーの管理
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleEnd, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd, { passive: false });
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

  if (!markerPosition || !content) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="absolute z-20 pointer-events-none"
      style={{
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      {/* ドラッグ可能エリア - デスクトップ */}
      {!isMobile && (
        <div
          className={`absolute pointer-events-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
          onMouseDown={handleStart}
        >
          {/* 赤線の表示位置 */}
          <div
            className="absolute"
            style={{
              top: markerPosition.top,
              left: markerPosition.left,
              width: '100%',
              height: '20px',
              marginTop: '-10px',
              pointerEvents: 'none',
            }}
          >
            <div className="relative">
              {/* メインの赤線 */}
              <div 
                className={`w-full bg-red-500 shadow-lg ${isDragging ? 'animate-none bg-red-600' : 'animate-pulse'}`}
                style={{ 
                  height: '2px',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                  marginTop: '9px'
                }}
              />
              
              {/* 光る効果 */}
              {!isDragging && (
                <div 
                  className="absolute top-0 left-0 w-full bg-red-400 opacity-60 animate-ping"
                  style={{ height: '2px', marginTop: '9px' }}
                />
              )}
              
              {/* ドラッグハンドル */}
              <div 
                className={`absolute w-6 h-6 bg-red-500 rounded-full shadow-md flex items-center justify-center transition-colors ${
                  isDragging ? 'bg-red-600 scale-110' : 'hover:bg-red-600'
                }`}
                style={{ 
                  top: '-3px',
                  left: '-3px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                  pointerEvents: 'auto',
                }}
              >
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              
              {/* 行数表示ラベル */}
              <div 
                className={`absolute bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-md ${
                  isDragging ? 'bg-red-600' : ''
                }`}
                style={{
                  top: '-32px',
                  left: '20px',
                  pointerEvents: 'none',
                }}
              >
                {previewLines}行目で終了
              </div>
              
              {/* ドラッグ中のヘルプテキスト */}
              {isDragging && (
                <div 
                  className="absolute bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-md"
                  style={{
                    top: '-48px',
                    left: '120px',
                    pointerEvents: 'none',
                  }}
                >
                  ドラッグして位置を調整
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* モバイル向けのタッチエリア */}
      {isMobile && (
        <div
          className="absolute"
          style={{
            top: markerPosition.top,
            left: markerPosition.left,
            width: '100%',
            height: '20px',
            marginTop: '-10px',
            pointerEvents: 'none',
          }}
        >
          <div className="relative">
            {/* メインの赤線 */}
            <div 
              className="w-full bg-red-500 shadow-lg animate-pulse"
              style={{ 
                height: '3px',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                marginTop: '8px'
              }}
            />
            
            {/* タッチエリア付きハンドル（大きめ） */}
            <div 
              className="absolute flex items-center gap-2 bg-red-500 rounded-lg shadow-lg pointer-events-auto"
              style={{ 
                top: '-20px',
                left: '-10px',
                padding: '8px 12px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                minHeight: '44px', // iOSの推奨タッチサイズ
              }}
              onTouchStart={handleStart}
            >
              <GripHorizontal className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">{previewLines}行目</span>
            </div>
            
            {/* 上下調整ボタン */}
            <div 
              className="absolute flex flex-col gap-1 pointer-events-auto"
              style={{
                top: '-40px',
                right: '10px',
              }}
            >
              <button
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md"
                style={{ minWidth: '44px', minHeight: '44px' }}
                onClick={() => adjustLines(-1)}
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md"
                style={{ minWidth: '44px', minHeight: '44px' }}
                onClick={() => adjustLines(1)}
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            
            {/* モバイル用説明テキスト */}
            <div 
              className="absolute bg-gray-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-md"
              style={{
                top: '-80px',
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }}
            >
              ドラッグまたは↑↓ボタンで調整
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 