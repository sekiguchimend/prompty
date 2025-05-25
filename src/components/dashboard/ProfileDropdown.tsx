import React from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { UnifiedAvatar } from '../index';
import { Settings, LogOut, User, Bell, CreditCard } from 'lucide-react';

const ProfileDropdown: React.FC = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <UnifiedAvatar
            src="https://source.unsplash.com/random/100x100?face"
            displayName="ユーザー"
            size="sm"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">ユーザー名</p>
            <p className="text-xs leading-none text-muted-foreground">
              user@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="px-3 py-2 text-sm cursor-pointer rounded-md text-gray-700 focus:bg-gray-100 focus:text-gray-900">
          <User className="mr-3 h-4 w-4 text-gray-500" />
          プロフィール
        </DropdownMenuItem>
        <DropdownMenuItem className="px-3 py-2 text-sm cursor-pointer rounded-md text-gray-700 focus:bg-gray-100 focus:text-gray-900">
          <Bell className="mr-3 h-4 w-4 text-gray-500" />
          通知
        </DropdownMenuItem>
        <DropdownMenuItem className="px-3 py-2 text-sm cursor-pointer rounded-md text-gray-700 focus:bg-gray-100 focus:text-gray-900">
          <CreditCard className="mr-3 h-4 w-4 text-gray-500" />
          課金
        </DropdownMenuItem>
        <DropdownMenuItem className="px-3 py-2 text-sm cursor-pointer rounded-md text-gray-700 focus:bg-gray-100 focus:text-gray-900">
          <Settings className="mr-3 h-4 w-4 text-gray-500" />
          設定
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="px-3 py-2 text-sm cursor-pointer rounded-md text-gray-700 focus:bg-gray-100 focus:text-gray-900">
          <LogOut className="mr-3 h-4 w-4 text-gray-500" />
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown; 