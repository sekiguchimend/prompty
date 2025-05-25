import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { X, Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { UnifiedAvatar } from './index';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    id: string;
    display_name?: string | null;
    username?: string;
    bio?: string | null;
    avatar_url?: string | null;
    location?: string | null;
  } | null;
  onProfileUpdated: () => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  userData,
  onProfileUpdated
}) => {
  // userDataが存在しない場合のデフォルト値
  const safeUserData = userData || {
    id: '',
    display_name: '',
    username: '',
    bio: '',
    avatar_url: '',
    location: ''
  };

  const [displayName, setDisplayName] = useState(safeUserData.display_name || '');
  const [bio, setBio] = useState(safeUserData.bio || '');
  const [location, setLocation] = useState(safeUserData.location || '');
  const [avatarUrl, setAvatarUrl] = useState(safeUserData.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  
  const { toast } = useToast();
  
  useEffect(() => {
    // ユーザーデータが変更されたときにフォームをリセット
    if (userData) {
      setDisplayName(userData.display_name || '');
      setBio(userData.bio || '');
      setLocation(userData.location || '');
      setAvatarUrl(userData.avatar_url || '');
      setPreviewUrl(null);
      setAvatarFile(null);
      setRemoveAvatar(false);
    }
  }, [userData, isOpen]);
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 5MB以下であることを確認
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "エラー",
          description: "画像サイズは5MB以下にしてください",
          variant: "destructive"
        });
        return;
      }
      
      // 画像タイプであることを確認
      if (!file.type.startsWith('image/')) {
        toast({
          title: "エラー",
          description: "画像ファイルを選択してください",
          variant: "destructive"
        });
        return;
      }
      
      setAvatarFile(file);
      setRemoveAvatar(false);
      
      // プレビュー用のURLを作成
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    setAvatarFile(null);
    setAvatarUrl('');
    setRemoveAvatar(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // FormDataを準備
      const formData = new FormData();
      formData.append('userId', safeUserData.id);
      formData.append('displayName', displayName.trim());
      formData.append('bio', bio.trim());
      formData.append('location', location.trim());
      
      if (removeAvatar) {
        formData.append('removeAvatar', 'true');
      }
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      // プロフィール更新APIを呼び出し
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プロフィール更新に失敗しました');
      }
      
      const result = await response.json();
      
      toast({
        title: "プロフィールを更新しました",
        description: "変更内容が保存されました",
      });
      
      // 親コンポーネントに更新を通知
      onProfileUpdated();
      onClose();
      
    } catch (error: any) {
      console.error('プロフィール更新エラー:', error);
      toast({
        title: "エラーが発生しました",
        description: error.message || "プロフィールの更新に失敗しました",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // userDataが存在しない場合またはisOpenがfalseの場合は早期リターン
  if (!isOpen || !userData || !userData.id) {
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>プロフィールを編集</DialogTitle>
          <DialogDescription>
            あなたのプロフィール情報を更新します
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* アバター画像 */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <UnifiedAvatar
                src={previewUrl || (removeAvatar ? '' : avatarUrl)}
                displayName={displayName}
                size="xl"
                className="h-24 w-24 border border-gray-200"
              />
              {(previewUrl || (!removeAvatar && avatarUrl)) && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-2 -right-2 rounded-full bg-gray-100 p-1 text-gray-600 hover:bg-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div>
              <Label htmlFor="avatar" className="cursor-pointer text-sm py-1 px-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
                画像を選択
              </Label>
              <Input 
                id="avatar" 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500">最大5MB・jpg, png, gifのみ</p>
          </div>
          
          {/* 表示名 */}
          <div className="space-y-2">
            <Label htmlFor="displayName">表示名 <span className="text-red-500">*</span></Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="表示名を入力"
              required
              maxLength={50}
            />
          </div>
          
          {/* 自己紹介 */}
          <div className="space-y-2">
            <Label htmlFor="bio">自己紹介</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="自己紹介を入力（任意）"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">{bio.length}/500</p>
          </div>
          
          {/* 場所 */}
          <div className="space-y-2">
            <Label htmlFor="location">場所</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="場所を入力（任意）"
              maxLength={50}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading || !displayName.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存する
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal; 