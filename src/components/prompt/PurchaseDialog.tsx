
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Heart, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit-card');

  const handlePaymentMethodClick = () => {
    setIsPaymentSheetOpen(true);
  };

  const handlePaymentMethodChange = (value: string) => {
    setSelectedPaymentMethod(value);
    setIsPaymentSheetOpen(false);
  };

  const getPaymentMethodLabel = () => {
    switch (selectedPaymentMethod) {
      case 'amazon-pay':
        return 'Amazon Pay';
      case 'paypay':
        return 'PayPay';
      case 'credit-card':
        return 'クレジットカード';
      case 'carrier':
        return '携帯キャリア決済';
      case 'paypal':
        return 'PayPal';
      default:
        return 'クレジットカード';
    }
  };

  return (
    <>
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
              <span className="text-xs text-gray-600">{prompt.author.name}</span>
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
              <div 
                className="flex items-center text-gray-900 cursor-pointer"
                onClick={handlePaymentMethodClick}
              >
                <span>{getPaymentMethodLabel()}</span>
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

      {/* Payment Method Selection Sheet */}
      <Sheet open={isPaymentSheetOpen} onOpenChange={setIsPaymentSheetOpen}>
        <SheetContent side="bottom" className="p-0 rounded-t-xl">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle className="text-xl font-bold text-center">お支払い方法</SheetTitle>
          </SheetHeader>
          <div className="p-6">
            <RadioGroup 
              value={selectedPaymentMethod} 
              onValueChange={handlePaymentMethodChange}
              className="gap-4"
            >
              <label className="flex items-center justify-between p-3 cursor-pointer rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <RadioGroupItem value="amazon-pay" id="amazon-pay" className="mr-4" />
                  <div className="flex items-center">
                    <img 
                      src="/lovable-uploads/485f5762-9e95-4574-b3ad-d6eef2bf889c.png" 
                      alt="Amazon Pay" 
                      className="h-8"
                      style={{ objectFit: 'contain', objectPosition: 'left' }}
                    />
                  </div>
                </div>
              </label>

              {selectedPaymentMethod === 'amazon-pay' && (
                <div className="bg-blue-50 p-3 ml-8 rounded-md text-sm text-blue-600">
                  Amazon Pay支払いで総額2,025万円を山分け！
                  <a href="#" className="ml-2 text-blue-600 underline">詳細</a>
                </div>
              )}

              <label className="flex items-center justify-between p-3 cursor-pointer rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <RadioGroupItem value="paypay" id="paypay" className="mr-4" />
                  <div className="flex items-center">
                    <svg width="130" height="36" viewBox="0 0 130 36" className="h-8">
                      <path d="M34.3,9.8c2.9,2.9,4.5,6.7,4.5,10.7c0,4-1.6,7.9-4.5,10.7c-2.9,2.9-6.7,4.5-10.7,4.5c-4,0-7.9-1.6-10.7-4.5 c-2.9-2.9-4.5-6.7-4.5-10.7c0-4,1.6-7.9,4.5-10.7c2.9-2.9,6.7-4.5,10.7-4.5C27.5,5.3,31.4,6.9,34.3,9.8z" fill="#f44" />
                      <path d="M34.3,9.8c2.9,2.9,4.5,6.7,4.5,10.7c0,4-1.6,7.9-4.5,10.7c-2.9,2.9-6.7,4.5-10.7,4.5c-4,0-7.9-1.6-10.7-4.5 c-2.9-2.9-4.5-6.7-4.5-10.7c0-4,1.6-7.9,4.5-10.7c2.9-2.9,6.7-4.5,10.7-4.5C27.5,5.3,31.4,6.9,34.3,9.8z" fill="#f44" />
                      <path d="M17.7,20.8v1.8h1.3v3.5h2.1v-3.5h1.8v-1.8h-1.8v-1c0-0.5,0.1-0.7,0.7-0.7h1.1v-2.1h-1.5c-1.6,0-2.4,1.3-2.4,2.5v1.4 H17.7z" fill="white" />
                      <path d="M27.5,18.5c-0.5-0.5-1.2-0.8-2-0.8c-0.8,0-1.5,0.3-2,0.8c-0.9,0.8-1,1.8-1,3.1c0,1.2,0.1,2.3,1,3.1 c0.5,0.5,1.2,0.8,2,0.8c0.8,0,1.5-0.3,2-0.8c0.9-0.8,1-1.8,1-3.1C28.5,20.3,28.4,19.3,27.5,18.5z M26.2,23.4c-0.1,0.2-0.4,0.3-0.7,0.3 c-0.3,0-0.5-0.1-0.7-0.3c-0.3-0.3-0.3-0.8-0.3-1.8c0-1,0.1-1.5,0.3-1.8c0.1-0.2,0.4-0.3,0.7-0.3c0.3,0,0.5,0.1,0.7,0.3 c0.3,0.3,0.3,0.8,0.3,1.8C26.5,22.5,26.4,23.1,26.2,23.4z" fill="white" />
                      <text x="45" y="23" fontFamily="Arial" fontSize="18" fontWeight="bold" fill="#f44">PayPay</text>
                    </svg>
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-3 cursor-pointer rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <RadioGroupItem value="credit-card" id="credit-card" className="mr-4" />
                  <div>
                    <span className="font-medium">クレジットカード</span>
                    {selectedPaymentMethod === 'credit-card' && (
                      <span className="ml-3 text-xs text-gray-500">現在のお支払い方法</span>
                    )}
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-3 cursor-pointer rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <RadioGroupItem value="carrier" id="carrier" className="mr-4" />
                  <span className="font-medium">携帯キャリア決済</span>
                </div>
              </label>

              <label className="flex items-center justify-between p-3 cursor-pointer rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <RadioGroupItem value="paypal" id="paypal" className="mr-4" />
                  <div className="flex items-center">
                    <svg width="85" height="23" viewBox="0 0 85 23" className="h-7">
                      <path d="M27.4,5.8h-4.6c-0.3,0-0.6,0.2-0.7,0.5l-1.9,12.3c0,0.2,0.1,0.4,0.3,0.4h2.2c0.3,0,0.6-0.2,0.7-0.5l0.5-3.4 c0-0.3,0.3-0.5,0.7-0.5h1.5c3.2,0,5-1.5,5.5-4.5c0.2-1.3,0-2.3-0.6-3C29.9,6.2,28.8,5.8,27.4,5.8z M28,9.8 c-0.3,1.7-1.6,1.7-2.9,1.7h-0.7l0.5-3.3c0-0.2,0.2-0.3,0.4-0.3h0.3c0.9,0,1.7,0,2.1,0.5C28,8.8,28.1,9.2,28,9.8z" fill="#003087" />
                      <path d="M42,9.7h-2.2c-0.2,0-0.4,0.1-0.4,0.3l-0.1,0.7l-0.2-0.3c-0.5-0.8-1.8-1-3-1c-2.8,0-5.2,2.1-5.7,5.1 c-0.2,1.5,0.1,2.9,1,3.9c0.8,0.9,1.9,1.2,3.2,1.2c2.3,0,3.5-1.5,3.5-1.5l-0.1,0.7c0,0.2,0.1,0.4,0.3,0.4h2c0.3,0,0.6-0.2,0.7-0.5 l1.2-7.8C42.4,9.9,42.2,9.7,42,9.7z M38.2,14.7c-0.2,1.5-1.4,2.5-2.9,2.5c-0.8,0-1.3-0.2-1.7-0.7c-0.4-0.4-0.5-1.1-0.4-1.8 c0.2-1.4,1.4-2.4,2.9-2.4c0.7,0,1.3,0.2,1.7,0.7C38.2,13.4,38.3,14,38.2,14.7z" fill="#003087" />
                      <path d="M56.4,9.7h-2.2c-0.2,0-0.4,0.1-0.6,0.3l-3.3,4.9l-1.4-4.7c-0.1-0.3-0.4-0.5-0.7-0.5h-2.2c-0.2,0-0.4,0.2-0.3,0.5 l2.7,7.9l-2.5,3.6c-0.2,0.3,0,0.7,0.3,0.7h2.2c0.2,0,0.4-0.1,0.6-0.3l8.1-11.7C56.9,10.1,56.7,9.7,56.4,9.7z" fill="#003087" />
                      <text x="65" y="17" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="#169BD7">Pal</text>
                      <path d="M8,5.8H3.4c-0.3,0-0.6,0.2-0.7,0.5l-1.9,12.3c0,0.2,0.1,0.4,0.3,0.4H3c0.3,0,0.5-0.2,0.6-0.5l0.5-3.4 c0-0.3,0.3-0.5,0.7-0.5h1.5c3.2,0,5-1.5,5.5-4.5c0.2-1.3,0-2.3-0.6-3C10.5,6.2,9.4,5.8,8,5.8z M8.6,9.8c-0.3,1.7-1.6,1.7-2.9,1.7H5 l0.5-3.3c0-0.2,0.2-0.3,0.4-0.3h0.3c0.9,0,1.7,0,2.1,0.5C8.6,8.8,8.7,9.2,8.6,9.8z" fill="#0070E0" />
                      <path d="M22.6,9.7h-2.2c-0.2,0-0.4,0.1-0.4,0.3l-0.1,0.7l-0.2-0.3c-0.5-0.8-1.8-1-3-1c-2.8,0-5.2,2.1-5.7,5.1 c-0.2,1.5,0.1,2.9,1,3.9c0.8,0.9,1.9,1.2,3.2,1.2c2.3,0,3.5-1.5,3.5-1.5l-0.1,0.7c0,0.2,0.1,0.4,0.3,0.4h2c0.3,0,0.6-0.2,0.7-0.5 l1.2-7.8C23,9.9,22.8,9.7,22.6,9.7z M18.8,14.7c-0.2,1.5-1.4,2.5-2.9,2.5c-0.8,0-1.3-0.2-1.7-0.7c-0.4-0.4-0.5-1.1-0.4-1.8 c0.2-1.4,1.4-2.4,2.9-2.4c0.7,0,1.3,0.2,1.7,0.7C18.8,13.4,18.9,14,18.8,14.7z" fill="#0070E0" />
                    </svg>
                  </div>
                </div>
              </label>
            </RadioGroup>

            <div className="flex flex-col space-y-2 mt-6">
              <Button 
                onClick={() => setIsPaymentSheetOpen(false)}
                className="bg-gray-900 text-white py-6 text-lg font-medium hover:bg-gray-800"
              >
                変更する
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsPaymentSheetOpen(false)}
                className="border-gray-300 py-6 text-lg font-medium"
              >
                キャンセル
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default PurchaseDialog;
