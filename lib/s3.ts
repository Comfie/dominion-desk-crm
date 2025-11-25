import { S3Client } from '@aws-sdk/client-s3';

// S3 Configuration - Uses validated environment variables
const S3_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  },
};

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'property-crm-uploads';

// Create S3 client
const s3Client = new S3Client(S3_CONFIG);

export { s3Client, BUCKET_NAME };
