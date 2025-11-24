import { PrismaClient } from '@prisma/client';

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
