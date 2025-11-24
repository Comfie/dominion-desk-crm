Enhance the document management system to support folder-based organization for tenant documents.

CURRENT STATE:

- Documents are stored flat in the Document table
- Documents are linked to tenants via tenantId
- No folder/category organization exists

REQUIRED CHANGES:

1. DATABASE SCHEMA UPDATES:

   Add DocumentFolder model:
   - id (unique identifier)
   - name (folder name, e.g., "Lease Agreements", "ID Documents", "Bank Statements")
   - tenantId (which tenant this folder belongs to)
   - propertyId (optional - for property-specific docs)
   - userId (landlord who owns this folder)
   - color (optional - for UI visual distinction)
   - icon (optional - folder icon identifier)
   - parentFolderId (optional - for nested folders/subfolders)
   - createdAt, updatedAt

   Update Document model:
   - Add folderId field (optional - null means root/uncategorized)
   - Keep existing tenantId, propertyId, userId fields

   Create default folders automatically when tenant is created:
   - "Lease Agreements"
   - "Personal Documents" (ID, passport, etc.)
   - "Financial Documents" (bank statements, payslips)
   - "Proof of Residence"
   - "Other Documents"

2. LANDLORD DASHBOARD - DOCUMENT MANAGEMENT:

   Create enhanced document view for tenants:

   a) /dashboard/tenants/[id]/documents page
   Left sidebar:
   - Show folder tree structure
   - Display folder names with document counts (e.g., "Lease Agreements (3)")
   - Highlight selected folder
   - "Create New Folder" button
   - Drag-and-drop to move documents between folders

   Main content area:
   - Display documents in currently selected folder
   - Grid or list view toggle
   - Document cards showing: filename, file type icon, size, upload date, thumbnail (for images/PDFs)
   - Actions per document: View, Download, Move to Folder, Rename, Delete
   - Upload button (upload to current folder)
   - Empty state when folder has no documents
   - Breadcrumb navigation (Tenant Name > Folder Name)

   b) Folder Management Features:
   - Create folder (modal with name, color picker, icon selector)
   - Rename folder
   - Delete folder (with warning if contains documents - option to move docs or delete all)
   - Move folder (if supporting nested folders)
   - Set folder color/icon for visual organization

   c) Document Upload Enhancements:
   - Upload directly to specific folder
   - Multi-file upload
   - Drag-and-drop files into folders
   - Auto-categorization suggestion (optional AI feature - suggest folder based on filename/type)
   - Progress indicator for uploads

3. TENANT PORTAL - DOCUMENT ACCESS:

   Create read-only document view for tenants:

   a) /tenant/documents page
   - Show same folder structure as landlord sees
   - Tenant can ONLY view and download their documents
   - Tenant CANNOT upload, delete, or move documents (landlord manages this)
   - Same folder tree navigation
   - Same document viewing capabilities
   - Download button for each document
   - View button (open in new tab or inline viewer)

   b) Document Viewer:
   - PDF viewer for lease agreements (inline display)
   - Image viewer for photos/scans
   - Download option for all file types

4. API ROUTES:

   Create these endpoints:

   a) /api/folders
   - GET: List folders for a tenant (landlord view) or current user (tenant view)
   - POST: Create new folder (landlord only)
   - PUT: Update folder (rename, change color/icon)
   - DELETE: Delete folder

   b) /api/folders/[folderId]/documents
   - GET: List documents in specific folder
   - POST: Upload document to folder

   c) /api/documents/[id]/move
   - PUT: Move document to different folder

   d) /api/tenants/[tenantId]/folders
   - GET: Get folder structure for specific tenant (landlord only)

   Security:
   - Landlords can only access folders for THEIR tenants (userId filter)
   - Tenants can only access THEIR OWN folders (tenantId matches session)
   - All folder/document operations check ownership

5. FILE STORAGE ORGANIZATION:

   Update S3 (or storage) folder structure:

   Old: /tenants/{tenantId}/{filename}
   New: /tenants/{tenantId}/{folderId}/{filename}

   Benefits:
   - Better organization in storage
   - Easier to locate files
   - Cleaner file management

6. AUTOMATIC FOLDER CREATION:

   When landlord creates a new tenant:
   - Automatically create default folder structure
   - Create these folders:
     - Lease Agreements (color: blue, icon: file-text)
     - Personal Documents (color: green, icon: user)
     - Financial Documents (color: yellow, icon: dollar-sign)
     - Proof of Residence (color: purple, icon: home)
     - Other Documents (color: gray, icon: folder)

   Landlord can add custom folders later.

7. BULK OPERATIONS:

   Add bulk actions for documents:
   - Select multiple documents (checkboxes)
   - Bulk move to folder
   - Bulk download (as ZIP file)
   - Bulk delete (with confirmation)

8. SEARCH & FILTER:

   Add search functionality:
   - Search documents by filename across all folders
   - Filter by document type (PDF, image, Word, etc.)
   - Filter by upload date range
   - Search results show which folder document is in

9. UI/UX ENHANCEMENTS:

   Document cards should show:
   - File type icon (PDF, JPG, DOC, etc.)
   - Thumbnail preview (for images and PDFs)
   - Filename (truncated if too long)
   - File size (e.g., "2.3 MB")
   - Upload date (relative: "2 days ago" or absolute)
   - Status badge if needed (e.g., "Expired" for old leases)

   Folder icons/colors:
   - Use Lucide icons (folder, file-text, user, home, dollar-sign, etc.)
   - Color coding for quick visual identification
   - Badge showing document count

   Empty states:
   - "No documents in this folder yet"
   - "Upload your first document" with upload button
   - Illustration or icon for better UX

10. PERMISSIONS & ACCESS CONTROL:

    Landlord can:
    - ✅ Create/rename/delete folders
    - ✅ Upload documents to any folder
    - ✅ Move documents between folders
    - ✅ Delete documents
    - ✅ Download documents
    - ✅ View all tenant documents

    Tenant can:
    - ✅ View folder structure
    - ✅ View documents in folders
    - ✅ Download documents
    - ❌ Cannot create/delete folders
    - ❌ Cannot upload documents
    - ❌ Cannot delete documents
    - ❌ Cannot move documents

11. MIGRATION:

    Create migration to:
    - Add DocumentFolder table
    - Add folderId to Document table (nullable, default null)
    - Create default folders for all existing tenants
    - Optionally: move existing documents to appropriate folders based on documentType field

12. NOTIFICATIONS (Optional Enhancement):

    When landlord uploads document:
    - Send email/SMS to tenant: "New document added: [filename] in [folder]"
    - Tenant can click link to view document in portal

TECHNICAL REQUIREMENTS:

- Use existing shadcn/ui components (Card, Button, Dialog, DropdownMenu, etc.)
- Add new components if needed (FolderTree, DocumentGrid, FileUploadDropzone)
- Maintain existing document security (signed URLs, expiration)
- Keep mobile responsive design
- Add loading states for folder/document operations
- Error handling for upload failures, folder deletion conflicts
- Use optimistic UI updates where appropriate
- TypeScript types for Folder and Document models

TESTING CHECKLIST:

After implementation, verify:

- [ ] Default folders created when new tenant added
- [ ] Landlord can create custom folders
- [ ] Documents upload to correct folder
- [ ] Landlord can move documents between folders
- [ ] Tenant can view folder structure (read-only)
- [ ] Tenant can download documents from their folders
- [ ] Tenant CANNOT see other tenants' folders
- [ ] Search works across all folders
- [ ] Bulk operations work correctly
- [ ] Folder deletion with documents handled properly
- [ ] Mobile responsive on all screens

DELIVERABLES:

1. Updated Prisma schema with DocumentFolder model
2. Migration files
3. Seed data update for default folders
4. Enhanced document management pages (landlord + tenant views)
5. All API routes for folder/document operations
6. Folder tree component (reusable)
7. Document grid/list view component
8. File upload with folder selection
9. Search and filter functionality
10. Bulk operations
11. Updated TypeScript types

Please implement this folder-based document management system with all the features described above.
