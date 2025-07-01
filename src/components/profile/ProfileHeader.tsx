import React from 'react';
import { useRouter } from 'next/router';
import { Button } from '../ui/button';
import { UnifiedAvatar } from '../index';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import { Edit, MoreHorizontal, Settings } from 'lucide-react';
import { ProfileData, getAvatarUrl } from '../../types/profile';
import { getDisplayName } from '../../lib/avatar-utils';

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
  
  // 表示名を取得（nullや空の場合、または自動生成されたusernameの場合は「ユーザー」）
  const displayName = getDisplayName(profileData.display_name, profileData.username);
  // アバターURLを取得
  const avatarUrl = getAvatarUrl(profileData.avatar_url);
  
  return (
    <div className="border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-4xl py-4 md:py-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="flex justify-center sm:justify-start flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32">
              <UnifiedAvatar
                src={avatarUrl}
                displayName={displayName}
                size="xl"
                className="w-full h-full rounded-full border border-gray-200"
              />
            </div>
          </div>
          
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col gap-4">
              {/* 名前とボタン */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{displayName}</h1>
                  {profileData.username && (
                    <p className="text-sm sm:text-base text-gray-500 truncate">@{profileData.username}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-shrink-0">
                  <Button 
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    className="flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full border-gray-300"
                    onClick={onEditProfile}
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">プロフィールを編集</span>
                    <span className="sm:hidden">編集</span>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size={isMobile ? "sm" : "default"}
                        className="p-1.5 sm:p-2 h-7 w-7 sm:h-9 sm:w-9 rounded-full border-gray-300 flex-shrink-0"
                      >
                        <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>アカウント設定</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* プロフィールの自己紹介 */}
              {profileData.bio && (
                <div className="text-center sm:text-left">
                  <p className="text-sm sm:text-base text-gray-700 whitespace-pre-line leading-relaxed">{profileData.bio}</p>
                </div>
              )}
              
              {/* 追加情報 */}
              {profileData.location && (
                <div className="flex justify-center sm:justify-start">
                  <div className="text-xs sm:text-sm text-gray-500">
                    <span>{profileData.location}</span>
                  </div>
                </div>
              )}
              
              {/* フォロー情報 */}
              <div className="flex justify-center sm:justify-start space-x-4 sm:space-x-6 text-sm">
                <button 
                  onClick={() => router.push(`?tab=following`)} 
                  className="flex items-center hover:text-blue-500 transition-colors"
                >
                  <span className="font-bold text-sm sm:text-base">{profileData.following_count}</span>
                  <span className="ml-1 text-gray-500 text-xs sm:text-sm">フォロー</span>
                </button>
                <button 
                  onClick={() => router.push(`?tab=followers`)}
                  className="flex items-center hover:text-blue-500 transition-colors"
                >
                  <span className="font-bold text-sm sm:text-base">{profileData.followers_count}</span>
                  <span className="ml-1 text-gray-500 text-xs sm:text-sm">フォロワー</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader; 