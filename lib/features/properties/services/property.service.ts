import { PropertyStatus, PropertyType, RentalType } from '@prisma/client';
import { propertyRepository } from '@/lib/features/properties/repositories/property.repository';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/shared/logger';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';

/**
 * Property Service
 * Business logic layer for properties
 */
export class PropertyService {
  /**
   * Create a new property
   */
  async create(
    userId: string,
    data: {
      name: string;
      description?: string;
      propertyType: PropertyType;
      address: string;
      city: string;
      province: string;
      postalCode: string;
      country?: string;
      bedrooms: number;
      bathrooms: number;
      size?: number;
      furnished?: boolean;
      parkingSpaces?: number;
      amenities?: string[];
      primaryImageUrl?: string;
      rentalType?: RentalType;
      monthlyRent?: number;
      dailyRate?: number;
      weeklyRate?: number;
      monthlyRate?: number;
      cleaningFee?: number;
      securityDeposit?: number;
      isAvailable?: boolean;
      availableFrom?: Date;
      minimumStay?: number;
      maximumStay?: number;
      petsAllowed?: boolean;
      smokingAllowed?: boolean;
      checkInTime?: string;
      checkOutTime?: string;
      houseRules?: string;
    }
  ) {
    // Validation: At least one pricing field required
    if (!data.monthlyRent && !data.dailyRate && !data.weeklyRate && !data.monthlyRate) {
      throw new ValidationError('At least one pricing field is required', {
        fields: ['monthlyRent', 'dailyRate', 'weeklyRate', 'monthlyRate'],
      });
    }

    const property = await propertyRepository.create({
      user: { connect: { id: userId } },
      name: data.name,
      description: data.description,
      propertyType: data.propertyType,
      address: data.address,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
      country: data.country || 'South Africa',
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      size: data.size,
      furnished: data.furnished ?? false,
      parkingSpaces: data.parkingSpaces ?? 0,
      amenities: data.amenities || undefined,
      primaryImageUrl: data.primaryImageUrl,
      rentalType: data.rentalType || 'LONG_TERM',
      monthlyRent: data.monthlyRent,
      dailyRate: data.dailyRate,
      weeklyRate: data.weeklyRate,
      monthlyRate: data.monthlyRate,
      cleaningFee: data.cleaningFee,
      securityDeposit: data.securityDeposit,
      isAvailable: data.isAvailable ?? true,
      availableFrom: data.availableFrom,
      minimumStay: data.minimumStay,
      maximumStay: data.maximumStay,
      petsAllowed: data.petsAllowed ?? false,
      smokingAllowed: data.smokingAllowed ?? false,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      houseRules: data.houseRules,
      status: 'ACTIVE',
    });

    logger.info('Property created', {
      propertyId: property.id,
      userId,
      name: data.name,
    });

    return property;
  }

  /**
   * Update a property
   */
  async update(
    propertyId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      propertyType?: PropertyType;
      address?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      bedrooms?: number;
      bathrooms?: number;
      size?: number;
      furnished?: boolean;
      parkingSpaces?: number;
      amenities?: string[];
      primaryImageUrl?: string;
      rentalType?: RentalType;
      monthlyRent?: number;
      dailyRate?: number;
      weeklyRate?: number;
      monthlyRate?: number;
      cleaningFee?: number;
      securityDeposit?: number;
      isAvailable?: boolean;
      availableFrom?: Date;
      minimumStay?: number;
      maximumStay?: number;
      petsAllowed?: boolean;
      smokingAllowed?: boolean;
      checkInTime?: string;
      checkOutTime?: string;
      houseRules?: string;
      status?: PropertyStatus;
    }
  ) {
    const property = await propertyRepository.findById(propertyId);

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    if (property.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this property');
    }

    const updated = await propertyRepository.update(propertyId, data);

    logger.info('Property updated', {
      propertyId,
      userId,
      changes: Object.keys(data),
    });

    return updated;
  }

  /**
   * Delete a property
   */
  async delete(propertyId: string, userId: string) {
    const property = await propertyRepository.findById(propertyId);

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    if (property.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this property');
    }

    // Check if property has active bookings
    const hasActiveBookings = property.bookings?.some(
      (booking) => booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN'
    );

    if (hasActiveBookings) {
      throw new ValidationError(
        'Cannot delete property with active bookings. Please cancel or complete bookings first.',
        { propertyId, activeBookings: property.bookings?.length }
      );
    }

    // Check if property has active tenant assignments
    const activeTenants = await prisma.propertyTenant.findMany({
      where: {
        propertyId,
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (activeTenants.length > 0) {
      const tenantNames = activeTenants
        .map((pt) => `${pt.tenant.firstName} ${pt.tenant.lastName}`)
        .join(', ');

      throw new ValidationError(
        `Cannot delete property with active tenant assignments. Please terminate the lease(s) first. Active tenants: ${tenantNames}`,
        { propertyId, activeTenants: activeTenants.length, tenantNames }
      );
    }

    await propertyRepository.delete(propertyId);

    logger.info('Property deleted', {
      propertyId,
      userId,
    });

    return { success: true };
  }

  /**
   * Get property by ID with ownership verification
   */
  async getById(propertyId: string, userId: string) {
    const property = await propertyRepository.findById(propertyId);

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    if (property.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view this property');
    }

    return property;
  }

  /**
   * List properties with filters
   */
  async list(
    userId: string,
    filters?: {
      status?: PropertyStatus;
      propertyType?: PropertyType;
      rentalType?: RentalType;
      isAvailable?: boolean;
      search?: string;
    }
  ) {
    return propertyRepository.findByUserId(userId, filters);
  }

  /**
   * Get property statistics
   */
  async getStatistics(userId: string) {
    return propertyRepository.getStatistics(userId);
  }

  /**
   * Get properties with upcoming bookings
   */
  async getWithUpcomingBookings(userId: string, days = 30) {
    return propertyRepository.findWithUpcomingBookings(userId, days);
  }

  /**
   * Update property status
   */
  async updateStatus(propertyId: string, userId: string, status: PropertyStatus) {
    const property = await this.getById(propertyId, userId);

    const updated = await propertyRepository.update(propertyId, { status });

    logger.info('Property status updated', {
      propertyId,
      userId,
      oldStatus: property.status,
      newStatus: status,
    });

    return updated;
  }

  /**
   * Update property availability
   */
  async updateAvailability(
    propertyId: string,
    userId: string,
    isAvailable: boolean,
    availableFrom?: Date
  ) {
    await this.getById(propertyId, userId);

    const updated = await propertyRepository.update(propertyId, {
      isAvailable,
      availableFrom,
    });

    logger.info('Property availability updated', {
      propertyId,
      userId,
      isAvailable,
    });

    return updated;
  }

  /**
   * Bulk import properties
   * Returns summary of successful and failed imports
   */
  async bulkImport(
    userId: string,
    properties: Array<Parameters<typeof this.create>[1]>,
    skipErrors = false
  ) {
    const results = {
      total: properties.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ index: number; property: string; error: string }>,
      createdProperties: [] as Array<{ id: string; name: string }>,
    };

    for (let i = 0; i < properties.length; i++) {
      const propertyData = properties[i];

      try {
        const created = await this.create(userId, propertyData);
        results.successful++;
        results.createdProperties.push({
          id: created.id,
          name: created.name,
        });

        logger.info('Property imported successfully', {
          index: i + 1,
          propertyName: propertyData.name,
          userId,
        });
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          index: i + 1,
          property: propertyData.name || `Property ${i + 1}`,
          error: errorMessage,
        });

        logger.error('Property import failed', {
          index: i + 1,
          propertyName: propertyData.name,
          userId,
          error: errorMessage,
        });

        // If skipErrors is false, stop processing and throw error
        if (!skipErrors) {
          throw new ValidationError(`Failed to import property at row ${i + 1}: ${errorMessage}`, {
            failedProperty: propertyData.name,
            errorDetails: results.errors,
          });
        }
      }
    }

    logger.info('Bulk import completed', {
      userId,
      total: results.total,
      successful: results.successful,
      failed: results.failed,
    });

    return results;
  }
}

// Export singleton instance
export const propertyService = new PropertyService();
