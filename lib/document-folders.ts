import { PrismaClient } from '@prisma/client';

// Personal/General folders for landlord's main documents page
export const PERSONAL_DEFAULT_FOLDERS = [
  {
    name: 'Lease Agreements',
    description: 'Lease contracts and rental agreements',
    color: '#3B82F6', // blue
    icon: 'file-text',
    sortOrder: 1,
  },
  {
    name: 'Title Deeds',
    description: 'Property ownership and title documents',
    color: '#10B981', // green
    icon: 'file-text',
    sortOrder: 2,
  },
  {
    name: 'Personal Documents',
    description: 'ID, passport, and personal identification documents',
    color: '#8B5CF6', // purple
    icon: 'user',
    sortOrder: 3,
  },
  {
    name: 'Insurance',
    description: 'Insurance policies and certificates',
    color: '#06B6D4', // cyan
    icon: 'shield',
    sortOrder: 4,
  },
  {
    name: 'Financial Documents',
    description: 'Bank statements, payslips, and financial records',
    color: '#F59E0B', // yellow/amber
    icon: 'dollar-sign',
    sortOrder: 5,
  },
  {
    name: 'Inspection Reports',
    description: 'Property inspections and condition reports',
    color: '#EF4444', // red
    icon: 'file-text',
    sortOrder: 6,
  },
  {
    name: 'Proof of Residence',
    description: 'Utility bills and address verification documents',
    color: '#EC4899', // pink
    icon: 'home',
    sortOrder: 7,
  },
  {
    name: 'Maintenance Records',
    description: 'Maintenance history and repair records',
    color: '#F97316', // orange
    icon: 'briefcase',
    sortOrder: 8,
  },
];

// Tenant-specific default folders
export const DEFAULT_FOLDERS = [
  {
    name: 'Lease Agreements',
    description: 'Lease contracts and agreements',
    color: '#3B82F6', // blue
    icon: 'file-text',
    sortOrder: 1,
  },
  {
    name: 'Personal Documents',
    description: 'ID, passport, and personal identification documents',
    color: '#10B981', // green
    icon: 'user',
    sortOrder: 2,
  },
  {
    name: 'Financial Documents',
    description: 'Bank statements, payslips, and financial records',
    color: '#F59E0B', // yellow/amber
    icon: 'dollar-sign',
    sortOrder: 3,
  },
  {
    name: 'Proof of Residence',
    description: 'Utility bills and address verification documents',
    color: '#8B5CF6', // purple
    icon: 'home',
    sortOrder: 4,
  },
  {
    name: 'Other Documents',
    description: 'Miscellaneous documents',
    color: '#6B7280', // gray
    icon: 'folder',
    sortOrder: 5,
  },
];

// Property-specific default folders
export const PROPERTY_DEFAULT_FOLDERS = [
  {
    name: 'Title Deeds',
    description: 'Property ownership and title documents',
    color: '#3B82F6', // blue
    icon: 'file-text',
    sortOrder: 1,
  },
  {
    name: 'Insurance',
    description: 'Property insurance policies and certificates',
    color: '#10B981', // green
    icon: 'shield',
    sortOrder: 2,
  },
  {
    name: 'Inspection Reports',
    description: 'Property inspections and condition reports',
    color: '#F59E0B', // yellow/amber
    icon: 'file-text',
    sortOrder: 3,
  },
  {
    name: 'Maintenance Records',
    description: 'Maintenance history and repair records',
    color: '#EF4444', // red
    icon: 'briefcase',
    sortOrder: 4,
  },
  {
    name: 'Tax Documents',
    description: 'Property tax statements and municipal assessments',
    color: '#8B5CF6', // purple
    icon: 'dollar-sign',
    sortOrder: 5,
  },
  {
    name: 'Warranties & Manuals',
    description: 'Appliance warranties and property manuals',
    color: '#06B6D4', // cyan
    icon: 'key',
    sortOrder: 6,
  },
  {
    name: 'Other Documents',
    description: 'Miscellaneous property documents',
    color: '#6B7280', // gray
    icon: 'folder',
    sortOrder: 7,
  },
];

export async function createDefaultFoldersForTenant(
  prisma: PrismaClient,
  userId: string,
  tenantId: string,
  propertyId?: string
) {
  const folders = await Promise.all(
    DEFAULT_FOLDERS.map((folder) =>
      prisma.documentFolder.create({
        data: {
          userId,
          tenantId,
          propertyId: propertyId || null,
          name: folder.name,
          description: folder.description,
          color: folder.color,
          icon: folder.icon,
          sortOrder: folder.sortOrder,
        },
      })
    )
  );

  return folders;
}

export async function createDefaultFoldersForProperty(
  prisma: PrismaClient,
  userId: string,
  propertyId: string
) {
  const folders = await Promise.all(
    PROPERTY_DEFAULT_FOLDERS.map((folder) =>
      prisma.documentFolder.create({
        data: {
          userId,
          propertyId,
          tenantId: null,
          name: folder.name,
          description: folder.description,
          color: folder.color,
          icon: folder.icon,
          sortOrder: folder.sortOrder,
        },
      })
    )
  );

  return folders;
}

export async function createDefaultFoldersForAllExistingTenants(prisma: PrismaClient) {
  // Get all tenants that don't have folders yet
  const tenants = await prisma.tenant.findMany({
    where: {
      documentFolders: {
        none: {},
      },
    },
    include: {
      properties: {
        take: 1,
        select: {
          propertyId: true,
        },
      },
    },
  });

  console.log(`Creating default folders for ${tenants.length} tenants...`);

  for (const tenant of tenants) {
    const propertyId = tenant.properties[0]?.propertyId || null;
    await createDefaultFoldersForTenant(prisma, tenant.userId, tenant.id, propertyId || undefined);
    console.log(`✅ Created folders for tenant ${tenant.firstName} ${tenant.lastName}`);
  }

  console.log('✅ All default folders created successfully!');
}

// Create default personal folders for a landlord (no tenant or property association)
export async function createDefaultPersonalFolders(prisma: PrismaClient, userId: string) {
  const folders = await Promise.all(
    PERSONAL_DEFAULT_FOLDERS.map((folder) =>
      prisma.documentFolder.create({
        data: {
          userId,
          tenantId: null,
          propertyId: null,
          name: folder.name,
          description: folder.description,
          color: folder.color,
          icon: folder.icon,
          sortOrder: folder.sortOrder,
        },
      })
    )
  );

  return folders;
}

// Get or create default personal folders for a landlord
export async function getOrCreateDefaultPersonalFolders(prisma: PrismaClient, userId: string) {
  // Check if user already has personal folders (no tenant or property)
  const existingFolders = await prisma.documentFolder.findMany({
    where: {
      userId,
      tenantId: null,
      propertyId: null,
      parentFolderId: null,
    },
  });

  if (existingFolders.length > 0) {
    return existingFolders;
  }

  // Create default personal folders if none exist
  return createDefaultPersonalFolders(prisma, userId);
}
