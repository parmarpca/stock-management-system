import { CheckCircle, Printer, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  onPrint?: () => void;
  showPrintOption?: boolean;
}

export const SuccessDialog = ({
  open,
  onOpenChange,
  title,
  message,
  onPrint,
  showPrintOption = false,
}: SuccessDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <DialogTitle className="text-green-800">{title}</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-700">{message}</p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Close
            </Button>

            {showPrintOption && onPrint && (
              <Button
                onClick={() => {
                  onPrint();
                  onOpenChange(false);
                }}
                className="flex-1 flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print Receipt</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
