import type { FileWrapper, ExtractReceiptDataOutput } from '@/types';
import { FilePreviewCard } from './file-preview-card';

interface FilePreviewGridProps {
  files: FileWrapper[];
  onRemoveFile: (id: string) => void;
  onAcceptFile: (id: string, data: ExtractReceiptDataOutput) => void;
}

export function FilePreviewGrid({ files, onRemoveFile, onAcceptFile }: FilePreviewGridProps) {
  const receiptFiles = files.filter(f => !f.extractedData?.isManual);
  
  if (receiptFiles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {receiptFiles.map((fileWrapper) => (
        <FilePreviewCard
          key={fileWrapper.id}
          fileWrapper={fileWrapper}
          onRemove={onRemoveFile}
          onAccept={onAcceptFile}
        />
      ))}
    </div>
  );
}
