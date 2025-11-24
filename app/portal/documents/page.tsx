'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Grid3x3, List, Loader2, FileText, Home, ChevronRight } from 'lucide-react';

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
import { FolderTree } from '@/components/documents/folder-tree';
import { DocumentGrid } from '@/components/documents/document-grid';
import { DocumentFolder, Document } from '@/types/document';

export default function TenantDocumentsPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFolders, setShowFolders] = useState(false);

  // Fetch folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery<DocumentFolder[]>({
    queryKey: ['tenant-folders'],
    queryFn: async () => {
      const response = await fetch('/api/folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json();
    },
  });

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['tenant-documents', selectedFolderId, searchQuery],
    queryFn: async () => {
      if (selectedFolderId) {
        const response = await fetch(`/api/folders/${selectedFolderId}/documents`);
        if (!response.ok) throw new Error('Failed to fetch documents');
        return response.json();
      } else {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        const response = await fetch(`/api/documents?${params}`);
        if (!response.ok) throw new Error('Failed to fetch documents');
        return response.json();
      }
    },
  });

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
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

  const currentFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      {/* Header */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/portal/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>My Documents</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-4">
          <h1 className="text-2xl font-bold">My Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            {currentFolder ? `${currentFolder.name}` : 'All Documents'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar - Folder Tree */}
        <div className={`lg:col-span-1 ${showFolders ? 'block' : 'hidden lg:block'}`}>
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
                  onSelectFolder={(id) => {
                    handleFolderSelect(id);
                    setShowFolders(false); // Close on mobile after selection
                  }}
                  readOnly
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

                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none lg:hidden"
                    onClick={() => setShowFolders(!showFolders)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {showFolders ? 'Hide' : 'Show'} Folders
                  </Button>
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
              ) : documents.length > 0 ? (
                <DocumentGrid
                  documents={documents}
                  viewMode={viewMode}
                  onView={handleViewDocument}
                  onDownload={handleDownloadDocument}
                  readOnly
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-semibold">No documents found</h3>
                  <p className="text-gray-500">
                    {searchQuery
                      ? 'No documents match your search criteria.'
                      : currentFolder
                        ? 'No documents have been uploaded to this folder yet.'
                        : 'No documents have been uploaded yet.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
