'use client';

import { useState, useCallback } from 'react';
import { ReceiptDropzone } from '@/components/receipt-dropzone';
import { FilePreviewGrid } from '@/components/file-preview-grid';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { extractReceiptData } from '@/ai/flows/extract-receipt-data';
import { readFileAsDataURL } from '@/lib/utils';
import type { FileWrapper } from '@/types';
import { Bot, Sparkles } from 'lucide-react';

const MAX_FILES = 50;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const withRetry = async <T,>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
  finalErrMessage = 'Failed after multiple retries'
): Promise<T> => {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed. Retrying in ${delay * Math.pow(2, i)}ms...`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw new Error(finalErrMessage, { cause: lastError });
};

export default function Home() {
  const [files, setFiles] = useState<FileWrapper[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFilesAdded = useCallback((addedFiles: File[]) => {
    let hasError = false;

    if (files.length + addedFiles.length > MAX_FILES) {
      toast({
        variant: 'destructive',
        title: 'Upload limit exceeded',
        description: `You can only upload up to ${MAX_FILES} receipts at a time.`,
      });
      hasError = true;
    }
    
    if (hasError) return;

    const newFiles = addedFiles.reduce((acc, file) => {
      if (files.some(f => f.id === `${file.name}-${file.lastModified}`)) {
        return acc;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `File "${file.name}" exceeds the 5MB limit.`,
        });
        return acc;
      }
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: `File type for "${file.name}" is not supported. Please use JPG, PNG, or PDF.`,
        });
        return acc;
      }
      acc.push({
        id: `${file.name}-${file.lastModified}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        status: 'queued',
      });
      return acc;
    }, [] as FileWrapper[]);

    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  }, [files, toast]);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  }, []);

  const handleProcessReceipts = async () => {
    const filesToProcess = files.filter(f => f.status === 'queued');
    if (filesToProcess.length === 0) {
        toast({ title: "No receipts to process."});
        return;
    };

    setIsProcessing(true);
    setFiles((prev) => prev.map(f => f.status === 'queued' ? { ...f, status: 'processing' } : f));

    const promises = filesToProcess.map(async (fileWrapper) => {
      try {
        const receiptDataUri = await readFileAsDataURL(fileWrapper.file);
        const result = await withRetry(() => extractReceiptData({ receiptDataUri }));
        return { ...fileWrapper, id: fileWrapper.id, status: 'success' as const, extractedData: result };
      } catch (error) {
        console.error('Error processing receipt:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { ...fileWrapper, id: fileWrapper.id, status: 'error' as const, errorMessage };
      }
    });

    const results = await Promise.all(promises);

    setFiles(prevFiles => {
        const newFiles = [...prevFiles];
        results.forEach(res => {
            const index = newFiles.findIndex(f => f.id === res.id);
            if(index !== -1) {
                newFiles[index] = { ...newFiles[index], ...res };
            }
        });
        return newFiles;
    });

    setIsProcessing(false);
    toast({
      title: 'Processing Complete',
      description: 'All queued receipts have been processed.',
    });
  };
  
  const queuedFilesCount = files.filter(f => f.status === 'queued').length;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="container mx-auto flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">FinanceOS Lite</h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <ReceiptDropzone onFilesAdded={handleFilesAdded} disabled={isProcessing} />
          
          {files.length > 0 && (
            <section className="mt-8" aria-labelledby="receipts-heading">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h2 id="receipts-heading" className="text-xl font-semibold">Your Receipts ({files.length})</h2>
                <Button onClick={handleProcessReceipts} disabled={isProcessing || queuedFilesCount === 0}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isProcessing ? 'Processing...' : `Process ${queuedFilesCount} Receipt${queuedFilesCount !== 1 ? 's' : ''}`}
                </Button>
              </div>
              <FilePreviewGrid files={files} onRemoveFile={handleRemoveFile} />
            </section>
          )}

          {files.length === 0 && !isProcessing && (
             <div className="text-center py-16 px-4 text-muted-foreground border border-dashed rounded-lg mt-8">
                <h2 className="text-lg font-medium text-foreground">Ready to start?</h2>
                <p className="mt-2">Upload your receipts to extract financial data instantly.</p>
                <p className="text-sm mt-1">Your data is processed in-session and is never stored on our servers.</p>
             </div>
          )}
        </div>
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground border-t">
        <p>Built with Google AI. Session data only. No data is stored.</p>
      </footer>
    </div>
  );
}
