import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { reportComment, ReportReason } from '../../lib/comment-report-service';

type ReportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  commentId: string | null;
  promptId: string;
  userId: string | null;
};

const ReportDialog: React.FC<ReportDialogProps> = ({
  isOpen,
  onClose,
  commentId,
  promptId,
  userId,
}) => {
  const [reason, setReason] = useState<ReportReason>('inappropriate');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentId || !userId) {
      // グローバルトーストは内部で呼び出されます
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await reportComment({
        comment_id: commentId,
        prompt_id: promptId,
        reporter_id: userId,
        reason,
        details: details.trim() || undefined,
      });
      
      // 成功メッセージはreportComment内で表示されます
      onClose();
      setReason('inappropriate');
      setDetails('');
      
    } catch (error) {
      console.error('コメント報告中にエラーが発生:', error);
      // エラーメッセージはreportComment内で表示されます
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>コメントを報告</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">報告理由</h4>
            <RadioGroup value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inappropriate" id="inappropriate" />
                <Label htmlFor="inappropriate">不適切なコンテンツ</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spam" id="spam" />
                <Label htmlFor="spam">スパム</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="harassment" id="harassment" />
                <Label htmlFor="harassment">嫌がらせ・ハラスメント</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="misinformation" id="misinformation" />
                <Label htmlFor="misinformation">誤情報・虚偽情報</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">その他</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="details">詳細（任意）</Label>
            <Textarea
              id="details"
              placeholder="報告の詳細を入力してください..."
              value={details}
              onChange={e => setDetails(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button 
              type="submit"
              variant="destructive"
              disabled={isSubmitting || !userId}
            >
              {isSubmitting ? '送信中...' : '報告する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog; 