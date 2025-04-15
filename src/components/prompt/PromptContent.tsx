import React, { useState } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { Check, Lock } from 'lucide-react';
 import { 
   Dialog, 
   DialogContent, 
   DialogDescription, 
   DialogFooter, 
   DialogHeader, 
   DialogTitle 
 } from '@/components/ui/dialog';
 import { Badge } from '@/components/ui/badge';
 
 interface PromptContentProps {
   imageUrl?: string;
   title: string;
   author: {
     name: string;
     avatarUrl: string;
     bio?: string;
     publishedAt?: string;
   };
   content: string | string[];
   isPaid?: boolean;
   isPreview?: boolean;
   price?: number;
   systemImageUrl?: string;
   systemUrl?: string;
 }
 
 const PromptContent: React.FC<PromptContentProps> = ({
   imageUrl,
   title,
   author,
   content,
   isPaid = false,
   isPreview = true,
   price = 0,
   systemImageUrl,
   systemUrl
 }) => {
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const navigate = useNavigate();
 
   // コンテンツが配列の場合は結合して文字列にする
   const contentText = Array.isArray(content) ? content.join('\n') : content;
 
   const handlePurchase = () => {
     setIsDialogOpen(false);
     navigate('/checkout');
   };
 
   return (
     <div className="max-w-3xl mx-auto px-4 py-8">
       <div className="flex flex-col gap-6">
         {/* Title and author section */}
         <div className="flex flex-col gap-4">
           <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
 
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-3">
               <div className="w-10 h-10 rounded-md overflow-hidden">
                 <img 
                   src={author.avatarUrl} 
                   alt={author.name} 
                   className="w-full h-full object-cover"
                 />
               </div>
               <div>
                 <p className="text-sm font-medium text-gray-700">{author.name}</p>
                 <p className="text-xs text-gray-500">
                   {author.publishedAt || 'プロンプトエンジニア'}
                 </p>
               </div>
             </div>
 
             {/* 価格表示 - モバイルでも表示 */}
             {price > 0 && (
               <div className="text-right">
                 <p className="text-lg font-medium text-gray-600 border-2 border-gray-600 bg-white rounded-md px-3 py-1 inline-block">¥{price.toLocaleString()}</p>
               </div>
             )}
           </div>
         </div>
 
         {/* メイン画像（あれば表示） */}
         {imageUrl && (
           <div className="rounded-md overflow-hidden aspect-video mb-2">
             <img 
               src={imageUrl} 
               alt={title} 
               className="w-full h-full object-cover"
             />
           </div>
         )}
 
         {/* Content section */}
         <div className="relative prose max-w-none">
           {isPreview ? (
             <div className="relative">
               <div className="mb-6">
                 <div dangerouslySetInnerHTML={{ __html: contentText.slice(0, 500) + '...' }} />
               </div>
 
               <div className="space-y-4">
                 <div className="relative">
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
                 </div>
 
                 <div className="flex flex-col items-center justify-center py-8 relative">
                   <Badge variant="outline" className="mb-2 rounded-sm">プレミアムコンテンツ</Badge>
                   <h3 className="text-xl font-medium text-gray-800 mb-1">続きを読むには購入が必要です</h3>
                   <p className="text-sm text-gray-500 mb-4">あと{contentText.length - 500}文字のプロンプトと詳細な情報が含まれています</p>
 
                   <div className="flex space-x-3">
                     <Button
                       variant="outline"
                       className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-800 rounded-sm"
                       onClick={() => setIsDialogOpen(true)}
                     >
                       詳細を見る
                     </Button>
 
                     <Button
                       className="bg-gray-700 text-white hover:bg-gray-600 rounded-sm"
                       onClick={() => setIsDialogOpen(true)}
                     >
                       ¥{price.toLocaleString()} で購入する
                     </Button>
                   </div>
                 </div>
               </div>
             </div>
           ) : (
             <div dangerouslySetInnerHTML={{ __html: contentText }} />
           )}
 
           {isPaid && (
             <div className="flex items-center mt-6 p-4 border border-gray-200 rounded-sm bg-gray-50">
               <Check className="h-5 w-5 text-gray-600 mr-2" />
               <p className="text-sm font-medium text-gray-700">このプロンプトは購入済みです</p>
             </div>
           )}
         </div>
       </div>
       
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="sm:max-w-md rounded-sm">
           <DialogHeader>
             <DialogTitle>プロンプトを購入する</DialogTitle>
             <DialogDescription>
               購入すると、このプロンプトの全文およびモデルに関する詳細情報にアクセスできます。
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-4 py-4">
             <div className="flex justify-between items-center">
               <span className="text-sm font-medium">プロンプト全文</span>
               <Lock className="h-4 w-4 text-gray-500" />
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm font-medium">使用モデルの詳細情報</span>
               <Lock className="h-4 w-4 text-gray-500" />
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm font-medium">カスタマイズ用サンプル</span>
               <Lock className="h-4 w-4 text-gray-500" />
             </div>
           </div>
           
           <DialogFooter className="sm:justify-start">
             <div className="w-full flex flex-col gap-3">
               <Button 
                 type="button"
                 className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-sm"
                 onClick={handlePurchase}
               >
                 ¥{price.toLocaleString()} で購入する
               </Button>
               <Button
                 type="button"
                 variant="outline"
                 className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 rounded-sm"
                 onClick={() => setIsDialogOpen(false)}
               >
                 キャンセル
               </Button>
             </div>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     
     </div>
   );
 };
 
 export default PromptContent;