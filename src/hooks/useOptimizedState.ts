import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// 最適化されたいいね状態管理フック
export const useLikeState = (initialLiked: boolean, initialCount: number) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 前回の値を保持してメモ化に使用
  const prevLiked = useRef(initialLiked);
  const prevCount = useRef(initialCount);
  
  useEffect(() => {
    if (prevLiked.current !== initialLiked) {
      setLiked(initialLiked);
      prevLiked.current = initialLiked;
    }
    if (prevCount.current !== initialCount) {
      setLikeCount(initialCount);
      prevCount.current = initialCount;
    }
  }, [initialLiked, initialCount]);
  
  const toggleLike = useCallback(async (likeFunction: () => Promise<void>) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    const originalLiked = liked;
    const originalCount = likeCount;
    
    // 楽観的更新
    setLiked(!liked);
    setLikeCount(liked ? Math.max(0, likeCount - 1) : likeCount + 1);
    
    try {
      await likeFunction();
    } catch (error) {
      // エラー時は元に戻す
      setLiked(originalLiked);
      setLikeCount(originalCount);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [liked, likeCount, isProcessing]);
  
  return useMemo(() => ({
    liked,
    likeCount,
    isProcessing,
    toggleLike
  }), [liked, likeCount, isProcessing, toggleLike]);
};

// 最適化されたブックマーク状態管理フック
export const useBookmarkState = (initialBookmarked: boolean) => {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isProcessing, setIsProcessing] = useState(false);
  const prevBookmarked = useRef(initialBookmarked);
  
  useEffect(() => {
    if (prevBookmarked.current !== initialBookmarked) {
      setBookmarked(initialBookmarked);
      prevBookmarked.current = initialBookmarked;
    }
  }, [initialBookmarked]);
  
  const toggleBookmark = useCallback(async (bookmarkFunction: () => Promise<void>) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    const originalBookmarked = bookmarked;
    
    // 楽観的更新
    setBookmarked(!bookmarked);
    
    try {
      await bookmarkFunction();
    } catch (error) {
      // エラー時は元に戻す
      setBookmarked(originalBookmarked);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [bookmarked, isProcessing]);
  
  return useMemo(() => ({
    bookmarked,
    isProcessing,
    toggleBookmark
  }), [bookmarked, isProcessing, toggleBookmark]);
};

// debounced search hook（検索最適化）
export const useDebouncedValue = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// 最適化されたユーザー状態管理
export const useOptimizedUserState = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userCache = useRef<Map<string, any>>(new Map());
  
  const updateUser = useCallback((newUser: any) => {
    if (newUser?.id) {
      userCache.current.set(newUser.id, newUser);
    }
    setUser(newUser);
    setIsLoading(false);
  }, []);
  
  const getCachedUser = useCallback((userId: string) => {
    return userCache.current.get(userId);
  }, []);
  
  return useMemo(() => ({
    user,
    isLoading,
    updateUser,
    getCachedUser
  }), [user, isLoading, updateUser, getCachedUser]);
};

// 最適化: useOptimizedViewportフックを削除
// 画面サイズ判定は統合された use-responsive.tsx フックを使用してください 