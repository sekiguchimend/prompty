import React from 'react';
import { useRouter } from 'next/router';
import { Button } from '../../components/ui/button';
import { Plus, BookOpen, Bookmark, UserPlus, Users, UserCheck } from 'lucide-react';
import { PostData } from '../../types/content';
import { MagazineData } from '../../types/content';
import { UserData } from '../../types/profile';
import PostCard from './PostCard';
import MagazineCard from './MagazineCard';
import UserCard from './UserCard';

interface ProfileTabContentProps {
  activeTab: string;
  posts: PostData[];
  savedPosts: PostData[];
  magazines: MagazineData[];
  followingUsers: UserData[];
  followerUsers: UserData[];
  mutualUsers: UserData[];
  currentUserId: string | null;
  followLoading: {[key: string]: boolean};
  onCreatePost: () => void;
  onCreateMagazine: () => void;
  onFollowToggle: (userId: string, isFollowing: boolean) => void;
}

const ProfileTabContent: React.FC<ProfileTabContentProps> = ({
  activeTab,
  posts,
  savedPosts,
  magazines,
  followingUsers,
  followerUsers,
  mutualUsers,
  currentUserId,
  followLoading,
  onCreatePost,
  onCreateMagazine,
  onFollowToggle
}) => {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 max-w-4xl my-4 md:my-6">
      {activeTab === 'posts' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">あなたの投稿</h2>
            <Button onClick={onCreatePost} className="px-4 py-2 text-sm h-9 rounded-full bg-black hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              新規投稿
            </Button>
          </div>
          
          {posts.length > 0 ? (
            posts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="text-center py-10">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">まだ投稿がありません</p>
              <Button onClick={onCreatePost} className="mt-4 px-4 py-2 text-sm h-9 rounded-full bg-black hover:bg-gray-800">
                最初の投稿を作成
              </Button>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'saved' && (
        <div>
          <h2 className="text-lg font-bold mb-6">保存した投稿</h2>
          
          {savedPosts.length > 0 ? (
            savedPosts.map(post => <PostCard key={post.id} post={post} isSaved={true} />)
          ) : (
            <div className="text-center py-10">
              <Bookmark className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">保存した投稿はありません</p>
              <Button onClick={() => router.push('/')} className="mt-4 px-4 py-2 text-sm h-9 rounded-full bg-black hover:bg-gray-800">
                投稿を探す
              </Button>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'magazines' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">あなたのマガジン</h2>
            <Button className="px-4 py-2 text-sm h-9 rounded-full bg-black hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              新規マガジン
            </Button>
          </div>
              
          {magazines.length > 0 ? (
            <div className="space-y-4">
              {magazines.map(magazine => <MagazineCard key={magazine.id} magazine={magazine} />)}
            </div>
          ) : (
            <div className="text-center py-10">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">まだマガジンがありません</p>
              <Button className="mt-4 px-4 py-2 text-sm h-9 rounded-full bg-black hover:bg-gray-800">
                最初のマガジンを作成
              </Button>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'following' && (
        <div>
          <h2 className="text-lg font-bold mb-6">フォロー中のユーザー</h2>
          
          {followingUsers.length > 0 ? (
            <div className="bg-white rounded-lg">
              {followingUsers.map(userData => (
                <UserCard 
                  key={userData.id} 
                  userData={userData} 
                  currentUserId={currentUserId} 
                  followLoading={followLoading} 
                  onFollowToggle={onFollowToggle} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">まだ誰もフォローしていません</p>
              <Button onClick={() => router.push('/')} className="mt-4 px-4 py-2 text-sm h-9 rounded-full bg-black hover:bg-gray-800">
                ユーザーを探す
              </Button>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'followers' && (
        <div>
          <h2 className="text-lg font-bold mb-6">フォロワー</h2>
          
          {followerUsers.length > 0 ? (
            <div className="bg-white rounded-lg">
              {followerUsers.map(userData => (
                <UserCard 
                  key={userData.id} 
                  userData={userData} 
                  currentUserId={currentUserId} 
                  followLoading={followLoading} 
                  onFollowToggle={onFollowToggle} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">まだフォロワーがいません</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'friends' && (
        <div>
          <h2 className="text-lg font-bold mb-6">相互フォロー中のユーザー</h2>
          
          {mutualUsers.length > 0 ? (
            <div className="bg-white rounded-lg">
              {mutualUsers.map(userData => (
                <UserCard 
                  key={userData.id} 
                  userData={userData} 
                  currentUserId={currentUserId} 
                  followLoading={followLoading} 
                  onFollowToggle={onFollowToggle} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">相互フォロー中のユーザーはいません</p>
              <Button onClick={() => router.push('?tab=followers')} className="mt-4 px-4 py-2 text-sm h-9 rounded-full bg-black hover:bg-gray-800">
                フォロワーを確認する
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileTabContent; 