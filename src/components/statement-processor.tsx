
'use client';

import { useState, useRef, useCallback, type DragEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { readFileAsDataURL, readFileAsText, handleExcelFile } from '@/lib/utils';
import { extractBankStatementData, type BankTransaction } from '@/ai/flows/extract-bank-statement-data';
import type { ProcessedBankTransaction, FileWrapper } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TransactionList } from '@/components/transaction-list';
import { UploadCloud, Sparkles } from 'lucide-react';

const ACCEPTED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'application/pdf', 
  'text/csv', 'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/html'
];

interface StatementProcessorProps {
    onTransactionsExtracted: (transactions: BankTransaction[]) => void;
    transactions: ProcessedBankTransaction[];
    receipts: FileWrapper[];
    onUpdateTransaction: (updatedTransaction: ProcessedBankTransaction) => void;
    onManualMatch: (transactionId: string, receiptId: string) => void;
}

export function StatementProcessor({ 
    onTransactionsExtracted, 
    transactions,
    receipts,
    onUpdateTransaction,
    onManualMatch
}: StatementProcessorProps) {
  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = useCallback((file: File) => {
    const fileType = file.type || '';
    const fileName = file.name.toLowerCase();
    
    const isSupported = ACCEPTED_FILE_TYPES.includes(fileType) ||
                        fileName.endsWith('.csv') ||
                        fileName.endsWith('.xls') ||
                        fileName.endsWith('.xlsx') ||
                        fileName.endsWith('.pdf') ||
                        fileName.endsWith('.html');

    if (!isSupported) {
      toast({
        variant: 'destructive',
        title: 'Unsupported File Type',
        description: `File "${file.name}" is not a supported bank statement format.`,
      });
      return;
    }
    setStatementFile(file);
    onTransactionsExtracted([]);
  }, [toast, onTransactionsExtracted]);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const onUploadClick = () => fileInputRef.current?.click();
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleProcessStatement = async () => {
    if (!statementFile) {
      toast({
        variant: 'destructive',
        title: 'No File Selected',
        description: 'Please select a bank statement file to process.',
      });
      return;
    }
    
    setIsProcessing(true);

    try {
      let input: { statementMedia?: string; statementText?: string } = {};
      const fileType = statementFile.type;
      const fileName = statementFile.name.toLowerCase();
      
      const isHtmlLike = async (file: File) => {
        const text = await readFileAsText(file);
        const trimmedContent = text.trim().toLowerCase();
        return trimmedContent.startsWith('<!doctype html') || trimmedContent.startsWith('<html>');
      };

      if (fileType === 'text/html' || fileName.endsWith('.html')) {
        const text = await readFileAsText(statementFile);
        input = { statementText: text };
      } else if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
        const text = await readFileAsText(statementFile);
        input = { statementText: text };
      } else if (fileType.includes('sheet') || fileType.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
        const text = await handleExcelFile(statementFile);
        input = { statementText: text };
      } else if (fileType.startsWith('image/')) {
        const dataUri = await readFileAsDataURL(statementFile);
        input = { statementMedia: dataUri };
      } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        if (await isHtmlLike(statementFile)) {
            const text = await readFileAsText(statementFile);
            input = { statementText: text };
        } else {
            const dataUri = await readFileAsDataURL(statementFile);
            input = { statementMedia: dataUri };
        }
      } else {
        try {
          const text = await readFileAsText(statementFile);
          input = { statementText: text };
        } catch (e) {
          throw new Error('Unsupported file type for processing.');
        }
      }
      
      if (!input.statementMedia && !input.statementText) {
        throw new Error('Could not prepare the file for processing. It may be an unsupported format.');
      }
      
      const extractedTransactions = await extractBankStatementData(input);
      onTransactionsExtracted(extractedTransactions);

      toast({
        title: 'Processing Complete',
        description: `Extracted ${extractedTransactions.length} transactions from your statement.`,
      });

    } catch (error) {
      console.error('Error processing bank statement:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: `Could not extract data. ${errorMessage} If the file is password-protected, please save an unencrypted version (e.g., using 'Print to PDF') and try again.`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ease-in-out',
          'flex flex-col items-center justify-center space-y-4',
          isProcessing ? 'cursor-not-allowed bg-muted/50 border-muted' : 'border-border hover:border-primary/50 hover:bg-primary/5',
          isDragging ? 'border-primary bg-primary/10 scale-105' : 'bg-card'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <UploadCloud className="w-12 h-12 text-muted-foreground" />
        {statementFile ? (
          <div className='text-center'>
              <p className="mt-4 text-lg font-medium text-foreground">{statementFile.name}</p>
              <p className="text-sm text-muted-foreground">Ready to process</p>
          </div>
        ) : (
          <>
            <p className="mt-4 text-lg font-medium text-foreground">
              Drag & drop your statement file here
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Supports PDF, CSV, XLS, XLSX, JPG, PNG, HTML
            </p>
          </>
        )}
         <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_FILE_TYPES.join(',') + ',.html,.htm,.pdf,.xls,.xlsx,.csv'}
              onChange={handleFileSelect}
              disabled={isProcessing}
          />
        <Button onClick={onUploadClick} disabled={isProcessing} variant="outline">
          {statementFile ? "Change File" : "Choose File"}
        </Button>
      </div>

      <div className="flex justify-center">
          <Button onClick={handleProcessStatement} disabled={isProcessing || !statementFile} size="lg">
            <Sparkles className="mr-2 h-4 w-4" />
            {isProcessing ? 'Processing...' : 'Extract Transactions'}
          </Button>
      </div>

      {isProcessing && (
          <div className="my-4 space-y-2">
              <Progress value={undefined} />
              <p className="text-sm text-muted-foreground text-center">AI is analyzing your statement. This may take a moment...</p>
          </div>
      )}

      {transactions.length > 0 && (
          <TransactionList 
              transactions={transactions} 
              receipts={receipts}
              onUpdateTransaction={onUpdateTransaction}
              onManualMatch={onManualMatch}
          />
      )}
    </div>
  );
}
