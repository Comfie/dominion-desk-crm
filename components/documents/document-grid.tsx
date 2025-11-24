'use client';

import {
  File,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  Download,
  Eye,
  MoreVertical,
  Trash2,
  FolderInput,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Document } from '@/types/document';
import { formatDistanceToNow } from 'date-fns';

interface DocumentGridProps {
  documents: Document[];
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onMove?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onSelect?: (documentId: string) => void;
  selectedDocuments?: Set<string>;
  readOnly?: boolean;
  viewMode?: 'grid' | 'list';
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('video')) return FileVideo;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function DocumentGrid({
  documents,
  onView,
  onDownload,
  onMove,
  onDelete,
  onSelect,
  selectedDocuments,
  readOnly = false,
  viewMode = 'grid',
}: DocumentGridProps) {
  const isSelected = (docId: string) => selectedDocuments?.has(docId) || false;

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold">No documents found</h3>
        <p className="text-gray-500">
          {readOnly
            ? 'No documents have been uploaded to this folder yet.'
            : 'Upload your first document to get started.'}
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {documents.map((doc) => {
          const Icon = getFileIcon(doc.mimeType);
          const selected = isSelected(doc.id);

          return (
            <Card
              key={doc.id}
              className={cn(
                'cursor-pointer transition-shadow hover:shadow-md',
                selected && 'ring-2 ring-blue-500'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {onSelect && !readOnly && (
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => onSelect(doc.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Icon className="h-6 w-6 text-gray-500" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-medium">{doc.title}</h4>
                    <p className="truncate text-sm text-gray-500">{doc.fileName}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatFileSize(doc.fileSize)}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                      </span>
                      {doc.folder && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              borderColor: doc.folder.color || undefined,
                              color: doc.folder.color || undefined,
                            }}
                          >
                            {doc.folder.name}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onView && (
                      <Button variant="ghost" size="sm" onClick={() => onView(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onDownload && (
                      <Button variant="ghost" size="sm" onClick={() => onDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {!readOnly && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onMove && (
                            <DropdownMenuItem onClick={() => onMove(doc)}>
                              <FolderInput className="mr-2 h-4 w-4" />
                              Move to Folder
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => onDelete(doc)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {documents.map((doc) => {
        const Icon = getFileIcon(doc.mimeType);
        const selected = isSelected(doc.id);

        return (
          <Card
            key={doc.id}
            className={cn(
              'group relative cursor-pointer transition-shadow hover:shadow-md',
              selected && 'ring-2 ring-blue-500'
            )}
          >
            {onSelect && !readOnly && (
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onSelect(doc.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white shadow-sm"
                />
              </div>
            )}

            <CardContent className="p-4">
              <div className="flex flex-col items-center">
                <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Icon className="h-10 w-10 text-gray-500" />
                </div>

                <h4 className="w-full truncate px-2 text-center font-medium">{doc.title}</h4>
                <p className="mt-1 w-full truncate px-2 text-center text-xs text-gray-500">
                  {doc.fileName}
                </p>

                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <span>{formatFileSize(doc.fileSize)}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                </div>

                {doc.folder && (
                  <Badge
                    variant="outline"
                    className="mt-2 text-xs"
                    style={{
                      borderColor: doc.folder.color || undefined,
                      color: doc.folder.color || undefined,
                    }}
                  >
                    {doc.folder.name}
                  </Badge>
                )}

                {/* Action buttons - simplified for grid view */}
                <div className="mt-3 flex w-full items-center justify-center gap-1 border-t pt-3">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onView(doc)}
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {onDownload && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onDownload(doc)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {!readOnly && (onMove || onDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onMove && (
                          <DropdownMenuItem onClick={() => onMove(doc)}>
                            <FolderInput className="mr-2 h-4 w-4" />
                            Move to Folder
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem className="text-red-600" onClick={() => onDelete(doc)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
