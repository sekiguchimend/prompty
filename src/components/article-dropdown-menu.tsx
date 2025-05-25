import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Trash2 } from 'lucide-react';
import { Edit } from 'lucide-react';
import { Copy } from 'lucide-react';
import { Eye } from 'lucide-react';
import { EyeOff } from 'lucide-react';
import { Archive } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';

interface ArticleDropdownMenuProps {
  articleId: string;
  isPublished?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onTogglePublish?: (id: string) => void;
  onArchive?: (id: string) => void;
}

const ArticleDropdownMenu: React.FC<ArticleDropdownMenuProps> = ({
  articleId,
  isPublished = false,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePublish,
  onArchive
}) => {
  const handleEdit = () => {
    if (onEdit) onEdit(articleId);
  };

  const handleDelete = () => {
    if (window.confirm('この記事を削除してもよろしいですか？')) {
      if (onDelete) onDelete(articleId);
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) onDuplicate(articleId);
  };

  const handleTogglePublish = () => {
    if (onTogglePublish) onTogglePublish(articleId);
  };

  const handleArchive = () => {
    if (onArchive) onArchive(articleId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="more-options flex items-center justify-center h-8 w-8 rounded-full text-gray-500 hover:bg-gray-100">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          <span>編集する</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleTogglePublish} className="cursor-pointer">
          {isPublished ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              <span>非公開にする</span>
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              <span>公開する</span>
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleDuplicate} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          <span>複製する</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleArchive} className="cursor-pointer">
          <Archive className="mr-2 h-4 w-4" />
          <span>アーカイブする</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleDelete} 
          className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>削除する</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ArticleDropdownMenu; 