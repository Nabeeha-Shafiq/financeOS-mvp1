'use client';

import { useMemo } from 'react';
import { ReceiptDropzone } from '@/components/receipt-dropzone';
import { FilePreviewGrid } from '@/components/file-preview-grid';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Bot, Sparkles, PlusCircle } from 'lucide-react';
import { SessionSummary } from '@/components/session-summary';
import { ManualExpenseForm } from '@/components/manual-expense-form';
import { StatementProcessor } from '@/components/statement-processor';
import { Separator } from '@/components/ui/separator';
import { useFinancialData } from '@/context/financial-data-context';

export default function DashboardPage() {
  const {
    files,
    isProcessing,
    processingProgress,
    transactions,
    handleFilesAdded,
    handleRemoveFile,
    handleAcceptFile,
    handleAddManualExpense,
    handleProcessReceipts,
    handleTransactionsExtracted,
    handleUpdateTransaction,
    handleManualMatch,
  } = useFinancialData();
  
  const queuedFilesCount = files.filter(f => f.status === 'queued').length;
  const needsVerificationCount = files.filter(f => f.status === 'success').length;
  const acceptedFiles = useMemo(() => files.filter(f => f.status === 'accepted'), [files]);

  return (
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
                <p className="text-primary font-medium">{needsVerificationCount} receipt{needsVerificationCount !== 1 ? 's' : ''} ready for your review.</p>
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
  );
}
