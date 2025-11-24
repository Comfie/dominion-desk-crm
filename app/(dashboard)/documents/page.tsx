'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Grid, List, Upload, Trash2, LayoutGrid, LayoutList } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Document, DocumentFolder } from '@/types/document';
import { FolderTree } from '@/components/documents/folder-tree';
import { DocumentGrid } from '@/components/documents/document-grid';
import { CreateFolderDialog } from '@/components/documents/create-folder-dialog';
import { EditFolderDialog } from '@/components/documents/edit-folder-dialog';
import { DeleteFolderDialog } from '@/components/documents/delete-folder-dialog';
import { UploadDocumentDialog } from '@/components/documents/upload-document-dialog';
import { MoveDocumentDialog } from '@/components/documents/move-document-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function DocumentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // View state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  // Dialog state
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [editFolderOpen, setEditFolderOpen] = useState(false);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [moveDocumentOpen, setMoveDocumentOpen] = useState(false);
  const [deleteDocumentOpen, setDeleteDocumentOpen] = useState(false);

  // Selected items
  const [selectedFolder, setSelectedFolder] = useState<DocumentFolder | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Fetch folders (landlord's personal folders - no tenantId)
  const { data: folders = [], isLoading: foldersLoading } = useQuery<DocumentFolder[]>({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await fetch('/api/folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json();
    },
  });

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['documents', selectedFolderId, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedFolderId) params.set('folderId', selectedFolderId);
      if (search) params.set('search', search);
      const response = await fetch(`/api/documents?${params}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete document');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setDeleteDocumentOpen(false);
      setSelectedDocument(null);
      toast({
        title: 'Document deleted',
        description: 'The document has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEditFolder = (folder: DocumentFolder) => {
    setSelectedFolder(folder);
    setEditFolderOpen(true);
  };

  const handleDeleteFolder = (folder: DocumentFolder) => {
    setSelectedFolder(folder);
    setDeleteFolderOpen(true);
  };

  const handleView = (document: Document) => {
    window.open(document.fileUrl, '_blank');
  };

  const handleDownload = (document: Document) => {
    const link = window.document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.fileName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleMove = (document: Document) => {
    setSelectedDocument(document);
    setMoveDocumentOpen(true);
  };

  const handleDelete = (document: Document) => {
    setSelectedDocument(document);
    setDeleteDocumentOpen(true);
  };

  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedDocuments.size === 0) return;
    toast({
      title: 'Bulk delete',
      description: `This would delete ${selectedDocuments.size} documents. (Not implemented in demo)`,
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex-shrink-0 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Documents</h1>
            <p className="text-sm text-gray-500">
              Organize and manage your personal business documents
            </p>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left Sidebar - Folder Tree */}
        <Card className="flex h-full flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Folders</CardTitle>
            <CardDescription>Organize your documents</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onCreateFolder={() => setCreateFolderOpen(true)}
              onEditFolder={handleEditFolder}
              onDeleteFolder={handleDeleteFolder}
              readOnly={false}
              showDocumentCount={true}
            />
          </CardContent>
        </Card>

        {/* Right - Document Grid */}
        <Card className="flex h-full flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <CardTitle>
                  {selectedFolderId
                    ? folders.find((f) => f.id === selectedFolderId)?.name || 'Documents'
                    : 'All Documents'}
                </CardTitle>
                <CardDescription>
                  {documents.length} {documents.length === 1 ? 'document' : 'documents'}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-[200px] pl-10"
                  />
                </div>

                {/* View mode toggle */}
                <div className="flex items-center gap-1 rounded-lg border p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </div>

                {/* Bulk actions */}
                {selectedDocuments.size > 0 && (
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedDocuments.size})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {documentsLoading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-500">Loading documents...</p>
              </div>
            ) : (
              <DocumentGrid
                documents={documents}
                onView={handleView}
                onDownload={handleDownload}
                onMove={handleMove}
                onDelete={handleDelete}
                onSelect={handleSelectDocument}
                selectedDocuments={selectedDocuments}
                readOnly={false}
                viewMode={viewMode}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['folders'] });
          setCreateFolderOpen(false);
        }}
      />

      {selectedFolder && (
        <>
          <EditFolderDialog
            open={editFolderOpen}
            onOpenChange={setEditFolderOpen}
            folder={selectedFolder}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['folders'] });
              setEditFolderOpen(false);
              setSelectedFolder(null);
            }}
          />

          <DeleteFolderDialog
            open={deleteFolderOpen}
            onOpenChange={setDeleteFolderOpen}
            folder={selectedFolder}
            folders={folders}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['folders'] });
              queryClient.invalidateQueries({ queryKey: ['documents'] });
              setDeleteFolderOpen(false);
              setSelectedFolder(null);
            }}
          />
        </>
      )}

      <UploadDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        folderId={selectedFolderId}
        folders={folders}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['documents'] });
          queryClient.invalidateQueries({ queryKey: ['folders'] });
          setUploadDialogOpen(false);
        }}
      />

      {selectedDocument && (
        <>
          <MoveDocumentDialog
            open={moveDocumentOpen}
            onOpenChange={setMoveDocumentOpen}
            document={selectedDocument}
            folders={folders}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['documents'] });
              queryClient.invalidateQueries({ queryKey: ['folders'] });
              setMoveDocumentOpen(false);
              setSelectedDocument(null);
            }}
          />

          <AlertDialog open={deleteDocumentOpen} onOpenChange={setDeleteDocumentOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Document</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{selectedDocument.title}"? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteDocumentMutation.mutate(selectedDocument.id)}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleteDocumentMutation.isPending}
                >
                  {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
