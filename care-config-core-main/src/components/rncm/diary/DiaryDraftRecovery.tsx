import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDiaryDrafts } from "@/hooks/useDiaryDrafts";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface DiaryDraftRecoveryProps {
  onRestore: (draftData: any) => void;
}

export function DiaryDraftRecovery({ onRestore }: DiaryDraftRecoveryProps) {
  const { draft, clearDraft, restoreDraft } = useDiaryDrafts();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (draft) {
      setShowDialog(true);
    }
  }, [draft]);

  const handleRestore = () => {
    const draftData = restoreDraft();
    if (draftData) {
      onRestore(draftData);
    }
    setShowDialog(false);
  };

  const handleDiscard = async () => {
    await clearDraft();
    setShowDialog(false);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Unsaved Draft Found
          </DialogTitle>
          <DialogDescription>
            We found an unsaved draft from{" "}
            {draft && format(new Date(draft.updated_at), "PPp")}. Would you like to restore it?
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button onClick={handleRestore} className="flex-1">
            Restore Draft
          </Button>
          <Button onClick={handleDiscard} variant="outline" className="flex-1">
            Discard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
