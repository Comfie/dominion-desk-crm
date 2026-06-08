import { Prisma } from '@prisma/client';
import type { TenantStatus, TenantType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { tenantRepository } from '@/lib/features/tenants/repositories/tenant.repository';
import { logger } from '@/lib/shared/logger';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';
import { sendEmail, emailTemplates } from '@/lib/email';
import { generateTenantPassword } from '@/lib/password-generator';
import { createDefaultFoldersForTenant } from '@/lib/document-folders';
import type { CreateTenantDTO, UpdateTenantDTO, ListTenantsDTO } from '../dtos/tenant.dto';
import { isValidLeaseDateRange, LEASE_END_DATE_ERROR } from '../lease-dates';

/**
 * Tenant Service
 * Business logic layer for tenants - includes portal access and property assignment
 */
export class TenantService {
  /**
   * Create a new tenant with optional portal access and property assignment
   */
  async createTenant(
    userId: string,
    data: CreateTenantDTO
  ): Promise<{
    tenant: Awaited<ReturnType<typeof tenantRepository.create>>;
    generatedPassword: string | null;
  }> {
    // Validation: Check if tenant email already exists for this user
    const existingTenant = await prisma.tenant.findFirst({
      where: { userId, email: data.email },
    });

    if (existingTenant) {
      throw new ValidationError('A tenant with this email already exists', {
        email: data.email,
      });
    }

    // If creating portal access, check if User account already exists
    if (data.createPortalAccess) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new ValidationError('A user account with this email already exists', {
          email: data.email,
        });
      }
    }

    // Create tenant record
    const tenant = await prisma.tenant.create({
      data: {
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        alternatePhone: data.alternatePhone,
        idNumber: data.idNumber,
        idType: data.idType,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        currentAddress: data.currentAddress,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        employmentStatus: data.employmentStatus,
        employer: data.employer,
        employerPhone: data.employerPhone,
        monthlyIncome: data.monthlyIncome ? new Prisma.Decimal(data.monthlyIncome) : null,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        tenantType: data.tenantType as TenantType,
        notes: data.notes,
        status: 'ACTIVE',
      },
    });

    // Create portal access if requested
    let generatedPassword: string | null = null;
    if (data.createPortalAccess) {
      generatedPassword = await this.createPortalAccess(
        data.email,
        data.firstName,
        data.lastName,
        data.phone
      );
    }

    // Assign property if requested
    if (
      data.assignProperty &&
      data.propertyId &&
      data.leaseStartDate &&
      data.propertyMonthlyRent !== null &&
      data.propertyMonthlyRent !== undefined
    ) {
      await this.assignToProperty(userId, tenant.id, {
        propertyId: data.propertyId,
        leaseStartDate: data.leaseStartDate,
        leaseEndDate: data.leaseEndDate,
        monthlyRent: data.propertyMonthlyRent,
        depositPaid: data.propertyDepositPaid || 0,
        moveInDate: data.propertyMoveInDate,
        unitLabel: data.propertyUnitLabel,
      });
    }

    // Create default document folders
    try {
      await createDefaultFoldersForTenant(prisma, userId, tenant.id, data.propertyId || undefined);
    } catch (folderError) {
      logger.error('Error creating default folders', { error: folderError });
      // Don't fail the entire request if folder creation fails
    }

    // Send welcome email
    await this.sendWelcomeEmail(userId, tenant, data, generatedPassword);

    logger.info('Tenant created', {
      tenantId: tenant.id,
      userId,
      hasPortalAccess: data.createPortalAccess,
      hasPropertyAssignment: data.assignProperty,
    });

    return { tenant, generatedPassword };
  }

  /**
   * Create portal access for tenant - creates User account with auto-generated password
   */
  async createPortalAccess(
    email: string,
    firstName: string,
    lastName: string,
    phone: string
  ): Promise<string> {
    const generatedPassword = generateTenantPassword(firstName, lastName);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        accountType: 'TENANT',
        role: 'TENANT',
        isActive: true,
        emailVerified: false,
        requirePasswordChange: true, // Force password change on first login
        propertyLimit: 0, // Tenants don't own properties
      },
    });

    logger.info('Portal access created', { email });
    return generatedPassword;
  }

  /**
   * Assign tenant to a property - creates PropertyTenant junction record
   */
  async assignToProperty(
    userId: string,
    tenantId: string,
    assignment: {
      propertyId: string;
      leaseStartDate: string;
      leaseEndDate?: string | null;
      monthlyRent: number;
      depositPaid?: number;
      moveInDate?: string | null;
      unitLabel?: string | null;
    }
  ): Promise<void> {
    if (
      assignment.leaseEndDate &&
      !isValidLeaseDateRange(assignment.leaseStartDate, assignment.leaseEndDate)
    ) {
      throw new ValidationError(LEASE_END_DATE_ERROR, {
        leaseStartDate: assignment.leaseStartDate,
        leaseEndDate: assignment.leaseEndDate,
      });
    }

    // Verify property belongs to user and check multi-tenant support
    const today = new Date();
    const property = await prisma.property.findFirst({
      where: { id: assignment.propertyId, userId },
      include: {
        tenants: {
          where: {
            isActive: true,
            OR: [{ leaseEndDate: null }, { leaseEndDate: { gte: today } }],
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundError('Property', assignment.propertyId);
    }

    const activeTenantCount = Array.isArray(property.tenants) ? property.tenants.length : undefined;
    const hasActiveTenant = Boolean(
      activeTenantCount !== undefined
        ? activeTenantCount > 0
        : await prisma.propertyTenant.findFirst({
            where: {
              propertyId: assignment.propertyId,
              isActive: true,
              OR: [{ leaseEndDate: null }, { leaseEndDate: { gte: today } }],
            },
            select: { id: true },
          })
    );

    // Check if property allows multiple tenants
    if (!property.allowsMultipleTenants && hasActiveTenant) {
      throw new ValidationError(
        'Property already has an active tenant assignment. Enable "Allows Multiple Tenants" in property settings to add more tenants.',
        {
          propertyId: assignment.propertyId,
          allowsMultipleTenants: property.allowsMultipleTenants,
        }
      );
    }

    // Check for duplicate: same tenant, same property, same unit, still active
    const existingAssignment = await prisma.propertyTenant.findFirst({
      where: {
        propertyId: assignment.propertyId,
        tenantId,
        unitLabel: assignment.unitLabel || null,
        isActive: true,
      },
    });

    if (existingAssignment) {
      throw new ValidationError(
        'This tenant already has an active lease for this property/unit combination',
        {
          propertyId: assignment.propertyId,
          unitLabel: assignment.unitLabel,
        }
      );
    }

    // Create property-tenant assignment
    await prisma.propertyTenant.create({
      data: {
        userId,
        propertyId: assignment.propertyId,
        tenantId,
        leaseStartDate: new Date(assignment.leaseStartDate),
        leaseEndDate: assignment.leaseEndDate ? new Date(assignment.leaseEndDate) : null,
        monthlyRent: new Prisma.Decimal(assignment.monthlyRent),
        depositPaid: new Prisma.Decimal(assignment.depositPaid || 0),
        moveInDate: assignment.moveInDate ? new Date(assignment.moveInDate) : null,
        unitLabel: assignment.unitLabel || null,
        isActive: true,
      },
    });

    logger.info('Tenant assigned to property', {
      tenantId,
      propertyId: assignment.propertyId,
      unitLabel: assignment.unitLabel,
    });
  }

  /**
   * Send welcome email to tenant
   */
  private async sendWelcomeEmail(
    userId: string,
    tenant: { id: string; firstName: string; lastName: string; email: string },
    data: CreateTenantDTO,
    generatedPassword: string | null
  ): Promise<void> {
    try {
      // Fetch landlord information
      const landlord = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true, phone: true },
      });

      if (!landlord) return;

      const landlordName = `${landlord.firstName} ${landlord.lastName}`;
      const landlordEmail = landlord.email || '';
      const landlordPhone = landlord.phone || '';

      // Get property info if assigned
      let propertyName = 'Your Property';
      let propertyAddress = 'To be assigned';
      let moveInDate: string | undefined;
      let monthlyRent = 'TBD';
      let deposit = 'TBD';
      let leaseStartDate = 'TBD';
      let leaseEndDate: string | undefined;

      if (data.assignProperty && data.propertyId) {
        const property = await prisma.property.findUnique({
          where: { id: data.propertyId },
          select: { name: true, address: true, city: true },
        });

        if (property) {
          propertyName = property.name;
          propertyAddress = `${property.address}, ${property.city}`;
          moveInDate = data.propertyMoveInDate
            ? new Date(data.propertyMoveInDate).toLocaleDateString('en-ZA')
            : undefined;
          monthlyRent = data.propertyMonthlyRent
            ? `R${data.propertyMonthlyRent.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
            : 'TBD';
          deposit = data.propertyDepositPaid
            ? `R${data.propertyDepositPaid.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
            : 'R0.00';
          leaseStartDate = data.leaseStartDate
            ? new Date(data.leaseStartDate).toLocaleDateString('en-ZA')
            : 'TBD';
          leaseEndDate = data.leaseEndDate
            ? new Date(data.leaseEndDate).toLocaleDateString('en-ZA')
            : undefined;
        }
      }

      // Send email based on portal access
      if (data.createPortalAccess && generatedPassword) {
        // Send email with portal access credentials
        const emailData = emailTemplates.tenantWelcomeWithPortal({
          tenantName: `${tenant.firstName} ${tenant.lastName}`,
          email: tenant.email,
          password: generatedPassword,
          landlordName,
          landlordEmail,
          landlordPhone,
          propertyName,
          propertyAddress,
          moveInDate,
          monthlyRent,
          deposit,
          leaseStartDate,
          leaseEndDate,
          loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/portal/login`,
        });

        await sendEmail({
          to: tenant.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });

        logger.info('Welcome email with portal access sent', { tenantId: tenant.id });
      } else if (data.assignProperty && data.propertyId) {
        // Send email without portal access (only if property was assigned)
        const emailData = emailTemplates.tenantWelcomeNoPortal({
          tenantName: `${tenant.firstName} ${tenant.lastName}`,
          landlordName,
          landlordEmail,
          landlordPhone,
          propertyName,
          propertyAddress,
          moveInDate,
          monthlyRent,
          deposit,
          leaseStartDate,
          leaseEndDate,
        });

        await sendEmail({
          to: tenant.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });

        logger.info('Welcome email (no portal) sent', { tenantId: tenant.id });
      }
    } catch (emailError) {
      logger.error('Error sending welcome email', { error: emailError, tenantId: tenant.id });
      // Don't fail the entire request if email sending fails
    }
  }

  /**
   * Update a tenant
   */
  async update(tenantId: string, userId: string, data: UpdateTenantDTO) {
    const tenant = await tenantRepository.findById(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }

    if (tenant.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this tenant');
    }

    // If email is being changed, check it doesn't exist
    if (data.email && data.email !== tenant.email) {
      const existing = await prisma.tenant.findFirst({
        where: { userId, email: data.email },
      });
      if (existing) {
        throw new ValidationError('A tenant with this email already exists', {
          email: data.email,
        });
      }
    }

    const updated = await tenantRepository.update(tenantId, {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      monthlyIncome: data.monthlyIncome ? new Prisma.Decimal(data.monthlyIncome) : undefined,
    });

    logger.info('Tenant updated', { tenantId, userId, changes: Object.keys(data) });
    return updated;
  }

  /**
   * Delete a tenant
   */
  async delete(tenantId: string, userId: string) {
    const tenant = await tenantRepository.findById(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }

    if (tenant.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this tenant');
    }

    // Check if tenant has active bookings
    const hasActiveBookings = tenant.bookings?.some(
      (booking) => booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN'
    );

    if (hasActiveBookings) {
      throw new ValidationError(
        'Cannot delete tenant with active bookings. Please cancel or complete bookings first.',
        { tenantId }
      );
    }

    await tenantRepository.delete(tenantId);
    logger.info('Tenant deleted', { tenantId, userId });

    return { success: true };
  }

  /**
   * Get tenant by ID with ownership verification
   */
  async getById(tenantId: string, userId: string) {
    const tenant = await tenantRepository.findById(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }

    if (tenant.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view this tenant');
    }

    return tenant;
  }

  /**
   * List tenants with pagination and filters
   */
  async list(userId: string, params: ListTenantsDTO) {
    const { search, status, type, page, limit } = params;

    const where: Prisma.TenantWhereInput = { userId };

    if (status) where.status = status;
    if (type) where.tenantType = type;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          properties: {
            include: {
              property: { select: { id: true, name: true, address: true, city: true } },
            },
            where: { isActive: true },
          },
          _count: { select: { bookings: true, payments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get tenant statistics
   */
  async getStatistics(userId: string) {
    return tenantRepository.getStatistics(userId);
  }

  /**
   * Update tenant status
   */
  async updateStatus(tenantId: string, userId: string, status: TenantStatus) {
    const tenant = await this.getById(tenantId, userId);
    const updated = await tenantRepository.update(tenantId, { status });

    logger.info('Tenant status updated', {
      tenantId,
      userId,
      oldStatus: tenant.status,
      newStatus: status,
    });

    return updated;
  }
}

// Export singleton instance
export const tenantService = new TenantService();
