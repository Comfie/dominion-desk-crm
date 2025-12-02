export class TemplateEngineService {
  /**
   * Replace variables in template with context values
   * Example: "Hello {{guestName}}" + {guestName: "John"} => "Hello John"
   */
  render(template: string, context: Record<string, any>): string {
    let result = template;

    // Find all {{variable}} patterns
    const variables = this.extractVariables(template);

    for (const variable of variables) {
      const value = this.getNestedValue(context, variable);
      const placeholder = `{{${variable}}}`;
      result = result.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        value?.toString() || ''
      );
    }

    return result;
  }

  /**
   * Extract all variables from template
   */
  extractVariables(template: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = template.matchAll(regex);
    return Array.from(matches, (match) => match[1].trim());
  }

  /**
   * Get nested value from object (e.g., "property.name")
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get available variables for a context type
   */
  getAvailableVariables(contextType: 'booking' | 'tenant' | 'maintenance'): string[] {
    const variables = {
      booking: [
        'guestName',
        'guestEmail',
        'guestPhone',
        'propertyName',
        'propertyAddress',
        'checkInDate',
        'checkInTime',
        'checkOutDate',
        'checkOutTime',
        'totalAmount',
        'bookingReference',
        'numberOfGuests',
        'numberOfNights',
      ],
      tenant: [
        'tenantName',
        'tenantEmail',
        'propertyName',
        'propertyAddress',
        'leaseStartDate',
        'leaseEndDate',
        'monthlyRent',
      ],
      maintenance: [
        'propertyName',
        'propertyAddress',
        'requestTitle',
        'requestDescription',
        'scheduledDate',
        'assignedTo',
      ],
    };

    return variables[contextType] || [];
  }

  /**
   * Validate that all variables in template exist in context
   */
  validateTemplate(
    template: string,
    context: Record<string, any>
  ): { valid: boolean; missing: string[] } {
    const variables = this.extractVariables(template);
    const missing = variables.filter((v) => {
      const value = this.getNestedValue(context, v);
      return value === undefined || value === null;
    });

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

export const templateEngineService = new TemplateEngineService();
