import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Footer from '../components/footer';

import { useToast } from '../components/ui/use-toast';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabaseClient';
import ProfileEditModal from '../components/profile-edit-modal';

// Types
import { ProfileData } from '../types/profile';
import { PostData, formatDate } from '../types/content';
import { MagazineData } from '../types/content';
import { UserData } from '../types/profile';

// Components
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfileTabContent from '../components/profile/ProfileTabContent';
import Head from 'next/head';

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
      
      // Process posts data
      const processedPosts: PostData[] = postsData.map((post: any) => ({
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
        author: {
          id: user.id,
          display_name: profileData.display_name as string | null,
          username: (profileData.username as string) || '',
          avatar_url: (profileData.avatar_url as string) || null
        }
      }));
      
      // Process magazines data
      const processedMagazines: MagazineData[] = magazinesData ? magazinesData.map((magazine: any) => ({
        id: magazine.id as string,
        title: magazine.title as string,
        cover_url: (magazine.cover_url as string) || null,
        articles_count: (magazine.articles_count as number) || 0
      })) : [];
      
      // Set state
      const completeProfileData: ProfileData = {
        id: profileData.id as string,
        username: (profileData.username as string) || '',
        display_name: profileData.display_name as string | null,
        bio: (profileData.bio as string) || null,
        avatar_url: (profileData.avatar_url as string) || null,
        location: (profileData.location as string) || null,
        followers_count: followersCount || 0,
        following_count: followingCount || 0
      };
      
      setProfileData(completeProfileData);
      setPosts(processedPosts);
      setSavedPosts(savedPostsData);
      setMagazines(processedMagazines);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "エラー",
        description: "プロフィール情報の取得に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // フォロー関連データを取得
  const fetchFollowData = async () => {
    if (!user) return;
    
    try {
      // フォロー中のユーザーを取得（外部キー制約名を使用）
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles!follows_following_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            bio
          )
        `)
        .eq('follower_id', user.id);
        
      if (followingError) throw followingError;
      
      const followingUsers: UserData[] = followingData?.map((follow: any) => ({
        id: follow.profiles.id as string,
        username: (follow.profiles.username as string) || '',
        display_name: follow.profiles.display_name as string | null,
        avatar_url: (follow.profiles.avatar_url as string) || null,
        bio: (follow.profiles.bio as string) || null,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        is_following: true
      })) || [];
      
      // フォロワーを取得（外部キー制約名を使用）
      const { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select(`
          follower_id,
          profiles!follows_follower_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            bio
          )
        `)
        .eq('following_id', user.id);
        
      if (followersError) throw followersError;
      
      const followerUsers: UserData[] = followersData?.map((follow: any) => ({
        id: follow.profiles.id as string,
        username: (follow.profiles.username as string) || '',
        display_name: follow.profiles.display_name as string | null,
        avatar_url: (follow.profiles.avatar_url as string) || null,
        bio: (follow.profiles.bio as string) || null,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        is_following: false
      })) || [];
      
      // 相互フォローのユーザーを特定
      const followingIds = followingUsers.map(user => user.id);
      const followerIds = followerUsers.map(user => user.id);
      const mutualIds = followingIds.filter(id => followerIds.includes(id));
      
      const mutualUsers: UserData[] = followingUsers.filter(user => mutualIds.includes(user.id));
      
      // フォロワーリストでの is_following フラグを更新
      const updatedFollowerUsers = followerUsers.map(user => ({
        ...user,
        is_following: followingIds.includes(user.id)
      }));
      
      setFollowingUsers(followingUsers);
      setFollowerUsers(updatedFollowerUsers);
      setMutualUsers(mutualUsers);
      
    } catch (error) {
      console.error('Error fetching follow data:', error);
    }
  };
  
  useEffect(() => {
    fetchUserData();
    fetchFollowData();
  }, [user]);
  
  // Profile edit handler
  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };
  
  const handleProfileUpdated = () => {
    fetchUserData(); // Refresh data after update
    toast({
      title: "更新完了",
      description: "プロフィールが更新されました。",
    });
  };
  
  // Create post handler
  const handleCreatePost = () => {
    router.push('/create-post');
  };
  
  // Create magazine handler
  const handleCreateMagazine = () => {
    router.push('/CreateMagazine');
  };
  
  // Follow toggle handler
  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    if (!user) return;
    
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
      } else {
        // フォロー
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
          
        if (error) throw error;
      }
      
      // フォローデータを再取得
      await fetchFollowData();
      
      toast({
        title: isFollowing ? "フォロー解除しました" : "フォローしました",
        description: isFollowing ? "フォローを解除しました。" : "フォローしました。",
      });
      
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "エラー",
        description: "操作に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-16">
        <p>読み込み中...</p>
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-16">
        <p>プロフィールが見つかりません。</p>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>{profileData?.display_name ? `${profileData.display_name}のプロフィール | Prompty` : 'プロフィール | Prompty'}</title>
        <meta name="description" content={profileData?.bio || `${profileData?.display_name || 'ユーザー'}のプロフィールページです。投稿数: ${posts.length}件、フォロワー: ${profileData?.followers_count || 0}人、フォロー中: ${profileData?.following_count || 0}人`} />
        <meta name="keywords" content={`プロフィール,${profileData?.display_name || 'ユーザー'},AIプロンプト,投稿,フォロー,Prompty`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="profile" />
        <meta property="og:url" content="https://prompty-ai.com/profile" />
        <meta property="og:title" content={`${profileData?.display_name || 'ユーザー'}のプロフィール | Prompty`} />
        <meta property="og:description" content={profileData?.bio || `${profileData?.display_name || 'ユーザー'}のプロフィールページです。`} />
        <meta property="og:image" content={profileData?.avatar_url || 'https://prompty-ai.com/images/prompty_logo.jpg'} />
        <meta property="og:site_name" content="Prompty" />
        <meta property="profile:username" content={profileData?.display_name || 'ユーザー'} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://prompty-ai.com/profile" />
        <meta name="twitter:title" content={`${profileData?.display_name || 'ユーザー'}のプロフィール | Prompty`} />
        <meta name="twitter:description" content={profileData?.bio || `${profileData?.display_name || 'ユーザー'}のプロフィールページです。`} />
        <meta name="twitter:image" content={profileData?.avatar_url || 'https://prompty-ai.com/images/prompty_logo.jpg'} />
        
        {/* Additional SEO */}
        <meta name="robots" content="noindex, nofollow" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": profileData?.display_name || 'ユーザー',
              "description": profileData?.bio || '',
              "image": profileData?.avatar_url,
              "url": "https://prompty-ai.com/profile",
              "worksFor": {
                "@type": "Organization",
                "name": "Prompty"
              }
            })
          }}
        />
      </Head>
      <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <ProfileHeader 
            profileData={profileData}
            onEditProfile={handleEditProfile}
            windowWidth={windowWidth}
          />
          
          <ProfileTabs 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          <ProfileTabContent 
            activeTab={activeTab}
            posts={posts}
            savedPosts={savedPosts}
            magazines={magazines}
            followingUsers={followingUsers}
            followerUsers={followerUsers}
            mutualUsers={mutualUsers}
            currentUserId={user?.id || null}
            onCreatePost={handleCreatePost}
            onCreateMagazine={handleCreateMagazine}
            onFollowToggle={handleFollowToggle}
            followLoading={followLoading}
          />
        </div>
      </main>
      
      <Footer />
      
      {isEditModalOpen && (
        <ProfileEditModal 
          isOpen={isEditModalOpen}
          userData={profileData}
          onClose={() => setIsEditModalOpen(false)}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
      </div>
    </>
  );
};

export default UserProfilePage; 