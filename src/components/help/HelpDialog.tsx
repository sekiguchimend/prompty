import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

export interface HelpItem {
  question: string;
  answer: string;
  category?: string;
}

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon: React.ReactNode;
  helpItems: HelpItem[];
}

const HelpDialog: React.FC<HelpDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  icon,
  helpItems
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            {icon}
            <div>
              <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-gray-600 mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-6">
          <div className="space-y-4">
            {helpItems.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {helpItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex items-start justify-between w-full pr-4">
                        <span className="font-medium">{item.question}</span>
                        {item.category && (
                          <Badge variant="outline" className="ml-2 flex-shrink-0">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2 pb-4 text-gray-700 leading-relaxed whitespace-pre-line">
                        {item.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>このカテゴリのヘルプ情報は準備中です。</p>
                <p className="text-sm mt-2">
                  ご質問がある場合は、お問い合わせフォームからご連絡ください。
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
          <Button onClick={() => window.open('/contact', '_blank')}>
            お問い合わせ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog; 