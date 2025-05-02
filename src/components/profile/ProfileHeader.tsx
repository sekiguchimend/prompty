import React from 'react';
import { useRouter } from 'next/router';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import { Edit, MoreHorizontal, Settings } from 'lucide-react';
import { ProfileData, getDisplayName, getAvatarUrl } from '../../types/profile';

interface ProfileHeaderProps {
  profileData: ProfileData;
  onEditProfile: () => void;
  windowWidth: number;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  profileData, 
  onEditProfile,
  windowWidth
}) => {
  const router = useRouter();
  const isMobile = windowWidth < 640;
  
  // 表示名を取得（nullや空の場合は「匿名」）
  const displayName = getDisplayName(profileData.display_name);
  // アバターURLを取得
  const avatarUrl = getAvatarUrl(profileData.avatar_url);
  
  return (
    <div className="border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-4xl py-4 md:py-6">
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
          {/* アバター */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <Avatar className="h-20 w-20 md:h-24 md:w-24 rounded-full border border-gray-200">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          
          {/* プロフィール情報 */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold">{displayName}</h1>
                <p className="text-gray-500 text-sm">
                  @{profileData.username}
                </p>
              </div>
              
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <Button 
                  variant="outline"
                  className="px-4 py-2 text-sm h-9 rounded-full border-gray-300"
                  onClick={onEditProfile}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  プロフィールを編集
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="p-2 h-9 w-9 rounded-full border-gray-300">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push('/SettingsPage')} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>アカウント設定</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* プロフィールの自己紹介 */}
            <div className="my-4">
              <p className="text-sm text-gray-700 whitespace-pre-line">{profileData.bio || ''}</p>
            </div>
            
            {/* 追加情報 */}
            <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-500 mb-4">
              {profileData.location && (
                <div className="flex items-center">
                  <span>{profileData.location}</span>
                </div>
              )}
            </div>
            
            {/* フォロー情報 */}
            <div className="flex justify-center md:justify-start space-x-6 text-sm">
              <button 
                onClick={() => router.push(`?tab=following`)} 
                className="flex items-center hover:text-blue-500"
              >
                <span className="font-bold">{profileData.following_count}</span>
                <span className="ml-1 text-gray-500">フォロー</span>
              </button>
              <button 
                onClick={() => router.push(`?tab=followers`)}
                className="flex items-center hover:text-blue-500"
              >
                <span className="font-bold">{profileData.followers_count}</span>
                <span className="ml-1 text-gray-500">フォロワー</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader; 