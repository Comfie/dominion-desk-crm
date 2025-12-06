# Testing Guide: Folder-Based Document Management System

## 🎯 Overview

This guide will help you test the newly implemented folder-based document management system for tenants.

## 📋 Prerequisites

1. **Run the development server:**

   ```bash
   npm run dev
   ```

2. **Seed the database (if not already done):**
   ```bash
   npx prisma db seed
   ```
   This will create:
   - A demo landlord account (`demo@propertycrm.com` / `Demo@123`)
   - A tenant profile (John Smith - `john.smith@example.com`)
   - Default document folders for the tenant

## 🧪 Testing as Landlord

### Step 1: Log in as Landlord

1. Navigate to: `http://localhost:3000/login`
2. Login credentials:
   - Email: `demo@propertycrm.com`
   - Password: `Demo@123`

### Step 2: Access Tenant Documents

**Option A: From Tenant List**

1. Go to `/tenants`
2. Click on "John Smith" (or any tenant)
3. You'll see a new **"Documents" tab** in the tabs section
4. Click the "Documents" tab
5. Click the "Open Document Manager" button

**Option B: Direct Navigation**

1. From the tenant details page, look at the right sidebar
2. You'll see a new **"Documents"** card
3. Click "View Documents" button

**Option C: Direct URL**

1. Navigate to: `/tenants/[tenant-id]/documents`
2. Replace `[tenant-id]` with the actual tenant ID from your database

### Step 3: Test Document Management Features

Once you're on the document management page, you should see:

#### Left Sidebar - Folder Tree

- **5 Default Folders:**
  1. 📘 Lease Agreements (Blue)
  2. 👤 Personal Documents (Green)
  3. 💰 Financial Documents (Yellow/Amber)
  4. 🏠 Proof of Residence (Purple)
  5. 📁 Other Documents (Gray)

- **Features to test:**
  - Click on each folder to view its contents
  - Click on "All Documents" to see all documents
  - Each folder shows a document count badge
  - Hover over folders to see edit/delete options

#### Main Content Area

**Test these actions:**

1. **Create a New Folder**
   - Click "Create Folder" button at bottom of folder tree
   - Fill in:
     - Name: e.g., "Insurance Documents"
     - Description (optional)
     - Pick a color
     - Choose an icon
   - Click "Create Folder"
   - ✅ New folder should appear in the list

2. **Upload a Document**
   - Click "Upload Document" button (top right)
   - Fill in the form:
     - Select a file (PDF, DOC, image, etc.)
     - Title: e.g., "Lease Agreement 2024"
     - Document Type: e.g., "Lease Agreement"
     - Folder: Select "Lease Agreements"
     - Description (optional)
     - Issue Date and Expiry Date (optional)
   - Click "Upload Document"
   - ✅ Document should appear in the selected folder

3. **View Documents**
   - Select a folder from the sidebar
   - Documents should display in grid or list view
   - Toggle between Grid (⊞) and List (☰) views
   - ✅ Each document shows:
     - File type icon
     - Title and filename
     - File size
     - Upload date
     - Folder badge (if in a folder)

4. **Document Actions**
   - **View:** Click the "View" button or eye icon to open in new tab
   - **Download:** Click the "Download" button to download
   - **Move:** Click "..." menu → "Move to Folder" → Select new folder
   - **Delete:** Click "..." menu → "Delete" → Confirm

5. **Search Documents**
   - Use the search bar at the top
   - Search by document title or filename
   - Results update in real-time

6. **Bulk Operations**
   - Select multiple documents using checkboxes
   - Click "Download (n)" to download all selected
   - Click "Delete (n)" for bulk delete

7. **Edit/Delete Folders**
   - Hover over a folder in the tree
   - Click the "..." menu icon
   - **Rename:** Change folder name, color, or icon
   - **Delete:** Remove folder (documents can be moved or deleted)

### Step 4: Test Breadcrumb Navigation

- Click breadcrumbs at the top to navigate:
  - Home → Tenants → [Tenant Name] → Documents

## 🔐 Testing as Tenant (Portal Access)

### Step 1: Create Tenant Portal Access

1. As landlord, go to the tenant details page
2. In the "Portal Access" card (right sidebar)
3. Click "Create Access"
4. Set a password (e.g., `Tenant@123`)
5. Click "Create Access"

### Step 2: Log in as Tenant

1. **Logout** from landlord account
2. Navigate to: `http://localhost:3000/portal/login`
3. Login credentials:
   - Email: `john.smith@example.com`
   - Password: (the password you just set)

### Step 3: Access Documents

1. Navigate to: `/portal/documents`
2. Or look for a "Documents" link in the tenant portal navigation

### Step 4: Verify Read-Only Access

You should be able to:

- ✅ View the folder tree
- ✅ See all documents
- ✅ Open/view documents
- ✅ Download documents
- ✅ Search documents
- ✅ Toggle grid/list view

You should NOT be able to:

- ❌ Create folders
- ❌ Edit/delete folders
- ❌ Upload documents
- ❌ Move documents
- ❌ Delete documents
- ❌ See folder management options

## 🎨 UI/UX Features to Observe

1. **Color-Coded Folders:** Each folder has a distinct color for visual organization
2. **Icon Representation:** Folders have meaningful icons (file, user, dollar, home, etc.)
3. **Document Count Badges:** Shows how many documents are in each folder
4. **Responsive Design:** Works on mobile, tablet, and desktop
5. **Loading States:** Spinners while fetching data
6. **Empty States:** Friendly messages when folders are empty
7. **Breadcrumb Navigation:** Easy navigation through the hierarchy

## 🔍 What to Look For

### ✅ Success Indicators

- Folders load correctly
- Documents display with proper metadata
- Upload works and documents appear in correct folder
- Move operation updates folder and document count
- Search filters documents correctly
- Tenant portal is read-only
- All buttons and actions work smoothly

### ❌ Potential Issues to Report

- Documents not showing in correct folder
- Upload failing
- Folder colors not displaying
- Document counts incorrect
- Tenant can modify documents (should be read-only)
- Search not working
- Breadcrumbs not navigating correctly

## 📊 Test Data

### Sample Documents to Upload

1. **Lease Agreement:**
   - Type: LEASE_AGREEMENT
   - Folder: Lease Agreements
   - Any PDF file

2. **ID Document:**
   - Type: ID_DOCUMENT
   - Folder: Personal Documents
   - Any image or PDF

3. **Bank Statement:**
   - Type: BANK_STATEMENT
   - Folder: Financial Documents
   - Any PDF or Excel file

4. **Utility Bill:**
   - Type: PROOF_OF_ADDRESS
   - Folder: Proof of Residence
   - Any PDF file

## 🐛 Troubleshooting

### Issue: Folders not appearing

**Solution:** Run the seed script again:

```bash
npx prisma db seed
```

### Issue: Cannot access tenant documents page

**Solution:** Check the tenant ID in the URL matches an existing tenant:

```bash
# In your database client or Prisma Studio
npx prisma studio
# Check the Tenant table for valid IDs
```

### Issue: Upload not working

**Solution:** Check browser console for errors. The current implementation uses mock file URLs. For production, you'll need to implement actual file upload to S3 or similar storage.

### Issue: Tenant portal access denied

**Solution:** Make sure:

1. You created portal access for the tenant
2. You're using the correct email and password
3. You're accessing `/portal/login` (not regular login)

## 🚀 Next Steps After Testing

Once you've verified the features work:

1. **Implement Real File Upload:**
   - Set up S3, Cloudinary, or similar storage
   - Update the upload logic in the dialogs
   - Implement signed URLs for secure file access

2. **Add More Features:**
   - Document expiry notifications
   - Automatic document categorization (AI)
   - Document templates
   - Bulk upload
   - Document versioning

3. **Performance Optimization:**
   - Add pagination for large document lists
   - Implement virtual scrolling for many folders
   - Add caching for frequently accessed documents

## 📞 Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Check the terminal/server logs
3. Verify database has seeded data
4. Make sure all migrations have run: `npx prisma migrate dev`
5. Clear browser cache and try again

---

**Happy Testing! 🎉**
