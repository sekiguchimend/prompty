import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { ReportReason, ReportTargetType, submitReport } from '../../lib/report-service';
import { useToast } from '../../components/ui/use-toast';
import { supabase } from '../../lib/supabaseClient';

// 報告理由の選択肢
const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: 'inappropriate', label: '不適切なコンテンツ' },
  { id: 'spam', label: 'スパム・宣伝' },
  { id: 'harassment', label: '嫌がらせ・ハラスメント' },
  { id: 'misinformation', label: '誤情報・フェイク情報' },
  { id: 'other', label: 'その他' }
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPostId: string;
  onComplete?: () => void;
  targetType?: ReportTargetType; // 'comment' または 'prompt'（省略時は 'prompt'）
  promptId?: string; // コメント報告時に親プロンプトIDが必要
}

const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onOpenChange,
  selectedPostId,
  onComplete,
  targetType = 'prompt', // デフォルトは投稿（プロンプト）の報告
  promptId
}) => {
  const [selectedReportReasonId, setSelectedReportReasonId] = useState<ReportReason>('inappropriate');
  const [reportReason, setReportReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  // 現在のユーザーを取得
  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
    };
    
    if (open) {
      fetchUser();
    }
  }, [open]);

  // 報告ダイアログを閉じる
  const handleCloseReportDialog = () => {
    onOpenChange(false);
    setSelectedReportReasonId('inappropriate');
    setReportReason('');
    setIsSubmitting(false);
  };
  
  // 報告を処理する関数
  const handleReport = async () => {
    if (!selectedReportReasonId) {
      toast({
        title: "報告理由を選択してください",
        description: "報告を送信するには理由の選択が必要です。",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "報告するにはログインしてください。",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // コメント報告時は親プロンプトIDが必要
      if (targetType === 'comment' && !promptId) {
        throw new Error("親プロンプトIDが指定されていません");
      }
      
      // 実際のデータベースに報告を送信
      await submitReport({
        target_type: targetType,
        target_id: selectedPostId,
        prompt_id: targetType === 'comment' ? promptId! : selectedPostId, // コメント報告時は親プロンプトID、投稿報告時は投稿IDを使用
        reporter_id: currentUser.id,
        reason: selectedReportReasonId,
        details: reportReason.trim() || undefined,
      });
      
      // 報告完了後の処理
      onOpenChange(false);
      
      // 明示的にトースト通知を表示
      toast({
        title: "報告を受け付けました",
        description: "ご報告ありがとうございます。内容を確認いたします。",
      });
      
      // 状態をリセット
      setSelectedReportReasonId('inappropriate');
      setReportReason('');
      setIsSubmitting(false);
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('報告送信エラー:', error);
      setIsSubmitting(false);
      
      // エラー時にトースト通知
      toast({
        title: "報告送信エラー",
        description: "報告の送信中にエラーが発生しました。後でもう一度お試しください。",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{targetType === 'comment' ? 'コメントを報告' : 'コンテンツを報告'}</DialogTitle>
          <DialogDescription>
            このコンテンツを報告する理由を選択してください。すべての報告は匿名で処理されます。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">報告理由</h4>
              <RadioGroup 
                value={selectedReportReasonId} 
                onValueChange={(value) => setSelectedReportReasonId(value as ReportReason)}
                className="space-y-2"
              >
                {REPORT_REASONS.map((reason) => (
                  <div key={reason.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.id} id={`reason-${reason.id}`} />
                    <Label htmlFor={`reason-${reason.id}`} className="text-sm font-normal">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">詳細情報（任意）</h4>
              <Textarea 
                placeholder="追加の詳細情報があれば入力してください..." 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleCloseReportDialog}>
            キャンセル
          </Button>
          <Button 
            type="button" 
            onClick={handleReport} 
            disabled={isSubmitting || !currentUser}
          >
            {isSubmitting ? '送信中...' : '報告する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog; 