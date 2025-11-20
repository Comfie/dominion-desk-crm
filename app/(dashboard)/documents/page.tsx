'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Building2,
  User,
  Calendar,
  FileType,
  MoreVertical,
  X,
  Loader2,
  File,
  FileImage,
  FileSpreadsheet,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  title: string;
  description: string | null;
  documentType: string;
  category: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  issueDate: string | null;
  expiryDate: string | null;
  isPublic: boolean;
  createdAt: string;
  property: {
    id: string;
    name: string;
  } | null;
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface Property {
  id: string;
  name: string;
}

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
}

const documentTypes = [
  { value: 'LEASE_AGREEMENT', label: 'Lease Agreement' },
  { value: 'ID_DOCUMENT', label: 'ID Document' },
  { value: 'PROOF_OF_INCOME', label: 'Proof of Income' },
  { value: 'PROOF_OF_ADDRESS', label: 'Proof of Address' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'TAX_DOCUMENT', label: 'Tax Document' },
  { value: 'INSPECTION_REPORT', label: 'Inspection Report' },
  { value: 'INVENTORY', label: 'Inventory' },
  { value: 'OTHER', label: 'Other' },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('pdf')) return FileText;
  return File;
}

function getDocumentTypeLabel(type: string): string {
  const found = documentTypes.find((dt) => dt.value === type);
  return found ? found.label : type;
}

export default function DocumentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterProperty, setFilterProperty] = useState<string>('');
  const [filterTenant, setFilterTenant] = useState<string>('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Form state for upload
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    documentType: '',
    propertyId: '',
    tenantId: '',
    issueDate: '',
    expiryDate: '',
    isPublic: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch documents
  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['documents', search, filterType, filterProperty, filterTenant],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterType) params.set('documentType', filterType);
      if (filterProperty) params.set('propertyId', filterProperty);
      if (filterTenant) params.set('tenantId', filterTenant);
      const response = await fetch(`/api/documents?${params}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
  });

  // Fetch properties for filter
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['properties-list'],
    queryFn: async () => {
      const response = await fetch('/api/properties?limit=100');
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      return data.properties || data;
    },
  });

  // Fetch tenants for filter
  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ['tenants-list'],
    queryFn: async () => {
      const response = await fetch('/api/tenants?limit=100');
      if (!response.ok) throw new Error('Failed to fetch tenants');
      const data = await response.json();
      return data.tenants || data;
    },
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; metadata: typeof uploadForm }) => {
      // In a real app, you would upload the file to a storage service first
      // For now, we'll create a mock URL
      const fileUrl = `/uploads/${Date.now()}-${data.file.name}`;

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data.metadata,
          fileUrl,
          fileName: data.file.name,
          fileSize: data.file.size,
          mimeType: data.file.type,
          propertyId: data.metadata.propertyId || null,
          tenantId: data.metadata.tenantId || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to upload document');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setUploadDialogOpen(false);
      resetUploadForm();
      toast({
        title: 'Document uploaded',
        description: 'The document has been uploaded successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/documents/${id}`, {
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
      setDeleteDialogOpen(false);
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

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      documentType: '',
      propertyId: '',
      tenantId: '',
      issueDate: '',
      expiryDate: '',
      isPublic: false,
    });
    setSelectedFile(null);
  };

  const handleUpload = () => {
    if (!selectedFile || !uploadForm.title || !uploadForm.documentType) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields and select a file.',
        variant: 'destructive',
      });
      return;
    }

    uploadMutation.mutate({
      file: selectedFile,
      metadata: uploadForm,
    });
  };

  const handleDelete = () => {
    if (selectedDocument) {
      deleteMutation.mutate(selectedDocument.id);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterType('');
    setFilterProperty('');
    setFilterTenant('');
  };

  const hasActiveFilters = search || filterType || filterProperty || filterTenant;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-gray-500">Store and manage your property documents</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>Upload a new document to your storage</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                />
                {selectedFile && (
                  <p className="text-xs text-gray-500">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="Document title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type *</Label>
                <Select
                  value={uploadForm.documentType}
                  onValueChange={(value) => setUploadForm({ ...uploadForm, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyId">Link to Property</Label>
                  <Select
                    value={uploadForm.propertyId || 'none'}
                    onValueChange={(value) =>
                      setUploadForm({ ...uploadForm, propertyId: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {properties?.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenantId">Link to Tenant</Label>
                  <Select
                    value={uploadForm.tenantId || 'none'}
                    onValueChange={(value) =>
                      setUploadForm({ ...uploadForm, tenantId: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {tenants?.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.firstName} {tenant.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={uploadForm.issueDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, issueDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={uploadForm.expiryDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false);
                  resetUploadForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filterType || 'all'}
              onValueChange={(value) => setFilterType(value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterProperty || 'all'}
              onValueChange={(value) => setFilterProperty(value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All properties</SelectItem>
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterTenant || 'all'}
              onValueChange={(value) => setFilterTenant(value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tenants</SelectItem>
                {tenants?.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.firstName} {tenant.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3 w-3" />
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="pt-6">
          {documentsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : documents && documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Linked To</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const FileIcon = getFileIcon(doc.mimeType);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                            <FileIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <p className="text-xs text-gray-500">{doc.fileName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getDocumentTypeLabel(doc.documentType)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {doc.property && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Building2 className="h-3 w-3" />
                              {doc.property.name}
                            </div>
                          )}
                          {doc.tenant && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <User className="h-3 w-3" />
                              {doc.tenant.firstName} {doc.tenant.lastName}
                            </div>
                          )}
                          {!doc.property && !doc.tenant && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatFileSize(doc.fileSize)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={doc.fileUrl} download={doc.fileName}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedDocument(doc);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold">No documents found</h3>
              <p className="mb-4 text-gray-500">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Upload your first document to get started'}
              </p>
              {!hasActiveFilters && (
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDocument?.title}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
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
