import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const f = createUploadthing();

export const ourFileRouter = {
  // Document uploader - accepts PDFs, images, and office documents
  documentUploader: f({
    pdf: { maxFileSize: '16MB', maxFileCount: 1 },
    image: { maxFileSize: '8MB', maxFileCount: 1 },
    'application/msword': { maxFileSize: '16MB', maxFileCount: 1 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      maxFileSize: '16MB',
      maxFileCount: 1,
    },
    'application/vnd.ms-excel': { maxFileSize: '16MB', maxFileCount: 1 },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
      maxFileSize: '16MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      // Authentication check
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        throw new Error('Unauthorized');
      }

      // Only landlords (CUSTOMER role) can upload documents
      // Tenants have read-only access
      if (session.user.role === 'TENANT') {
        throw new Error('Tenants cannot upload documents');
      }

      // Return metadata that will be accessible in onUploadComplete
      return {
        userId: session.user.id,
        userEmail: session.user.email,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on the server after upload completes
      console.log('Upload complete for userId:', metadata.userId);
      console.log('File URL:', file.url);
      console.log('File name:', file.name);
      console.log('File size:', file.size);

      // Return data to the client
      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
      };
    }),

  // Image uploader - for property images, profile pictures, etc.
  imageUploader: f({
    image: { maxFileSize: '10MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      // Authentication check
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        throw new Error('Unauthorized');
      }

      // Return metadata that will be accessible in onUploadComplete
      return {
        userId: session.user.id,
        userEmail: session.user.email,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on the server after upload completes
      console.log('Image upload complete for userId:', metadata.userId);
      console.log('File URL:', file.url);
      console.log('File name:', file.name);
      console.log('File size:', file.size);

      // Return data to the client
      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
