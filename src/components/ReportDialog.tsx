import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

const ReportDialog: React.FC<ReportDialogProps> = ({ isOpen, onClose, postId }) => {
  // 選択された理由
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  // 詳細テキスト
  const [details, setDetails] = useState('');
  // 送信中状態
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 報告理由のリスト
  const reportReasons = [
    { id: 'spam', label: 'スパムまたは宣伝' },
    { id: 'inappropriate', label: '不適切なコンテンツ' },
    { id: 'copyright', label: '著作権侵害' },
    { id: 'harassment', label: 'ハラスメントまたは嫌がらせ' },
    { id: 'misinformation', label: '誤情報' },
    { id: 'other', label: 'その他' },
  ];

  // チェックボックスの状態を変更
  const handleReasonChange = (reasonId: string, e?: React.MouseEvent) => {
    // イベントが存在する場合は伝播を停止
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setSelectedReasons(prev => {
      if (prev.includes(reasonId)) {
        return prev.filter(id => id !== reasonId);
      } else {
        return [...prev, reasonId];
      }
    });
  };

  // 報告を送信
  const handleSubmit = async () => {
    if (selectedReasons.length === 0) {
      return; // 理由が選択されていない場合は送信しない
    }

    setIsSubmitting(true);

    try {
      // ここに実際の送信処理を実装
      console.log('報告内容:', {
        postId,
        reasons: selectedReasons,
        details
      });

      // 成功時の処理
      setTimeout(() => {
        setIsSubmitting(false);
        setSelectedReasons([]);
        setDetails('');
        onClose();
      }, 500);
    } catch (error) {
      console.error('報告送信エラー:', error);
      setIsSubmitting(false);
    }
  };

  // onOpenChangeハンドラーをラップして誤ってダイアログが閉じないように制御
  const handleOpenChange = (open: boolean) => {
    // チェックボックスクリック時などの誤操作でダイアログが閉じないようにする
    if (!open) {
      // ダイアログを閉じる場合のみonCloseを呼び出す
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-medium">投稿を報告</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            この投稿を報告する理由を選択してください。あなたの報告は匿名で送信されます。
          </p>

          <div className="space-y-3">
            {reportReasons.map((reason) => (
              <div 
                key={reason.id} 
                className="flex items-center space-x-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox 
                  id={reason.id}
                  checked={selectedReasons.includes(reason.id)}
                  onCheckedChange={() => handleReasonChange(reason.id)}
                  onClick={(e) => {
                    // クリックイベントで伝播を停止
                    e.stopPropagation();
                  }}
                />
                <Label 
                  htmlFor={reason.id} 
                  className="text-sm font-normal cursor-pointer"
                  onClick={(e) => {
                    // ラベルクリック時にも伝播を停止し、チェックボックスの状態を変更
                    e.stopPropagation();
                    e.preventDefault();
                    handleReasonChange(reason.id, e);
                  }}
                >
                  {reason.label}
                </Label>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Label htmlFor="details" className="text-sm font-medium block mb-2">
              詳細（任意）
            </Label>
            <Textarea
              id="details"
              placeholder="詳細な情報を入力してください"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full h-20 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="mr-2"
          >
            キャンセル
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleSubmit();
            }}
            disabled={selectedReasons.length === 0 || isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? '送信中...' : '報告する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog; 