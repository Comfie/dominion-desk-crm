'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Grid3x3, List, Loader2, FileText, Home, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PortalShell } from '@/components/portal/portal-shell';
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
import type { DocumentFolder, Document } from '@/types/document';

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
    <PortalShell>
      <div className="portal-page">
        <div className="portal-page-header">
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

          <div className="portal-hero">
            <div className="space-y-4">
              <span className="portal-kicker">Tenant records</span>
              <div className="space-y-2">
                <h1 className="portal-page-title">My Documents</h1>
                <p className="portal-page-description">
                  {currentFolder
                    ? `${currentFolder.name} documents, ready to review or download.`
                    : 'Keep lease agreements, ID records, and uploaded files in one place.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="portal-stat-card min-w-[10rem] px-4 py-3">
                  <p className="portal-eyebrow">Visible files</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{documents.length}</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                  {currentFolder ? `${currentFolder.name}` : 'All Documents'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[17rem_minmax(0,1fr)]">
          <div className={`${showFolders ? 'block' : 'hidden xl:block'}`}>
            <Card className="portal-panel">
              <CardContent className="p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="portal-eyebrow">Browse</p>
                    <h2 className="mt-1 text-lg font-semibold text-white">Folders</h2>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/65">
                    {folders.length}
                  </div>
                </div>
                {foldersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-white/45" />
                  </div>
                ) : (
                  <FolderTree
                    folders={folders}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={(id) => {
                      handleFolderSelect(id);
                      setShowFolders(false);
                    }}
                    readOnly
                    showDocumentCount
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="portal-panel-muted portal-panel">
              <CardContent className="p-4 sm:p-5">
                <div className="portal-toolbar">
                  <div className="relative w-full max-w-xl flex-1">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/35"
                    />
                  </div>

                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10 xl:hidden"
                      onClick={() => setShowFolders(!showFolders)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {showFolders ? 'Hide' : 'Show'} Folders
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      className={
                        viewMode === 'grid'
                          ? 'bg-sky-400/90 text-slate-950 hover:bg-sky-300'
                          : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                      }
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      className={
                        viewMode === 'list'
                          ? 'bg-sky-400/90 text-slate-950 hover:bg-sky-300'
                          : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                      }
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="portal-panel">
              <CardContent className="p-5 sm:p-6">
                {documentsLoading ? (
                  <div className="flex items-center justify-center py-14">
                    <Loader2 className="h-8 w-8 animate-spin text-white/45" />
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
                  <div className="portal-empty-state flex flex-col items-center justify-center px-6 py-14 text-center">
                    <FileText className="mb-4 h-12 w-12 text-white/35" />
                    <h3 className="mb-2 text-lg font-semibold text-white">No documents found</h3>
                    <p className="max-w-md text-sm text-white/60">
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
    </PortalShell>
  );
}
