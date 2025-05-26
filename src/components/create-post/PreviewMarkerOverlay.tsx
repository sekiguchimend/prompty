import React, { useEffect, useState, useRef, useCallback } from 'react';

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
  const overlayRef = useRef<HTMLDivElement>(null);

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

  // 位置から行数を計算する関数
  const calculateLinesFromPosition = useCallback((clientY: number) => {
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
    
    console.log('行数計算:', {
      clientY,
      relativeY,
      adjustedY,
      lineHeight,
      calculatedLines,
      finalLines: lines,
      contentLines: content.split('\n').length
    });
    
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

  // ドラッグ中の処理
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    // 新しい行数を計算
    const newLines = calculateLinesFromPosition(e.clientY);
    
    // 行数が変わった場合のみ更新（パフォーマンス向上）
    if (newLines !== previewLines) {
      console.log('行数変更:', previewLines, '->', newLines);
      setPreviewLines(newLines);
      const newPosition = calculatePositionFromLines(newLines);
      if (newPosition) {
        setMarkerPosition(newPosition);
      }
    }
  }, [isDragging, previewLines, calculateLinesFromPosition, calculatePositionFromLines]);

  // ドラッグ終了の処理
  const handleMouseUp = useCallback((e: MouseEvent) => {
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

  // ドラッグ開始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  // グローバルイベントリスナーの管理
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
      {/* ドラッグ可能エリア - テキストエリア全体 */}
      <div
        className={`absolute pointer-events-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* 赤線の表示位置 */}
        <div
          className="absolute"
          style={{
            top: markerPosition.top,
            left: markerPosition.left,
            width: '100%',
            height: '20px',
            marginTop: '-10px', // 中央揃え
            pointerEvents: 'none', // 赤線自体はクリックを通す
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
                pointerEvents: 'auto', // ハンドルはクリック可能
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
    </div>
  );
}; 