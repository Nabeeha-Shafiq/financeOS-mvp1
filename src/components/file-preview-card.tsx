'use client';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, FileText, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { FileWrapper } from '@/types';
import { formatBytes } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface FilePreviewCardProps {
  fileWrapper: FileWrapper;
  onRemove: (id: string) => void;
}

const StatusIndicator = ({ status }: { status: FileWrapper['status'] }) => {
  switch (status) {
    case 'processing':
      return <Badge variant="secondary" className="gap-1.5"><Loader2 className="h-3 w-3 animate-spin" />Processing</Badge>;
    case 'success':
      return <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"><CheckCircle2 className="h-3 w-3" />Success</Badge>;
    case 'error':
      return <Badge variant="destructive" className="gap-1.5"><XCircle className="h-3 w-3" />Error</Badge>;
    case 'queued':
      return <Badge variant="outline">Queued</Badge>;
    default:
      return null;
  }
};

export function FilePreviewCard({ fileWrapper, onRemove }: FilePreviewCardProps) {
  const { id, file, previewUrl, status, extractedData, errorMessage } = fileWrapper;

  return (
    <Card className="flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="p-0 relative">
        <div className="aspect-video w-full overflow-hidden bg-muted flex items-center justify-center">
          {file.type.startsWith('image/') && previewUrl ? (
            <Image
              src={previewUrl}
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
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 hover:bg-black/75 text-white"
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

        {status === 'success' && extractedData && (
          <Accordion type="single" collapsible className="w-full mt-2">
            <AccordionItem value="item-1" className="border-b-0">
              <AccordionTrigger className="text-sm py-1 hover:no-underline">View Data</AccordionTrigger>
              <AccordionContent className="text-xs space-y-1 pt-2 text-muted-foreground">
                <p><strong className="text-foreground">Merchant:</strong> {extractedData.merchant_name}</p>
                <p><strong className="text-foreground">Date:</strong> {extractedData.date}</p>
                <p><strong className="text-foreground">Amount:</strong> {extractedData.amount} PKR</p>
                <p><strong className="text-foreground">Location:</strong> {extractedData.location || 'N/A'}</p>
                <p className="truncate"><strong className="text-foreground">Items:</strong> {extractedData.items.join(', ')}</p>
                <p><strong className="text-foreground">Confidence:</strong> {(extractedData.confidence_score * 100).toFixed(0)}%</p>
                <p><strong className="text-foreground">Language:</strong> {extractedData.detected_language}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        {status === 'error' && (
          <div className="mt-2 text-xs text-destructive flex items-start gap-1.5">
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0"/>
            <p className="break-words">{errorMessage || 'An unknown error occurred.'}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t bg-muted/50">
        <StatusIndicator status={status} />
      </CardFooter>
    </Card>
  );
}
