import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { UserPlus, Users, UserCheck } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200 sticky top-16 bg-white z-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <Tabs 
          defaultValue="posts" 
          className="w-full" 
          value={activeTab} 
          onValueChange={onTabChange}
        >
          <TabsList className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 bg-transparent h-auto p-0 gap-0 w-full overflow-x-auto">
            <TabsTrigger 
              value="posts"
              className="px-3 sm:px-5 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-xs sm:text-sm font-medium text-gray-500 data-[state=active]:text-black whitespace-nowrap"
            >
              投稿
            </TabsTrigger>
            <TabsTrigger 
              value="saved"
              className="px-3 sm:px-5 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-xs sm:text-sm font-medium text-gray-500 data-[state=active]:text-black whitespace-nowrap"
            >
              保存済み
            </TabsTrigger>
            <TabsTrigger 
              value="magazines"
              className="px-3 sm:px-5 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-xs sm:text-sm font-medium text-gray-500 data-[state=active]:text-black whitespace-nowrap"
            >
              マガジン
            </TabsTrigger>
            <TabsTrigger 
              value="following"
              className="px-3 sm:px-5 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-xs sm:text-sm font-medium text-gray-500 data-[state=active]:text-black whitespace-nowrap"
            >
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline" />
              フォロー中
            </TabsTrigger>
            <TabsTrigger 
              value="followers"
              className="px-3 sm:px-5 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-xs sm:text-sm font-medium text-gray-500 data-[state=active]:text-black whitespace-nowrap"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline" />
              フォロワー
            </TabsTrigger>
            <TabsTrigger 
              value="friends"
              className="px-3 sm:px-5 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-xs sm:text-sm font-medium text-gray-500 data-[state=active]:text-black whitespace-nowrap"
            >
              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline" />
              友達
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfileTabs; 