'use client';

import { useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ProofUploadFormProps {
  paymentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProofUploadForm({ paymentId, onSuccess, onCancel }: ProofUploadFormProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { startUpload, isUploading } = useUploadThing('paymentProofUploader', {
    onClientUploadComplete: async (res) => {
      if (res && res[0]) {
        // Submit proof to API
        try {
          const response = await fetch(`/api/tenant/payments/${paymentId}/proof`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              proofUrl: res[0].url,
              proofFileName: res[0].name,
              notes: notes || undefined,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to submit proof');
          }

          toast({
            title: 'Proof uploaded successfully',
            description: 'Your landlord will review and verify your payment.',
          });
          onSuccess();
        } catch (error) {
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to submit proof',
            variant: 'destructive',
          });
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    onUploadError: (error) => {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 8 * 1024 * 1024; // 8MB

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF or image file (JPEG, PNG, WebP)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'File size must be less than 8MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(file);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    await startUpload([file]);
  };

  const removeFile = () => {
    setFile(null);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-red-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block text-white/70">Proof of Payment</Label>
        {!file ? (
          <div
            className={`rounded-[1.25rem] border-2 border-dashed p-8 text-center transition-colors ${
              dragActive
                ? 'border-sky-400/55 bg-sky-400/10'
                : 'border-white/15 bg-white/[0.03] hover:border-white/30'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto mb-4 h-10 w-10 text-white/45" />
            <p className="mb-2 text-sm text-white/70">
              Drag and drop your proof of payment here, or click to browse
            </p>
            <p className="mb-4 text-xs text-white/45">
              Supported formats: PDF, JPEG, PNG, WebP (max 8MB)
            </p>
            <input
              type="file"
              id="proof-upload"
              className="hidden"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => document.getElementById('proof-upload')?.click()}
            >
              Select File
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              {getFileIcon(file.type)}
              <div>
                <p className="max-w-[200px] truncate text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-white/50">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white/70 hover:bg-white/[0.08] hover:text-white"
              onClick={removeFile}
              disabled={isSubmitting || isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="notes" className="mb-2 block text-white/70">
          Notes (optional)
        </Label>
        <Textarea
          id="notes"
          placeholder="Add any relevant details about this payment..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="border-white/10 bg-white/5 text-white placeholder:text-white/35"
          disabled={isSubmitting || isUploading}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          onClick={onCancel}
          disabled={isSubmitting || isUploading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="bg-sky-400 text-slate-950 hover:bg-sky-300"
          onClick={handleSubmit}
          disabled={!file || isSubmitting || isUploading}
        >
          {isSubmitting || isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Proof
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
