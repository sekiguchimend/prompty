import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "../components/ui/dropdown-menu";
import { 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Archive,
  CheckSquare,
  ChevronDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ArticleActionsMenuProps {
  selectedCount: number;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onArchive?: () => void;
}

const ArticleActionsMenu: React.FC<ArticleActionsMenuProps> = ({
  selectedCount,
  onDelete,
  onDuplicate,
  onPublish,
  onUnpublish,
  onArchive
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-10 bg-white p-3 border-b border-gray-200 flex items-center shadow-sm">
      <div className="flex-1 flex items-center">
        <CheckSquare className="mr-2 h-5 w-5 text-gray-600" />
        <span className="text-sm font-medium">{selectedCount}件選択中</span>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-sm gap-1">
            一括操作
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onPublish} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            <span>公開する</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={onUnpublish} className="cursor-pointer">
            <EyeOff className="mr-2 h-4 w-4" />
            <span>非公開にする</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            <span>複製する</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={onArchive} className="cursor-pointer">
            <Archive className="mr-2 h-4 w-4" />
            <span>アーカイブする</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={onDelete} 
            className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>削除する</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ArticleActionsMenu; 