const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    // ファイルサイズチェック
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('thumbnail', {
        type: 'manual',
        message: 'ファイルサイズは5MB以下にしてください'
      });
      return;
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      setError('thumbnail', {
        type: 'manual',
        message: '画像ファイルのみアップロードできます'
      });
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
        variant: "warning",
        duration: 5000,
      });
    }

    // Base64に変換
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const base64String = reader.result as string;
        if (!base64String || typeof base64String !== 'string') {
          throw new Error('画像の変換に失敗しました');
        }
        
        // Base64エンコードがデータURLの形式か確認
        if (!base64String.startsWith('data:image/')) {
          console.warn('不正なデータURL形式:', base64String.substring(0, 30) + '...');
          throw new Error('画像の形式が正しくありません');
        }
        
        setValue('thumbnail', base64String);
        clearErrors('thumbnail');
      } catch (err) {
        console.error('画像処理エラー:', err);
        setError('thumbnail', {
          type: 'manual',
          message: '画像の処理中にエラーが発生しました'
        });
      }
    };
    
    reader.onerror = () => {
      console.error('FileReader エラー:', reader.error);
      setError('thumbnail', {
        type: 'manual',
        message: '画像の読み込みに失敗しました'
      });
    };
    
    reader.readAsDataURL(file);
  } catch (err) {
    console.error('handleImageUpload エラー:', err);
    setError('thumbnail', {
      type: 'manual',
      message: '画像処理中に予期せぬエラーが発生しました'
    });
  }
}; 