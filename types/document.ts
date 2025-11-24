export interface DocumentFolder {
  id: string;
  userId: string;
  tenantId: string | null;
  propertyId: string | null;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  parentFolderId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    documents: number;
    subFolders: number;
  };
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  property?: {
    id: string;
    name: string;
  } | null;
  subFolders?: DocumentFolder[];
}

export interface Document {
  id: string;
  userId: string;
  propertyId: string | null;
  tenantId: string | null;
  folderId: string | null;
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
  status: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    name: string;
  } | null;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  folder?: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
}

export interface CreateFolderInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  tenantId?: string;
  propertyId?: string;
  parentFolderId?: string;
  sortOrder?: number;
}

export interface UpdateFolderInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface CreateDocumentInput {
  title: string;
  description?: string;
  documentType: string;
  category?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  propertyId?: string;
  tenantId?: string;
  folderId?: string;
  issueDate?: string;
  expiryDate?: string;
  isPublic?: boolean;
}

export interface MoveDocumentInput {
  folderId: string | null;
}

export const DEFAULT_FOLDER_CONFIGS = [
  {
    name: 'Lease Agreements',
    description: 'Lease contracts and agreements',
    color: '#3B82F6',
    icon: 'file-text',
  },
  {
    name: 'Personal Documents',
    description: 'ID, passport, and personal identification documents',
    color: '#10B981',
    icon: 'user',
  },
  {
    name: 'Financial Documents',
    description: 'Bank statements, payslips, and financial records',
    color: '#F59E0B',
    icon: 'dollar-sign',
  },
  {
    name: 'Proof of Residence',
    description: 'Utility bills and address verification documents',
    color: '#8B5CF6',
    icon: 'home',
  },
  {
    name: 'Other Documents',
    description: 'Miscellaneous documents',
    color: '#6B7280',
    icon: 'folder',
  },
] as const;

export type FolderIcon =
  | 'file-text'
  | 'user'
  | 'dollar-sign'
  | 'home'
  | 'folder'
  | 'file'
  | 'briefcase'
  | 'shield'
  | 'key';
