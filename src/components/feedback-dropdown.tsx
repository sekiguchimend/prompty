import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { 
  CheckCircle2, 
  Trash2, 
  Mail, 
  FileDown, 
  MoreHorizontal
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ui/use-toast';

interface FeedbackDropdownProps {
  feedbackId: string;
  isRead: boolean;
  email?: string | null;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRefreshData?: () => void;
}

const FeedbackDropdown: React.FC<FeedbackDropdownProps> = ({
  feedbackId,
  isRead,
  email,
  onMarkAsRead,
  onDelete,
  onRefreshData
}) => {
  const { toast } = useToast();

  const handleMarkAsRead = async () => {
    if (isRead) return; // Already read
    
    if (onMarkAsRead) {
      onMarkAsRead(feedbackId);
    } else {
      try {
        const { error } = await supabase
          .from('feedback')
          .update({ is_read: true })
          .eq('id', feedbackId);
        
        if (error) throw error;
        
        if (onRefreshData) onRefreshData();
        
        toast({
          title: "既読にしました",
          description: "フィードバックを既読にしました",
        });
      } catch (error: any) {
        console.error('既読の設定に失敗しました:', error);
        toast({
          title: "既読の設定に失敗しました",
          description: error.message || "エラーが発生しました",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = () => {
    if (window.confirm('このフィードバックを削除してもよろしいですか？')) {
      if (onDelete) {
        onDelete(feedbackId);
      } else {
        supabase
          .from('feedback')
          .delete()
          .eq('id', feedbackId)
          .then(({ error }) => {
            if (error) {
              console.error('削除エラー:', error);
              toast({
                title: "削除に失敗しました",
                description: error.message,
                variant: "destructive",
              });
              return;
            }
            
            toast({
              title: "削除しました",
              description: "フィードバックを削除しました",
            });
            
            if (onRefreshData) onRefreshData();
          });
      }
    }
  };

  const handleReply = () => {
    if (email) {
      window.open(`mailto:${email}?subject=promptyフィードバックへの返信&body=以下のフィードバックについて、\n\nID: ${feedbackId}\n\n`);
    } else {
      toast({
        title: "返信できません",
        description: "このフィードバックにはメールアドレスが含まれていません",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    // Export feedback data as JSON
    supabase
      .from('feedback')
      .select('*')
      .eq('id', feedbackId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('エクスポートエラー:', error);
          toast({
            title: "エクスポートに失敗しました",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
        
        // Create and download file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `feedback-${feedbackId}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "エクスポートしました",
          description: "データをダウンロードしました",
        });
      });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center h-8 w-8 rounded-full text-gray-500 hover:bg-gray-100">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {!isRead && (
          <DropdownMenuItem onClick={handleMarkAsRead} className="cursor-pointer">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            <span>既読にする</span>
          </DropdownMenuItem>
        )}
        
        {email && (
          <DropdownMenuItem onClick={handleReply} className="cursor-pointer">
            <Mail className="mr-2 h-4 w-4" />
            <span>返信する</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={handleExport} className="cursor-pointer">
          <FileDown className="mr-2 h-4 w-4" />
          <span>エクスポート</span>
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

export default FeedbackDropdown; 