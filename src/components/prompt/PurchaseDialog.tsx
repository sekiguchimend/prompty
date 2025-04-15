import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ArrowLeft } from 'lucide-react';

interface PromptDetails {
  title: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  price: number;
}

interface PurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: PromptDetails;
}

const PurchaseDialog: React.FC<PurchaseDialogProps> = ({ isOpen, onClose, prompt }) => {
  const handlePurchase = () => {
    // ここに購入処理を実装
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">購入の確認</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            以下のコンテンツを購入します
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-start space-x-4 py-4">
          <Avatar className="h-12 w-12 rounded-full border">
            <AvatarImage src={prompt.author.avatarUrl} alt={prompt.author.name} />
            <AvatarFallback>{prompt.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium mb-1">{prompt.title}</p>
            <p className="text-sm text-gray-500">{prompt.author.name}</p>
            <p className="font-bold mt-2">¥{prompt.price.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
          <p>購入後、すぐにコンテンツの全文が読めるようになります。</p>
          <p>購入履歴からいつでも読み返すことができます。</p>
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          <Button variant="outline" onClick={onClose} className="flex items-center mt-3 sm:mt-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-sm">コンテンツへ戻る</span>
          </Button>
          <Button onClick={handlePurchase} className="bg-gray-900 text-white hover:bg-gray-800">
            購入する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;
