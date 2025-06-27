import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file; // Don't compress non-image files like PDFs
  }

  const options = {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.8,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Original size: ${formatBytes(file.size)}, Compressed size: ${formatBytes(compressedFile.size)}`);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Fallback to original file
  }
}

export async function handleZipFile(file: File): Promise<File[]> {
    const zip = await JSZip.loadAsync(file);
    const imageFiles: File[] = [];
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.heic', '.heif'];

    const promises = Object.values(zip.files).map(async (zipEntry) => {
        if (!zipEntry.dir && supportedExtensions.some(ext => zipEntry.name.toLowerCase().endsWith(ext))) {
            const blob = await zipEntry.async('blob');
            const newFile = new File([blob], zipEntry.name, { type: blob.type });
            imageFiles.push(newFile);
        }
    });
    
    await Promise.all(promises);
    return imageFiles;
}

export async function convertHeic(file: File): Promise<File> {
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    if (!isHeic) {
        return file;
    }
    try {
        // Dynamically import heic2any to prevent SSR errors
        const heic2any = (await import('heic2any')).default;
        const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8,
        }) as Blob;
        const newFileName = file.name.substring(0, file.name.lastIndexOf('.')) + '.jpeg';
        return new File([convertedBlob], newFileName, { type: "image/jpeg", lastModified: file.lastModified });
    } catch (error) {
        console.error("HEIC conversion failed for", file.name, error);
        throw new Error(`Failed to convert HEIC file: ${file.name}`);
    }
}
