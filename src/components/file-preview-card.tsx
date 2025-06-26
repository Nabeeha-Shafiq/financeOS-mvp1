'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, FileText, Loader2, CheckCircle2, XCircle, AlertTriangle, Check, Pencil } from 'lucide-react';
import type { FileWrapper, ExtractReceiptDataOutput } from '@/types';
import { formatBytes } from '@/lib/utils';
import { VerificationDialog } from './verification-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FilePreviewCardProps {
  fileWrapper: FileWrapper;
  onRemove: (id: string) => void;
  onAccept: (id: string, data: ExtractReceiptDataOutput) => void;
}

const StatusIndicator = ({ status }: { status: FileWrapper['status'] }) => {
  switch (status) {
    case 'processing':
      return <Badge variant="secondary" className="gap-1.5"><Loader2 className="h-3 w-3 animate-spin" />Processing</Badge>;
    case 'success':
      return <Badge className="bg-primary/20 text-primary-foreground hover:bg-primary/30 gap-1.5"><Pencil className="h-3 w-3" />Needs Verification</Badge>;
    case 'error':
      return <Badge variant="destructive" className="gap-1.5"><XCircle className="h-3 w-3" />Error</Badge>;
    case 'queued':
      return <Badge variant="outline">Queued</Badge>;
    case 'accepted':
      return <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"><Check className="h-3 w-3" />Accepted</Badge>;
    default:
      return null;
  }
};

export function FilePreviewCard({ fileWrapper, onRemove, onAccept }: FilePreviewCardProps) {
  const { id, file, status, extractedData, errorMessage } = fileWrapper;
  const [isVerifying, setIsVerifying] = useState(false);

  return (
    <TooltipProvider>
      <Card className="flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="p-0 relative">
          <div className="aspect-video w-full overflow-hidden bg-muted flex items-center justify-center">
            {file.type.startsWith('image/') && fileWrapper.previewUrl ? (
              <Image
                src={fileWrapper.previewUrl}
                alt={`Preview of ${file.name}`}
                width={300}
                height={168}
                className="object-cover w-full h-full"
                data-ai-hint="receipt scan"
              />
            ) : (
              <FileText className="w-16 h-16 text-muted-foreground" />
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/75 text-white"
            onClick={() => onRemove(id)}
            aria-label={`Remove ${file.name}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 flex-1">
          <p className="text-sm font-medium truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>

          {status === 'success' && (
            <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => setIsVerifying(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Verify Data
            </Button>
          )}

          {status === 'accepted' && extractedData && (
             <div className="mt-2 text-xs space-y-1 text-muted-foreground">
                <p><strong className="text-foreground">Merchant:</strong> {extractedData.merchant_name}</p>
                <p><strong className="text-foreground">Amount:</strong> {extractedData.amount} PKR</p>
                <p><strong className="text-foreground">Category:</strong> {extractedData.category}</p>
             </div>
          )}

          {status === 'error' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-2 text-xs text-destructive flex items-start gap-1.5 cursor-help">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0"/>
                  <p className="truncate">AI processing failed.</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs break-words">{errorMessage}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </CardContent>
        <CardFooter className="p-4 border-t bg-muted/50">
          <StatusIndicator status={status} />
          {extractedData && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs ml-auto text-muted-foreground cursor-help">
                  Conf: {(extractedData.confidence_score * 100).toFixed(0)}%
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI confidence score in the extracted data.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </CardFooter>
      </Card>

      {status === 'success' && fileWrapper.extractedData && (
        <VerificationDialog 
          isOpen={isVerifying}
          onOpenChange={setIsVerifying}
          fileWrapper={fileWrapper}
          onSave={onAccept}
        />
      )}
    </TooltipProvider>
  );
}
