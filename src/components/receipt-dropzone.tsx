'use client';

import { useState, useRef, type DragEvent } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { UploadCloud, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReceiptDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

export function ReceiptDropzone({ onFilesAdded, disabled }: ReceiptDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
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
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFilesAdded(Array.from(files));
    }
  };
  
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesAdded(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const onUploadClick = () => fileInputRef.current?.click();
  const onCameraClick = () => cameraInputRef.current?.click();

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ease-in-out',
        'flex flex-col items-center justify-center space-y-4',
        disabled ? 'cursor-not-allowed bg-muted/50 border-muted' : 'border-border hover:border-primary/50 hover:bg-primary/5',
        isDragging ? 'border-primary bg-primary/10 scale-105' : 'bg-card'
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <UploadCloud className="w-12 h-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium text-foreground">
          Drag & drop receipts here, or upload a ZIP file
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Supports JPG, PNG, PDF, HEIC. Max 5MB per file, 100 files per session.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button onClick={onUploadClick} disabled={disabled} size="lg">
          Choose Files
        </Button>
        {isMobile && (
          <Button variant="outline" onClick={onCameraClick} disabled={disabled} size="lg">
            <Camera className="mr-2 h-4 w-4" />
            Use Camera
          </Button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,application/pdf,image/heic,image/heif,application/zip"
        className="hidden"
        onChange={onFileSelect}
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileSelect}
        disabled={disabled}
      />
    </div>
  );
}
