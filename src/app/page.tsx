'use client';

import { useState, useCallback, useMemo } from 'react';
import { ReceiptDropzone } from '@/components/receipt-dropzone';
import { FilePreviewGrid } from '@/components/file-preview-grid';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { extractReceiptData } from '@/ai/flows/extract-receipt-data';
import { readFileAsDataURL, compressImage } from '@/lib/utils';
import type { FileWrapper, ExtractReceiptDataOutput } from '@/types';
import { Bot, Sparkles, PlusCircle } from 'lucide-react';
import { SessionSummary } from '@/components/session-summary';
import { ManualExpenseForm } from '@/components/manual-expense-form';

const MAX_FILES = 50;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB, will be compressed
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
          description: `File "${file.name}" exceeds the 10MB limit.`,
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

  const handleAcceptFile = useCallback((id: string, data: ExtractReceiptDataOutput) => {
    setFiles(prevFiles => prevFiles.map(f => f.id === id ? { ...f, status: 'accepted', extractedData: data } : f));
    toast({
        title: "Receipt Accepted",
        description: `${data.merchant_name} has been successfully added to your session.`
    })
  }, [toast]);
  
  const handleAddManualExpense = useCallback((data: ExtractReceiptDataOutput) => {
    const dummyFile = new File(["manual entry"], "manual.txt", { type: "text/plain" });
    const newFile: FileWrapper = {
        id: `manual-${Date.now()}`,
        file: dummyFile,
        previewUrl: '',
        status: 'accepted',
        extractedData: { ...data, isManual: true },
    };
    setFiles(prev => [...prev, newFile]);
    toast({
        title: "Manual Expense Added",
        description: `Your expense has been successfully logged.`
    })
  }, [toast]);

  const handleProcessReceipts = async () => {
    const filesToProcess = files.filter(f => f.status === 'queued');
    if (filesToProcess.length === 0) {
        toast({ title: "No new receipts to process.", description: "Please upload some receipts first."});
        return;
    };

    setIsProcessing(true);
    setFiles((prev) => prev.map(f => f.status === 'queued' ? { ...f, status: 'processing' } : f));

    const promises = filesToProcess.map(async (fileWrapper) => {
      try {
        const compressedFile = await compressImage(fileWrapper.file);
        const receiptDataUri = await readFileAsDataURL(compressedFile);
        const result = await withRetry(() => extractReceiptData({ receiptDataUri }));
        
        const newStatus = result.confidence_score >= 0.5 ? 'accepted' as const : 'success' as const;

        return { ...fileWrapper, id: fileWrapper.id, status: newStatus, extractedData: result };
      } catch (error) {
        console.error('Error processing receipt:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { ...fileWrapper, id: fileWrapper.id, status: 'error' as const, errorMessage: `AI processing failed. ${errorMessage}` };
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
    
    const autoAcceptedCount = results.filter(r => r.status === 'accepted').length;
    const needsVerificationCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    let descriptionParts: string[] = [];
    if (autoAcceptedCount > 0) descriptionParts.push(`${autoAcceptedCount} auto-accepted`);
    if (needsVerificationCount > 0) descriptionParts.push(`${needsVerificationCount} need review`);
    if (errorCount > 0) descriptionParts.push(`${errorCount} failed`);

    if (descriptionParts.length > 0) {
      toast({
        title: 'Processing Complete',
        description: descriptionParts.join(', ') + '.',
      });
    }
  };
  
  const queuedFilesCount = files.filter(f => f.status === 'queued').length;
  const needsVerificationCount = files.filter(f => f.status === 'success').length;
  const acceptedFiles = useMemo(() => files.filter(f => f.status === 'accepted'), [files]);


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
            <section className="mt-8" aria-labelledby="uploads-heading">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h2 id="uploads-heading" className="text-xl font-semibold">Your Uploads ({files.length})</h2>
                <div className="flex gap-2">
                    <ManualExpenseForm onAddExpense={handleAddManualExpense}>
                        <Button variant="outline" size="lg">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Manually
                        </Button>
                    </ManualExpenseForm>
                    <Button onClick={handleProcessReceipts} disabled={isProcessing || queuedFilesCount === 0} size="lg">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isProcessing ? 'Processing...' : `Process ${queuedFilesCount} New Receipt${queuedFilesCount !== 1 ? 's' : ''}`}
                    </Button>
                </div>
              </div>
              <FilePreviewGrid files={files} onRemoveFile={handleRemoveFile} onAcceptFile={handleAcceptFile} />
              {needsVerificationCount > 0 && (
                <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                    <p className="text-primary-foreground font-medium">{needsVerificationCount} receipt{needsVerificationCount !== 1 ? 's' : ''} ready for your review.</p>
                </div>
              )}
            </section>
          )}

          {acceptedFiles.length > 0 && (
            <SessionSummary acceptedFiles={acceptedFiles} />
          )}

          {files.length === 0 && !isProcessing && (
             <div className="text-center py-16 px-4 text-muted-foreground border-2 border-dashed rounded-lg mt-8">
                <h2 className="text-xl font-semibold text-foreground">Ready to begin?</h2>
                <p className="mt-2 text-base">Drag and drop your receipts, or click 'Choose Files' to start.</p>
                <div className="mt-4">
                    <ManualExpenseForm onAddExpense={handleAddManualExpense}>
                        <Button variant="outline" size="lg">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Or Add an Expense Manually
                        </Button>
                    </ManualExpenseForm>
                </div>
                <p className="text-sm mt-4">Your data is processed in-session and is never stored on a server.</p>
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
