import type { ExtractReceiptDataOutput } from '@/ai/flows/extract-receipt-data';
import type { BankTransaction as BaseBankTransaction } from '@/ai/flows/extract-bank-statement-data';

export type FileStatus = 'queued' | 'processing' | 'success' | 'error' | 'accepted';

export interface FileWrapper {
  id: string;
  file: File;
  previewUrl: string;
  status: FileStatus;
  extractedData?: ExtractReceiptDataOutput;
  errorMessage?: string;
  matchedTransactionId?: string;
}

export type BankTransaction = BaseBankTransaction;

export interface ProcessedBankTransaction extends BankTransaction {
    id: string;
    matchStatus: 'unmatched' | 'matched' | 'manual';
    matchedReceiptId?: string;
}

export interface UnifiedExpense extends ExtractReceiptDataOutput {
  id: string;
  source: 'receipt' | 'manual' | 'bank';
}
