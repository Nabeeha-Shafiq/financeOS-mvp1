import type { FileWrapper, ExtractReceiptDataOutput } from '@/types';
import { FilePreviewCard } from './file-preview-card';

interface FilePreviewGridProps {
  files: FileWrapper[];
  onRemoveFile: (id: string) => void;
  onAcceptFile: (id: string, data: ExtractReceiptDataOutput) => void;
}

export function FilePreviewGrid({ files, onRemoveFile, onAcceptFile }: FilePreviewGridProps) {
  if (files.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((fileWrapper) => (
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
