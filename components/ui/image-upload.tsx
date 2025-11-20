'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
}

export function ImageUpload({
  value,
  onChange,
  folder = 'properties',
  className,
  aspectRatio = 'video',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'border-muted-foreground/25 bg-muted/50 hover:border-muted-foreground/50 relative rounded-lg border-2 border-dashed transition-colors',
          aspectClasses[aspectRatio]
        )}
      >
        {value ? (
          <>
            <Image src={value} alt="Uploaded image" fill className="rounded-lg object-cover" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            {isUploading ? (
              <>
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                <p className="text-muted-foreground text-sm">Uploading...</p>
              </>
            ) : (
              <>
                <ImageIcon className="text-muted-foreground h-8 w-8" />
                <p className="text-muted-foreground text-center text-sm">Click or drag to upload</p>
                <p className="text-muted-foreground text-xs">JPEG, PNG, WebP, GIF (max 5MB)</p>
              </>
            )}
          </div>
        )}

        {!value && !isUploading && (
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        )}
      </div>

      {!value && !isUploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
