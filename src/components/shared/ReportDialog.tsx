import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/use-toast';
import { supabase } from '../../lib/supabaseClient';

export type ReportReason = 'inappropriate' | 'spam' | 'harassment' | 'misinformation' | 'other';
export type ReportTargetType = 'prompt' | 'comment';

export interface ReportData {
  target_type: ReportTargetType;
  target_id: string;
  prompt_id: string;
  reporter_id: string;
  reason: ReportReason;
  details?: string;
}

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetType?: ReportTargetType;
  promptId?: string;
  onComplete?: () => void;
}

const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: 'inappropriate', label: '不適切なコンテンツ' },
  { id: 'spam', label: 'スパム' },
  { id: 'harassment', label: 'ハラスメント・嫌がらせ' },
  { id: 'misinformation', label: '誤情報・虚偽情報' },
  { id: 'other', label: 'その他' }
];

const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onOpenChange,
  targetId,
  targetType = 'prompt',
  promptId,
  onComplete
}) => {
  const [reason, setReason] = useState<ReportReason>('inappropriate');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
    };
    
    if (open) {
      fetchUser();
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
    setReason('inappropriate');
    setDetails('');
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "コンテンツを報告するにはログインしてください。",
        variant: "destructive",
      });
      return;
    }

    if (targetType === 'comment' && !promptId) {
      toast({
        title: "エラー",
        description: "コメント報告には親プロンプトIDが必要です。",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const reportData: ReportData = {
        target_type: targetType,
        target_id: targetId,
        prompt_id: targetType === 'comment' ? promptId! : targetId,
        reporter_id: currentUser.id,
        reason,
        details: details.trim() || undefined,
      };

      const { error } = await supabase
        .from('content_reports')
        .insert(reportData);

      if (error) throw error;
      
      toast({
        title: "報告を受け付けました",
        description: "報告ありがとうございます。内容を確認いたします。",
      });
      
      handleClose();
      onComplete?.();
      
    } catch (error) {
      console.error('Report submission error:', error);
      toast({
        title: "報告に失敗しました",
        description: "報告の送信中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {targetType === 'comment' ? 'コメントを報告' : 'コンテンツを報告'}
          </DialogTitle>
          <DialogDescription>
            このコンテンツを報告する理由を選択してください。すべての報告は匿名で処理されます。
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">報告の理由</h4>
            <RadioGroup value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
              {REPORT_REASONS.map((reportReason) => (
                <div key={reportReason.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={reportReason.id} id={reportReason.id} />
                  <Label htmlFor={reportReason.id}>{reportReason.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="details">詳細（任意）</Label>
            <Textarea
              id="details"
              placeholder="追加の詳細があれば記入してください..."
              value={details}
              onChange={e => setDetails(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button 
              type="submit"
              variant="destructive"
              disabled={isSubmitting || !currentUser}
            >
              {isSubmitting ? '送信中...' : '報告を送信'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;