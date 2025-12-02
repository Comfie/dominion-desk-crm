'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Search,
  Grid3x3,
  List,
  Download,
  Trash2,
  Home,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { FolderTree } from '@/components/documents/folder-tree';
import { DocumentGrid } from '@/components/documents/document-grid';
import type { DocumentFolder, Document } from '@/types/document';
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

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function TenantDocumentsPage() {
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tenantId = params.id as string;

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [editFolderOpen, setEditFolderOpen] = useState(false);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);
  const [moveDocumentOpen, setMoveDocumentOpen] = useState(false);
  const [deleteDocumentOpen, setDeleteDocumentOpen] = useState(false);

  const [selectedFolder, setSelectedFolder] = useState<DocumentFolder | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Fetch tenant details
  const { data: tenant, isLoading: tenantLoading } = useQuery<Tenant>({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch tenant');
      return response.json();
    },
  });

  // Fetch folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery<DocumentFolder[]>({
    queryKey: ['folders', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenantId}/folders`);
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json();
    },
  });

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['documents', tenantId, selectedFolderId, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('tenantId', tenantId);
      if (selectedFolderId) {
        const response = await fetch(`/api/folders/${selectedFolderId}/documents`);
        if (!response.ok) throw new Error('Failed to fetch documents');
        return response.json();
      } else {
        if (searchQuery) params.set('search', searchQuery);
        const response = await fetch(`/api/documents?${params}`);
        if (!response.ok) throw new Error('Failed to fetch documents');
        return response.json();
      }
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast({
        title: 'Document deleted',
        description: 'The document has been deleted successfully.',
      });
      setDeleteDocumentOpen(false);
      setSelectedDocument(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setSelectedDocuments(new Set());
  };

  const handleCreateFolder = () => {
    setCreateFolderOpen(true);
  };

  const handleEditFolder = (folder: DocumentFolder) => {
    setSelectedFolder(folder);
    setEditFolderOpen(true);
  };

  const handleDeleteFolder = (folder: DocumentFolder) => {
    setSelectedFolder(folder);
    setDeleteFolderOpen(true);
  };

  const handleUploadDocument = () => {
    setUploadDocumentOpen(true);
  };

  const handleViewDocument = (document: Document) => {
    window.open(document.fileUrl, '_blank');
  };

  const handleDownloadDocument = (document: Document) => {
    const link = window.document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.fileName;
    link.click();
  };

  const handleMoveDocument = (document: Document) => {
    setSelectedDocument(document);
    setMoveDocumentOpen(true);
  };

  const handleDeleteDocument = (document: Document) => {
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

  const handleBulkDownload = () => {
    const selectedDocs = documents.filter((doc) => selectedDocuments.has(doc.id));
    selectedDocs.forEach((doc) => handleDownloadDocument(doc));
    toast({
      title: 'Download started',
      description: `Downloading ${selectedDocs.length} documents...`,
    });
  };

  const handleBulkDelete = () => {
    // TODO: Implement bulk delete
    toast({
      title: 'Bulk delete',
      description: 'This feature will be implemented soon.',
    });
  };

  const currentFolder = folders.find((f) => f.id === selectedFolderId);

  if (tenantLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/tenants">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="/tenants">Tenants</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/tenants/${tenantId}`}>
                {tenant?.firstName} {tenant?.lastName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Documents</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {tenant?.firstName} {tenant?.lastName} - Documents
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {currentFolder ? `${currentFolder.name}` : 'All Documents'}
            </p>
          </div>
          <Button onClick={handleUploadDocument}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar - Folder Tree */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              {foldersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <FolderTree
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={handleFolderSelect}
                  onCreateFolder={handleCreateFolder}
                  onEditFolder={handleEditFolder}
                  onDeleteFolder={handleDeleteFolder}
                  showDocumentCount
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Documents */}
        <div className="space-y-4 lg:col-span-3">
          {/* Toolbar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative w-full flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>

                  <Separator orientation="vertical" className="h-8" />

                  {selectedDocuments.size > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleBulkDownload}>
                        <Download className="mr-1 h-4 w-4" />
                        Download ({selectedDocuments.size})
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete ({selectedDocuments.size})
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Grid/List */}
          <Card>
            <CardContent className="p-6">
              {documentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <DocumentGrid
                  documents={documents}
                  viewMode={viewMode}
                  onView={handleViewDocument}
                  onDownload={handleDownloadDocument}
                  onMove={handleMoveDocument}
                  onDelete={handleDeleteDocument}
                  onSelect={handleSelectDocument}
                  selectedDocuments={selectedDocuments}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        tenantId={tenantId}
      />

      {selectedFolder && (
        <>
          <EditFolderDialog
            open={editFolderOpen}
            onOpenChange={setEditFolderOpen}
            folder={selectedFolder}
          />

          <DeleteFolderDialog
            open={deleteFolderOpen}
            onOpenChange={setDeleteFolderOpen}
            folder={selectedFolder}
            onDeleted={() => {
              setSelectedFolderId(null);
            }}
          />
        </>
      )}

      <UploadDocumentDialog
        open={uploadDocumentOpen}
        onOpenChange={setUploadDocumentOpen}
        tenantId={tenantId}
        folderId={selectedFolderId}
        folders={folders}
      />

      {selectedDocument && (
        <MoveDocumentDialog
          open={moveDocumentOpen}
          onOpenChange={setMoveDocumentOpen}
          document={selectedDocument}
          folders={folders}
        />
      )}

      {/* Delete Document Dialog */}
      <AlertDialog open={deleteDocumentOpen} onOpenChange={setDeleteDocumentOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedDocument?.title}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedDocument && deleteDocumentMutation.mutate(selectedDocument.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteDocumentMutation.isPending}
            >
              {deleteDocumentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
