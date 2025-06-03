import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  // Comprehensive audio file validation matching backend and upload form
  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/mp3'];
  const allowedExtensions = ['.mp3', '.wav', '.m4a'];
  const fileExtension = file.name.toLowerCase().split('.').pop() || '';
  const maxSize = 15 * 1024 * 1024; // 15MB
  
  const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(`.${fileExtension}`);
  
  if (!isValidType) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload an MP3, WAV, or M4A file.'
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 15MB.'
    };
  }
  
  return { valid: true };
}
