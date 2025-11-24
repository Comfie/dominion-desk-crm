'use client';

import { useState } from 'react';
import {
  Folder,
  FileText,
  User,
  DollarSign,
  Home,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Plus,
  Edit,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DocumentFolder } from '@/types/document';

interface FolderTreeProps {
  folders: DocumentFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder?: () => void;
  onEditFolder?: (folder: DocumentFolder) => void;
  onDeleteFolder?: (folder: DocumentFolder) => void;
  readOnly?: boolean;
  showDocumentCount?: boolean;
}

const ICON_MAP = {
  'file-text': FileText,
  user: User,
  'dollar-sign': DollarSign,
  home: Home,
  folder: Folder,
  briefcase: FileText,
  shield: FileText,
  key: FileText,
};

function getFolderIcon(iconName: string | null) {
  if (!iconName) return Folder;
  return ICON_MAP[iconName as keyof typeof ICON_MAP] || Folder;
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  readOnly = false,
  showDocumentCount = true,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: DocumentFolder, level: number = 0) => {
    const Icon = getFolderIcon(folder.icon);
    const isSelected = selectedFolderId === folder.id;
    const isExpanded = expandedFolders.has(folder.id);
    const hasSubFolders = (folder._count?.subFolders || 0) > 0;
    const documentCount = folder._count?.documents || 0;

    return (
      <div key={folder.id} className="w-full">
        <div
          className={cn(
            'group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
            isSelected &&
              'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30',
            level > 0 && 'ml-4'
          )}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {hasSubFolders && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}

          <button
            onClick={() => onSelectFolder(folder.id)}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: folder.color ? `${folder.color}20` : undefined }}
            >
              {isSelected ? (
                <FolderOpen className="h-4 w-4" style={{ color: folder.color || undefined }} />
              ) : (
                <Icon className="h-4 w-4" style={{ color: folder.color || undefined }} />
              )}
            </div>

            <span className="flex-1 truncate text-left text-sm font-medium">{folder.name}</span>

            {showDocumentCount && documentCount > 0 && (
              <Badge variant="secondary" className="ml-auto flex-shrink-0 text-xs">
                {documentCount}
              </Badge>
            )}
          </button>

          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 flex-shrink-0 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEditFolder && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditFolder(folder);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                )}
                {onDeleteFolder && (
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFolder(folder);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isExpanded && folder.subFolders && folder.subFolders.length > 0 && (
          <div className="mt-1">
            {folder.subFolders.map((subFolder) => renderFolder(subFolder, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-1">
      {/* All Documents / Root folder */}
      <div
        className={cn(
          'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
          selectedFolderId === null && 'bg-blue-50 dark:bg-blue-900/20'
        )}
        onClick={() => onSelectFolder(null)}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          {selectedFolderId === null ? (
            <FolderOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <Folder className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          )}
        </div>
        <span className="flex-1 text-sm font-medium">All Documents</span>
        {showDocumentCount && (
          <Badge variant="secondary" className="text-xs">
            {folders.reduce((acc, folder) => acc + (folder._count?.documents || 0), 0)}
          </Badge>
        )}
      </div>

      {/* Folder list */}
      {folders.map((folder) => renderFolder(folder))}

      {/* Create folder button */}
      {!readOnly && onCreateFolder && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start gap-2"
          onClick={onCreateFolder}
        >
          <Plus className="h-4 w-4" />
          Create Folder
        </Button>
      )}
    </div>
  );
}
