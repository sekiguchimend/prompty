
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: {
    title: string;
    author: {
      name: string;
    };
    price: number;
  };
}

const PurchaseDialog: React.FC<PurchaseDialogProps> = ({ isOpen, onClose, prompt }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 p-0 text-gray-500" 
              onClick={onClose}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-sm">記事へ戻る</span>
            </Button>
          </div>
          
          <DialogHeader className="pb-4 text-center">
            <DialogTitle className="text-xl font-bold">購入の確認</DialogTitle>
          </DialogHeader>
        </div>
        
        <div className="bg-white p-6 rounded-md mx-4 mb-4 border border-gray-100 shadow-sm">
          <h3 className="font-medium text-lg line-clamp-2 mb-2">{prompt.title}</h3>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded-sm">定価</span>
            <span className="text-xs text-gray-600">脳fixer</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <div></div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">¥ {prompt.price.toLocaleString()}</span>
              <button className="text-teal-500 flex items-center text-sm">
                <Heart className="h-4 w-4 mr-1" />
                チップを追加
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 text-center text-sm text-blue-600">
          <span>Amazon Pay支払いで総額2,025万円を山分け！</span>
          <a href="#" className="ml-2 text-blue-600 underline">詳細</a>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">お支払い</span>
            <div className="flex items-center text-gray-900">
              <span>クレジットカード</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </div>
          
          <Button 
            className="w-full bg-gray-900 text-white py-6 text-lg font-medium hover:bg-gray-800"
          >
            購入する
          </Button>
          
          <div className="flex justify-center mt-4 text-sm gap-4">
            <Link to="#" className="text-gray-500 hover:underline">購入時のご確認</Link>
            <Link to="#" className="text-gray-500 hover:underline">チップとは</Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;
