import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { HelpCircle } from 'lucide-react';
import PromptGuide from './PromptGuide';
import { PROMPT_EXAMPLES } from './PromptGuide';

interface PromptGuideDialogProps {
  onApplyExample: (example: typeof PROMPT_EXAMPLES[0]) => void;
  children?: React.ReactNode;
}

const PromptGuideDialog: React.FC<PromptGuideDialogProps> = ({ onApplyExample, children }) => {
  const [open, setOpen] = React.useState(false);

  const handleApplyExample = (example: typeof PROMPT_EXAMPLES[0]) => {
    onApplyExample(example);
    setOpen(false); // 適用後にダイアログを閉じる
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="outline" 
            className="border-gray-300 text-black text-sm"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            ガイド
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl mx-4 w-auto left-0 right-0 translate-x-0 sm:left-1/2 sm:-translate-x-1/2">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2" />
            効果的なプロンプトの書き方
          </DialogTitle>
        </DialogHeader>
        <PromptGuide onApplyExample={handleApplyExample} inDialog={true} />
      </DialogContent>
    </Dialog>
  );
};

export default PromptGuideDialog; 