# UploadThing Setup Guide

This project uses **UploadThing** for file uploads in development/staging, with the option to migrate to AWS S3 in production.

## Why UploadThing?

- ✅ **Free tier**: 2GB storage, unlimited uploads
- ✅ **Simple setup**: No complex AWS configuration
- ✅ **Fast development**: Get file uploads working in minutes
- ✅ **Easy migration**: Switch to S3 later without changing your UI code

## Setup Instructions

### 1. Create an UploadThing Account

1. Go to [https://uploadthing.com](https://uploadthing.com)
2. Sign up with your GitHub account (recommended) or email
3. Create a new app in the dashboard

### 2. Get Your API Keys

1. In your UploadThing dashboard, go to **API Keys**
2. Copy your:
   - **Secret Key** (starts with `sk_live_...`)
   - **App ID**

### 3. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# UploadThing Configuration
UPLOADTHING_SECRET="sk_live_your_secret_key_here"
UPLOADTHING_APP_ID="your_app_id_here"
```

### 4. Test the Upload

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Login as a landlord (CUSTOMER role)

3. Navigate to:
   - **Personal documents**: `/documents`
   - **Tenant documents**: `/tenants/[id]/documents`

4. Click "Upload Document"

5. Select a file (PDF, image, or Office document up to 16MB)

6. Fill in the document details and click "Upload Document"

7. The file will be uploaded to UploadThing and the URL will be saved in your database

## File Type Support

The current configuration supports:

- **PDFs**: Up to 16MB
- **Images**: JPG, PNG up to 8MB
- **Word Documents**: .doc, .docx up to 16MB
- **Excel Spreadsheets**: .xls, .xlsx up to 16MB

## Security

- ✅ **Authentication required**: Only logged-in landlords can upload
- ✅ **Role-based access**: Tenants have read-only access
- ✅ **File type validation**: Only allowed file types can be uploaded
- ✅ **Size limits**: Files are limited based on type

## Implementation Details

### Files Created

1. **`lib/uploadthing.ts`**
   - React hooks for file uploads
   - Type-safe helpers

2. **`app/api/uploadthing/core.ts`**
   - File router configuration
   - Authentication middleware
   - File type and size limits

3. **`app/api/uploadthing/route.ts`**
   - API route handler
   - Processes upload requests

4. **`components/documents/upload-document-dialog.tsx`**
   - Updated to use UploadThing
   - Shows real-time upload progress
   - Handles errors gracefully

### Upload Flow

```
1. User selects file
2. User fills in document metadata
3. User clicks "Upload Document"
4. File uploads to UploadThing (with progress)
5. UploadThing returns file URL
6. Document metadata + URL saved to database
7. User sees success message
```

## Migration to S3 (Future)

When you're ready to move to production with AWS S3:

1. **Keep UploadThing for development**

   ```bash
   # .env.local (development)
   UPLOADTHING_SECRET="sk_live_..."
   UPLOADTHING_APP_ID="..."
   ```

2. **Use S3 for production**

   ```bash
   # .env (production)
   AWS_REGION="us-east-1"
   AWS_ACCESS_KEY_ID="..."
   AWS_SECRET_ACCESS_KEY="..."
   AWS_S3_BUCKET="property-crm-uploads"
   ```

3. **Create a storage abstraction layer** (future task)
   - Single upload interface
   - Environment-based provider selection
   - UploadThing for dev, S3 for prod

## Troubleshooting

### Upload fails with "Unauthorized"

- Check that you're logged in as a landlord (not tenant)
- Verify `UPLOADTHING_SECRET` is set in `.env.local`

### Upload fails with "File type not allowed"

- Check the file type matches allowed types
- See `app/api/uploadthing/core.ts` for allowed types

### File size too large

- PDFs/Office docs: Max 16MB
- Images: Max 8MB
- Compress files if needed

### Can't see uploaded files

- Check the Network tab for upload errors
- Verify the file URL was saved to the database
- Check UploadThing dashboard for uploaded files

## UploadThing Dashboard

View your uploads:

- Go to [https://uploadthing.com/dashboard](https://uploadthing.com/dashboard)
- Select your app
- View all uploaded files
- Monitor storage usage
- See upload statistics

## Limits (Free Tier)

- **Storage**: 2GB
- **Uploads**: Unlimited
- **File size**: Up to 16MB per file
- **Bandwidth**: Generous (see UploadThing pricing)

## Next Steps

Once you hit the free tier limits or need production-grade infrastructure:

1. Upgrade UploadThing plan (easiest)
2. Migrate to AWS S3 (most cost-effective at scale)
3. Use Cloudflare R2 (S3-compatible, cheaper egress)
4. Use Vercel Blob Storage (if on Vercel)
