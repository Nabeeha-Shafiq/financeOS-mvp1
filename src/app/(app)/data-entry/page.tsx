'use client';

import { ReceiptDropzone } from '@/components/receipt-dropzone';
import { FilePreviewGrid } from '@/components/file-preview-grid';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, PlusCircle } from 'lucide-react';
import { ManualExpenseForm } from '@/components/manual-expense-form';
import { StatementProcessor } from '@/components/statement-processor';
import { Separator } from '@/components/ui/separator';
import { useFinancialData } from '@/context/financial-data-context';

export default function DataEntryPage() {
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

  return (
    <div className="space-y-8">
      <ReceiptDropzone onFilesAdded={handleFilesAdded} disabled={isProcessing} />
      
      {files.length > 0 && (
        <section aria-labelledby="uploads-heading">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
            <h2 id="uploads-heading" className="text-xl font-semibold">Your Uploads ({files.length})</h2>
            <div className="flex gap-2">
                <ManualExpenseForm onAddExpense={handleAddManualExpense}>
                    <Button variant="outline" disabled={isProcessing}>
                        <PlusCircle className="mr-2" />
                        Add Manually
                    </Button>
                </ManualExpenseForm>
                <Button onClick={handleProcessReceipts} disabled={isProcessing || queuedFilesCount === 0}>
                <Sparkles className="mr-2" />
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

          <FilePreviewGrid files={files} onRemoveFile={handleRemoveFile} onAcceptFile={onAcceptFile} />
          {needsVerificationCount > 0 && !isProcessing && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                <p className="text-primary font-medium">{needsVerificationCount} receipt{needsVerificationCount !== 1 ? 's' : ''} ready for your review.</p>
            </div>
          )}
        </section>
      )}

      <Separator />

      <StatementProcessor 
        onTransactionsExtracted={handleTransactionsExtracted}
        transactions={transactions}
        receipts={files.filter(f => f.status === 'accepted')}
        onUpdateTransaction={handleUpdateTransaction}
        onManualMatch={handleManualMatch}
       />
    </div>
  );
}
