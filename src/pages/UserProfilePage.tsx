import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Footer from '../components/Footer';

import { useToast } from '../components/ui/use-toast';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabaseClient';
import ProfileEditModal from '../components/ProfileEditModal';

// Types
import { ProfileData } from '../types/profile';
import { PostData, formatDate } from '../types/content';
import { MagazineData } from '../types/content';
import { UserData } from '../types/profile';

// Components
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfileTabContent from '../components/profile/ProfileTabContent';

const UserProfilePage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('posts');
  const [windowWidth, setWindowWidth] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostData[]>([]);
  const [magazines, setMagazines] = useState<MagazineData[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<UserData[]>([]);
  const [followerUsers, setFollowerUsers] = useState<UserData[]>([]);
  const [mutualUsers, setMutualUsers] = useState<UserData[]>([]);
  const [followLoading, setFollowLoading] = useState<{[key: string]: boolean}>({});
  
  // Detect screen size
  useEffect(() => {
    // Only access window object on client side
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // URLクエリからタブを設定
  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab as string);
    }
  }, [router.query.tab]);
  
  // Fetch user data
  const fetchUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, location')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      // フォロワー数を取得
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);
      
      // フォロー数を取得
      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);
      
      // Fetch user posts
      const { data: postsData, error: postsError } = await supabase
        .from('prompts')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          created_at,
          view_count,
          is_premium,
          price,
          likes:likes(count),
          comments:comments(count)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
        
      if (postsError) throw postsError;
      
      // Fetch saved/bookmarked posts
      const { data: bookmarksData, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select(`
          prompt_id,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (bookmarksError) throw bookmarksError;
      
      // 保存された投稿のIDを取得
      const promptIds = bookmarksData.map(bookmark => bookmark.prompt_id);
      
      // 保存された投稿の詳細情報を取得
      let savedPostsData: PostData[] = [];
      
      if (promptIds.length > 0) {
        const { data: promptsData, error: promptsError } = await supabase
          .from('prompts')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            created_at,
            view_count,
            is_premium,
            price,
            author_id,
            likes(count),
            comments(count)
          `)
          .in('id', promptIds);
          
        if (promptsError) throw promptsError;
        
        // 著者情報を取得
        const authorIds = promptsData.map((post: any) => post.author_id).filter((id: string) => id);
        
        let authorProfiles: {[key: string]: any} = {};
        
        if (authorIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url')
            .in('id', authorIds);
            
          if (!profilesError && profiles) {
            // 著者IDをキーとしたオブジェクトに変換
            authorProfiles = profiles.reduce((acc: {[key: string]: any}, profile: any) => {
              acc[profile.id] = profile;
              return acc;
            }, {});
          }
        }
        
        savedPostsData = promptsData.map((post: any) => {
          const authorProfile = authorProfiles[post.author_id] || null;
          
          return {
            id: post.id as string,
            title: post.title as string,
            description: (post.description as string) || null,
            thumbnail_url: post.thumbnail_url as string | undefined,
            created_at: formatDate(post.created_at as string),
            view_count: (post.view_count as number) || 0,
            like_count: Array.isArray(post.likes) && post.likes.length > 0 ? (post.likes[0].count as number) || 0 : 0,
            comment_count: Array.isArray(post.comments) && post.comments.length > 0 ? (post.comments[0].count as number) || 0 : 0,
            is_premium: post.is_premium as boolean || false,
            price: post.price as number || 0,
            author: authorProfile ? {
              id: authorProfile.id as string,
              display_name: authorProfile.display_name as string | null,
              username: (authorProfile.username as string) || '',
              avatar_url: (authorProfile.avatar_url as string) || null
            } : undefined
          };
        });
      }
      
      // Fetch magazines (collections of prompts)
      const { data: magazinesData, error: magazinesError } = await supabase
        .from('magazines') // Assuming there's a magazines table
        .select(`
          id,
          title,
          cover_url,
          articles_count
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
        
      // Process the data
      if (profileData) {
        setProfileData({
          id: profileData.id as string,
          username: (profileData.username as string) || '',
          display_name: profileData.display_name as string | null,
          bio: profileData.bio as string | null,
          avatar_url: profileData.avatar_url as string | null,
          location: profileData.location as string | null,
          followers_count: followersCount || 0,
          following_count: followingCount || 0
        });
      }
      
      if (postsData) {
        setPosts(postsData.map((post: any) => ({
          id: post.id as string,
          title: post.title as string,
          description: (post.description as string) || null,
          thumbnail_url: post.thumbnail_url as string | undefined,
          created_at: formatDate(post.created_at as string),
          view_count: post.view_count as number,
          like_count: Array.isArray(post.likes) && post.likes.length > 0 ? (post.likes[0].count as number) || 0 : 0,
          comment_count: Array.isArray(post.comments) && post.comments.length > 0 ? (post.comments[0].count as number) || 0 : 0,
          is_premium: post.is_premium as boolean,
          price: post.price as number
        })));
      }
      
      setSavedPosts(savedPostsData);
      
      if (!magazinesError && magazinesData) {
        setMagazines(magazinesData.map((magazine: any) => ({
          id: magazine.id as string,
          title: magazine.title as string,
          cover_url: magazine.cover_url as string | null,
          articles_count: magazine.articles_count as number
        })));
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: "データ取得エラー",
        description: "プロフィール情報の取得に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // フォロー関連のユーザーデータを取得
  const fetchFollowData = async () => {
    if (!user) return;
    
    try {
      // フォロー中のユーザーのIDを取得
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
        
      if (followingError) throw followingError;
      
      // フォロワーのIDを取得
      const { data: followerData, error: followerError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', user.id);
        
      if (followerError) throw followerError;
      
      // フォローしているユーザーとフォロワーのIDリストを抽出
      const followingIds = followingData.map(item => item.following_id as string);
      const followerIds = followerData.map(item => item.follower_id as string);
      
      // 相互フォローしているユーザー（友達）のIDを特定
      const mutualIds = followingIds.filter(id => followerIds.includes(id));
      
      // フォロー中のユーザーとフォロワーの詳細情報を取得
      let followingProfiles: UserData[] = [];
      let followerProfiles: UserData[] = [];
      
      // フォロー中のユーザープロフィールを取得
      if (followingIds.length > 0) {
        const { data: followingProfilesData, error: followingProfilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', followingIds);
          
        if (followingProfilesError) throw followingProfilesError;
        
        followingProfiles = followingProfilesData.map(profile => ({
          id: profile.id as string,
          username: profile.username as string || '不明なユーザー',
          display_name: profile.display_name as string | null,
          avatar_url: profile.avatar_url as string | null,
          is_following: true
        }));
      }
      
      // フォロワーのプロフィールを取得
      if (followerIds.length > 0) {
        const { data: followerProfilesData, error: followerProfilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', followerIds);
          
        if (followerProfilesError) throw followerProfilesError;
        
        followerProfiles = followerProfilesData.map(profile => ({
          id: profile.id as string,
          username: profile.username as string || '不明なユーザー',
          display_name: profile.display_name as string | null,
          avatar_url: profile.avatar_url as string | null,
          is_follower: true,
          is_following: followingIds.includes(profile.id as string)
        }));
      }
      
      // 相互フォローユーザーデータを抽出
      const mutualProfiles = followingProfiles.filter(user => 
        mutualIds.includes(user.id)
      );
      
      setFollowingUsers(followingProfiles);
      setFollowerUsers(followerProfiles);
      setMutualUsers(mutualProfiles);
      
    } catch (error) {
      console.error('Error fetching follow data:', error);
      toast({
        title: "データ取得エラー",
        description: "フォロー情報の取得に失敗しました。",
        variant: "destructive"
      });
    }
  };
  
  // 初回ロード時にデータを取得
  useEffect(() => {
    fetchUserData();
    fetchFollowData();
  }, [user, router, toast]);
  
  // Screen size breakpoints
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  
  // Go to edit profile page - モーダルを表示するように変更
  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  // プロフィールが更新されたときの処理
  const handleProfileUpdated = () => {
    fetchUserData(); // プロフィールデータを再取得
    toast({
      title: "プロフィールを更新しました",
      description: "変更内容が反映されました",
    });
  };
  
  // Create new post
  const handleCreatePost = () => {
    router.push('/CreatePost');
  };
  
  // Create new magazine
  const handleCreateMagazine = () => {
    router.push('/create-magazine');
  };
  
  // フォロー/フォロー解除処理
  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    if (!user) {
      toast({
        title: "ログインが必要です",
        description: "この操作を行うにはログインが必要です",
        variant: "destructive"
      });
      return;
    }
    
    // 処理中のユーザーIDを記録
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      if (isFollowing) {
        // フォロー解除
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
          
        if (error) throw error;
        
        toast({
          title: "フォロー解除しました",
        });
      } else {
        // フォロー
        const { error } = await supabase
          .from('follows')
          .insert([
            { follower_id: user.id, following_id: userId }
          ]);
          
        if (error) throw error;
        
        toast({
          title: "フォローしました",
        });
      }
      
      // データを再取得
      fetchFollowData();
      fetchUserData();
      
    } catch (error) {
      console.error('Follow toggle error:', error);
      toast({
        title: "エラーが発生しました",
        description: "操作に失敗しました。時間をおいて再度お試しください。",
        variant: "destructive"
      });
    } finally {
      // 処理完了
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="pt-16 flex items-center justify-center min-h-screen">
          <p>読み込み中...</p>
        </main>
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="min-h-screen bg-white">
        <main className="pt-16 flex flex-col items-center justify-center min-h-screen">
          <p className="text-lg mb-4">プロフィール情報が見つかりません</p>
          <button onClick={() => router.push('/settings?tab=profile')} className="px-4 py-2 bg-blue-500 text-white rounded-md">
            プロフィールを設定する
          </button>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      <main className={`pt-16 ${isMobile ? 'pt-20' : ''}`}>
        {/* Profile header */}
        <ProfileHeader 
          profileData={profileData} 
          onEditProfile={handleEditProfile} 
          windowWidth={windowWidth} 
        />
        
        {/* Tabs section */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Content section */}
        <ProfileTabContent 
          activeTab={activeTab}
          posts={posts}
          savedPosts={savedPosts}
          magazines={magazines}
          followingUsers={followingUsers}
          followerUsers={followerUsers}
          mutualUsers={mutualUsers}
          currentUserId={user?.id || null}
          followLoading={followLoading}
          onCreatePost={handleCreatePost}
          onCreateMagazine={handleCreateMagazine}
          onFollowToggle={handleFollowToggle}
        />
      </main>
      
      <Footer />
      
      {/* プロフィール編集モーダル */}
      {profileData && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          userData={{
            id: profileData.id,
            display_name: profileData.display_name || '',
            username: profileData.username,
            bio: profileData.bio || '',
            avatar_url: profileData.avatar_url || '',
            location: profileData.location || ''
          }}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
};

export default UserProfilePage;