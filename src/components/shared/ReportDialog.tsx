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
  { id: 'inappropriate', label: 'Inappropriate Content' },
  { id: 'spam', label: 'Spam' },
  { id: 'harassment', label: 'Harassment' },
  { id: 'misinformation', label: 'Misinformation' },
  { id: 'other', label: 'Other' }
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
        title: "Login Required",
        description: "Please log in to report content.",
        variant: "destructive",
      });
      return;
    }

    if (targetType === 'comment' && !promptId) {
      toast({
        title: "Error",
        description: "Parent prompt ID is required for comment reports.",
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
        title: "Report Submitted",
        description: "Thank you for your report. We will review it shortly.",
      });
      
      handleClose();
      onComplete?.();
      
    } catch (error) {
      console.error('Report submission error:', error);
      toast({
        title: "Report Failed",
        description: "An error occurred while submitting your report. Please try again.",
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
            Report {targetType === 'comment' ? 'Comment' : 'Content'}
          </DialogTitle>
          <DialogDescription>
            Please select a reason for reporting this content. All reports are processed anonymously.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Report Reason</h4>
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
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              placeholder="Please provide additional details..."
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
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="destructive"
              disabled={isSubmitting || !currentUser}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;