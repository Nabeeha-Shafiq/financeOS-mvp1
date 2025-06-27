'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ReceiptDropzone } from '@/components/receipt-dropzone';
import { FilePreviewGrid } from '@/components/file-preview-grid';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { extractReceiptData } from '@/ai/flows/extract-receipt-data';
import { readFileAsDataURL, compressImage, handleZipFile, convertHeic } from '@/lib/utils';
import type { FileWrapper, ExtractReceiptDataOutput, BankTransaction, ProcessedBankTransaction } from '@/types';
import { Bot, Sparkles, PlusCircle } from 'lucide-react';
import { SessionSummary } from '@/components/session-summary';
import { ManualExpenseForm } from '@/components/manual-expense-form';
import { StatementProcessor } from '@/components/statement-processor';
import { Separator } from '@/components/ui/separator';
import { differenceInDays } from 'date-fns';

const MAX_FILES = 100;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'image/heic', 'image/heif'];

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
  const [processingProgress, setProcessingProgress] = useState({ processed: 0, total: 0 });
  const [transactions, setTransactions] = useState<ProcessedBankTransaction[]>([]);
  const { toast } = useToast();

  const addFileToState = useCallback((file: File, currentFiles: FileWrapper[]) => {
    const fileId = `${file.name}-${file.lastModified}-${file.size}`;
    if (currentFiles.some(f => f.id === fileId) || files.some(f => f.id === fileId)) {
      console.warn(`Skipping duplicate file: ${file.name}`);
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: `File "${file.name}" exceeds the 5MB limit.`,
      });
      return null;
    }
    const fileType = file.type || '';
    const fileName = file.name.toLowerCase();
    
    const isSupported = ACCEPTED_FILE_TYPES.includes(fileType) || 
                        fileName.endsWith('.pdf') || 
                        fileName.endsWith('.jpeg') || 
                        fileName.endsWith('.jpg') ||
                        fileName.endsWith('.png') ||
                        fileName.endsWith('.heic') ||
                        fileName.endsWith('.heif');

    if (!isSupported) {
        toast({
            variant: 'destructive',
            title: 'Invalid file type',
            description: `File type for "${file.name}" (${fileType}) is not supported.`,
        });
        return null;
    }

    return {
      id: fileId,
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      status: 'queued',
    } as FileWrapper;
  }, [files, toast]);

  const handleFilesAdded = useCallback(async (incomingFiles: File[]) => {
    let filesToProcess: File[] = [...incomingFiles];
    let finalFiles: File[] = [];

    const zipFiles = filesToProcess.filter(f => f.type === 'application/zip' || f.name.toLowerCase().endsWith('.zip'));
    filesToProcess = filesToProcess.filter(f => !zipFiles.includes(f));
    
    if (zipFiles.length > 0) {
        toast({ title: `Unpacking ${zipFiles.length} ZIP file(s)...`});
        for(const zipFile of zipFiles) {
            try {
                const extracted = await handleZipFile(zipFile);
                filesToProcess.push(...extracted);
            } catch (error) {
                 toast({ variant: 'destructive', title: 'ZIP Error', description: `Could not unpack ${zipFile.name}.` });
            }
        }
    }

    const heicFiles = filesToProcess.filter(f => f.type === 'image/heic' || f.type === 'image/heif' || f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif'));
    const otherFiles = filesToProcess.filter(f => !heicFiles.includes(f));
    
    if (heicFiles.length > 0) {
        toast({ title: `Converting ${heicFiles.length} HEIC file(s)...`});
        const converted = await Promise.all(heicFiles.map(convertHeic));
        finalFiles.push(...converted);
    }
    finalFiles.push(...otherFiles);

    const newFileWrappers = finalFiles.reduce((acc, file) => {
        if (files.length + acc.length >= MAX_FILES) return acc;
        const wrapper = addFileToState(file, acc);
        if (wrapper) {
            acc.push(wrapper);
        }
        return acc;
    }, [] as FileWrapper[]);

    if (files.length + newFileWrappers.length > MAX_FILES) {
      toast({
        variant: 'destructive',
        title: 'Upload limit exceeded',
        description: `Adding these files would exceed the ${MAX_FILES} file limit. Some files were not added.`,
      });
    }

    if (newFileWrappers.length > 0) {
        setFiles((prevFiles) => [...prevFiles, ...newFileWrappers].slice(0, MAX_FILES));
    }
  }, [files, toast, addFileToState]);

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
  
  const handleTransactionsExtracted = (extractedTxs: BankTransaction[]) => {
      const processed = extractedTxs.map((tx, index) => ({
          ...tx,
          id: `tx-${Date.now()}-${index}`,
          matchStatus: 'unmatched' as const,
      }));
      setTransactions(processed);
  };

  const handleProcessReceipts = async () => {
    const filesToProcess = files.filter(f => f.status === 'queued');
    if (filesToProcess.length === 0) {
        toast({ title: "No new receipts to process.", description: "Please upload some receipts first."});
        return;
    };

    setIsProcessing(true);
    setProcessingProgress({ processed: 0, total: filesToProcess.length });
    setFiles((prev) => prev.map(f => f.status === 'queued' ? { ...f, status: 'processing' } : f));

    let processedCount = 0;
    
    for (const fileWrapper of filesToProcess) {
      try {
        const compressedFile = await compressImage(fileWrapper.file);
        const receiptDataUri = await readFileAsDataURL(compressedFile);
        const result = await withRetry(() => extractReceiptData({ receiptDataUri }));
        
        const newStatus = result.confidence_score >= 0.5 ? 'accepted' as const : 'success' as const;

        setFiles(prev => prev.map(f => f.id === fileWrapper.id ? { ...f, status: newStatus, extractedData: result } : f));
      } catch (error) {
        console.error('Error processing receipt:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setFiles(prev => prev.map(f => f.id === fileWrapper.id ? { ...f, status: 'error' as const, errorMessage: `AI processing failed. ${errorMessage}` } : f));
      } finally {
        processedCount++;
        setProcessingProgress({ processed: processedCount, total: filesToProcess.length });
      }
    }

    setIsProcessing(false);
    toast({
      title: 'Processing Complete',
      description: `Finished processing ${filesToProcess.length} receipts. Check results below.`,
    });
  };
  
  const queuedFilesCount = files.filter(f => f.status === 'queued').length;
  const needsVerificationCount = files.filter(f => f.status === 'success').length;
  const acceptedFiles = useMemo(() => files.filter(f => f.status === 'accepted'), [files]);

  useEffect(() => {
    const unmatchedTxs = transactions.filter(t => t.matchStatus === 'unmatched');
    const unmatchedReceipts = files.filter(f => f.status === 'accepted' && !f.matchedTransactionId);

    if (unmatchedTxs.length === 0 || unmatchedReceipts.length === 0) {
        return;
    }

    let matchedReceiptIds = new Set<string>();
    const newTransactions = [...transactions];
    const newFiles = [...files];

    unmatchedTxs.forEach(tx => {
        if (tx.matchStatus !== 'unmatched') return;

        const availableReceipts = unmatchedReceipts.filter(r => !matchedReceiptIds.has(r.id));
        
        for (const receipt of availableReceipts) {
            const receiptData = receipt.extractedData!;
            const txAmount = tx.debit || tx.credit || 0;
            
            const isAmountMatch = Math.abs(receiptData.amount - txAmount) < 1;
            const isDateMatch = Math.abs(differenceInDays(new Date(tx.date), new Date(receiptData.date))) <= 1;

            if (isAmountMatch && isDateMatch) {
                matchedReceiptIds.add(receipt.id);
                
                const txIndex = newTransactions.findIndex(t => t.id === tx.id);
                if (txIndex > -1) {
                    newTransactions[txIndex] = { ...newTransactions[txIndex], matchStatus: 'matched', matchedReceiptId: receipt.id };
                }

                const fileIndex = newFiles.findIndex(f => f.id === receipt.id);
                if (fileIndex > -1) {
                    newFiles[fileIndex] = { ...newFiles[fileIndex], matchedTransactionId: tx.id };
                }
                break; // Move to the next transaction
            }
        }
    });

    if(matchedReceiptIds.size > 0) {
        setTransactions(newTransactions);
        setFiles(newFiles);
        toast({ title: 'Auto-Matched!', description: `Found ${matchedReceiptIds.size} matches between receipts and transactions.`});
    }

  }, [transactions, files, toast]);

  const handleUpdateTransaction = useCallback((updatedTx: ProcessedBankTransaction) => {
    setTransactions(prev => prev.map(tx => tx.id === updatedTx.id ? updatedTx : tx));
  }, []);

  const handleManualMatch = useCallback((transactionId: string, receiptId: string) => {
    setTransactions(prev => prev.map(tx => tx.id === transactionId ? { ...tx, matchStatus: 'manual', matchedReceiptId: receiptId } : tx));
    setFiles(prev => prev.map(f => f.id === receiptId ? { ...f, matchedTransactionId: transactionId } : f));
    toast({ title: "Match Successful", description: "Transaction and receipt have been manually linked."});
  }, [toast]);


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
                        <Button variant="outline" size="lg" disabled={isProcessing}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Manually
                        </Button>
                    </ManualExpenseForm>
                    <Button onClick={handleProcessReceipts} disabled={isProcessing || queuedFilesCount === 0} size="lg">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isProcessing 
                        ? `Processing ${processingProgress.processed}/${processingProgress.total}...` 
                        : `Process ${queuedFilesCount} New Receipt${queuedFilesCount !== 1 ? 's' : ''}`}
                    </Button>
                </div>
              </div>

              {isProcessing && (
                <div className="my-4 space-y-2">
                    <Progress value={(processingProgress.total > 0 ? (processingProgress.processed / processingProgress.total) : 0) * 100} />
                    <p className="text-sm text-muted-foreground text-center">Please keep this tab open until processing is complete.</p>
                </div>
              )}

              <FilePreviewGrid files={files} onRemoveFile={handleRemoveFile} onAcceptFile={handleAcceptFile} />
              {needsVerificationCount > 0 && !isProcessing && (
                <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                    <p className="text-primary-foreground font-medium">{needsVerificationCount} receipt{needsVerificationCount !== 1 ? 's' : ''} ready for your review.</p>
                </div>
              )}
            </section>
          )}

          {(acceptedFiles.length > 0 || transactions.length > 0) && (
            <SessionSummary acceptedFiles={acceptedFiles} transactions={transactions} />
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

          <Separator className="my-12" />

          <StatementProcessor 
            onTransactionsExtracted={handleTransactionsExtracted}
            transactions={transactions}
            receipts={acceptedFiles}
            onUpdateTransaction={handleUpdateTransaction}
            onManualMatch={handleManualMatch}
           />

        </div>
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground border-t">
        <p>Built with Google AI. Session data only. No data is stored.</p>
      </footer>
    </div>
  );
}
