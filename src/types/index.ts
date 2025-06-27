import type { ExtractReceiptDataOutput } from '@/ai/flows/extract-receipt-data';
import type { BankTransaction } from '@/ai/flows/extract-bank-statement-data';

export type FileStatus = 'queued' | 'processing' | 'success' | 'error' | 'accepted';

export interface FileWrapper {
  id: string;
  file: File;
  previewUrl: string;
  status: FileStatus;
  extractedData?: ExtractReceiptDataOutput;
  errorMessage?: string;
}

export type { BankTransaction };
