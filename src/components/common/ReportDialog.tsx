import React, { useState } from 'react';
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
import { ReportReason, ReportTargetType, submitReport } from '../../lib/report-service';
import { useToast } from '../ui/use-toast';

type ReportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;    // 報告対象ID（コメントIDまたはプロンプトID）
  promptId: string;    // 親プロンプトID
  userId: string | null;
  targetType: ReportTargetType; // 'comment' または 'prompt'
};

// 報告理由のラベル
const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: 'inappropriate', label: '不適切なコンテンツ' },
  { id: 'spam', label: 'スパム' },
  { id: 'harassment', label: '嫌がらせ・ハラスメント' },
  { id: 'misinformation', label: '誤情報・虚偽情報' },
  { id: 'other', label: 'その他' },
];

/**
 * 共通の報告ダイアログコンポーネント
 * コメントとプロンプト（コンテンツ）の両方の報告に対応
 */
const ReportDialog: React.FC<ReportDialogProps> = ({
  isOpen,
  onClose,
  targetId,
  promptId,
  userId,
  targetType,
}) => {
  const [reason, setReason] = useState<ReportReason>('inappropriate');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // ダイアログタイトルを取得
  const getDialogTitle = () => {
    return targetType === 'comment' 
      ? 'コメントを報告' 
      : 'コンテンツを報告';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetId || !userId) {
      toast({
        title: "エラー",
        description: "報告するにはログインが必要です",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await submitReport({
        target_type: targetType,
        target_id: targetId,
        prompt_id: promptId,
        reporter_id: userId,
        reason,
        details: details.trim() || undefined,
      });
      
      // 成功メッセージはsubmitReport内で表示されます
      onClose();
      setReason('inappropriate');
      setDetails('');
      
    } catch (error) {
      console.error('報告中にエラーが発生:', error);
      // エラーメッセージはsubmitReport内で表示されます
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            このコンテンツを報告する理由を選択してください。すべての報告は匿名で処理されます。
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">報告理由</h4>
            <RadioGroup value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
              {REPORT_REASONS.map((reasonItem) => (
                <div key={reasonItem.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={reasonItem.id} id={`reason-${reasonItem.id}`} />
                  <Label htmlFor={`reason-${reasonItem.id}`}>{reasonItem.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div>
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