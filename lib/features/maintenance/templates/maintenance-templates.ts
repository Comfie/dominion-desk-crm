/**
 * Email templates for maintenance request notifications
 */

export interface MaintenanceEmailData {
  landlordName: string;
  tenantName?: string;
  tenantEmail?: string;
  propertyName: string;
  propertyAddress: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  scheduledDate?: string;
  completedDate?: string;
  estimatedCost?: string;
  actualCost?: string;
  assignedTo?: string | null;
  resolutionNotes?: string;
  daysStale?: number;
}

export const maintenanceEmailTemplates = {
  /**
   * New maintenance request created
   */
  created: (data: MaintenanceEmailData) => ({
    subject: `New Maintenance Request - ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Maintenance Request Created</h2>
        <p>Dear ${data.landlordName},</p>
        <p>A new maintenance request has been created for your property.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Property:</strong> ${data.propertyName}</p>
          <p><strong>Address:</strong> ${data.propertyAddress}</p>
          <p><strong>Title:</strong> ${data.title}</p>
          <p><strong>Description:</strong> ${data.description}</p>
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Priority:</strong> <span style="color: ${data.priority === 'URGENT' ? '#d32f2f' : data.priority === 'HIGH' ? '#f57c00' : '#666'};">${data.priority}</span></p>
          ${data.tenantName ? `<p><strong>Reported by:</strong> ${data.tenantName}</p>` : ''}
          ${data.estimatedCost ? `<p><strong>Estimated Cost:</strong> ${data.estimatedCost}</p>` : ''}
        </div>
        
        <p>Please review and schedule this maintenance request as soon as possible.</p>
        <p>Best regards,<br>DominionDesk Team</p>
      </div>
    `,
    text: `
New Maintenance Request Created

Dear ${data.landlordName},

A new maintenance request has been created for your property.

Property: ${data.propertyName}
Address: ${data.propertyAddress}
Title: ${data.title}
Description: ${data.description}
Category: ${data.category}
Priority: ${data.priority}
${data.tenantName ? `Reported by: ${data.tenantName}` : ''}
${data.estimatedCost ? `Estimated Cost: ${data.estimatedCost}` : ''}

Please review and schedule this maintenance request as soon as possible.

Best regards,
DominionDesk Team
    `.trim(),
  }),

  /**
   * Maintenance request status changed to SCHEDULED
   */
  scheduled: (data: MaintenanceEmailData) => ({
    subject: `Maintenance Scheduled - ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Maintenance Request Scheduled</h2>
        <p>Dear ${data.tenantName || data.landlordName},</p>
        <p>Your maintenance request has been scheduled.</p>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
          <p><strong>Request:</strong> ${data.title}</p>
          <p><strong>Property:</strong> ${data.propertyName}</p>
          <p><strong>Status:</strong> <span style="color: #2196F3;">Scheduled</span></p>
          ${data.scheduledDate ? `<p><strong>Scheduled Date:</strong> ${data.scheduledDate}</p>` : ''}
          ${data.assignedTo ? `<p><strong>Assigned To:</strong> ${data.assignedTo}</p>` : ''}
        </div>
        
        <p>We will keep you updated on the progress.</p>
        <p>Best regards,<br>Property Management Team</p>
      </div>
    `,
    text: `
Maintenance Request Scheduled

Dear ${data.tenantName || data.landlordName},

Your maintenance request has been scheduled.

Request: ${data.title}
Property: ${data.propertyName}
Status: Scheduled
${data.scheduledDate ? `Scheduled Date: ${data.scheduledDate}` : ''}
${data.assignedTo ? `Assigned To: ${data.assignedTo}` : ''}

We will keep you updated on the progress.

Best regards,
Property Management Team
    `.trim(),
  }),

  /**
   * Maintenance request status changed to IN_PROGRESS
   */
  inProgress: (data: MaintenanceEmailData) => ({
    subject: `Maintenance In Progress - ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Maintenance Work In Progress</h2>
        <p>Dear ${data.tenantName || data.landlordName},</p>
        <p>Work has started on your maintenance request.</p>
        
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <p><strong>Request:</strong> ${data.title}</p>
          <p><strong>Property:</strong> ${data.propertyName}</p>
          <p><strong>Status:</strong> <span style="color: #ff9800;">In Progress</span></p>
          ${data.assignedTo ? `<p><strong>Assigned To:</strong> ${data.assignedTo}</p>` : ''}
        </div>
        
        <p>Our team is working to resolve this issue as quickly as possible.</p>
        <p>Best regards,<br>Property Management Team</p>
      </div>
    `,
    text: `
Maintenance Work In Progress

Dear ${data.tenantName || data.landlordName},

Work has started on your maintenance request.

Request: ${data.title}
Property: ${data.propertyName}
Status: In Progress
${data.assignedTo ? `Assigned To: ${data.assignedTo}` : ''}

Our team is working to resolve this issue as quickly as possible.

Best regards,
Property Management Team
    `.trim(),
  }),

  /**
   * Maintenance request status changed to COMPLETED
   */
  completed: (data: MaintenanceEmailData) => ({
    subject: `Maintenance Completed - ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Maintenance Request Completed</h2>
        <p>Dear ${data.tenantName || data.landlordName},</p>
        <p>Your maintenance request has been completed.</p>
        
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <p><strong>Request:</strong> ${data.title}</p>
          <p><strong>Property:</strong> ${data.propertyName}</p>
          <p><strong>Status:</strong> <span style="color: #4caf50;">✓ Completed</span></p>
          ${data.completedDate ? `<p><strong>Completed Date:</strong> ${data.completedDate}</p>` : ''}
          ${data.actualCost ? `<p><strong>Actual Cost:</strong> ${data.actualCost}</p>` : ''}
          ${data.resolutionNotes ? `<p><strong>Resolution Notes:</strong> ${data.resolutionNotes}</p>` : ''}
        </div>
        
        <p>Thank you for your patience. If you have any concerns, please contact us.</p>
        <p>Best regards,<br>Property Management Team</p>
      </div>
    `,
    text: `
Maintenance Request Completed

Dear ${data.tenantName || data.landlordName},

Your maintenance request has been completed.

Request: ${data.title}
Property: ${data.propertyName}
Status: ✓ Completed
${data.completedDate ? `Completed Date: ${data.completedDate}` : ''}
${data.actualCost ? `Actual Cost: ${data.actualCost}` : ''}
${data.resolutionNotes ? `Resolution Notes: ${data.resolutionNotes}` : ''}

Thank you for your patience. If you have any concerns, please contact us.

Best regards,
Property Management Team
    `.trim(),
  }),

  /**
   * Maintenance request status changed to CANCELLED
   */
  cancelled: (data: MaintenanceEmailData) => ({
    subject: `Maintenance Cancelled - ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Maintenance Request Cancelled</h2>
        <p>Dear ${data.tenantName || data.landlordName},</p>
        <p>Your maintenance request has been cancelled.</p>
        
        <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
          <p><strong>Request:</strong> ${data.title}</p>
          <p><strong>Property:</strong> ${data.propertyName}</p>
          <p><strong>Status:</strong> <span style="color: #f44336;">Cancelled</span></p>
          ${data.resolutionNotes ? `<p><strong>Reason:</strong> ${data.resolutionNotes}</p>` : ''}
        </div>
        
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br>Property Management Team</p>
      </div>
    `,
    text: `
Maintenance Request Cancelled

Dear ${data.tenantName || data.landlordName},

Your maintenance request has been cancelled.

Request: ${data.title}
Property: ${data.propertyName}
Status: Cancelled
${data.resolutionNotes ? `Reason: ${data.resolutionNotes}` : ''}

If you have any questions, please contact us.

Best regards,
Property Management Team
    `.trim(),
  }),

  /**
   * Follow-up email for stale maintenance requests
   */
  followUp: (data: MaintenanceEmailData) => ({
    subject: `Follow-up: Maintenance Request - ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Maintenance Request Follow-up</h2>
        <p>Dear ${data.landlordName},</p>
        <p>This is a follow-up reminder for a maintenance request that has been pending for ${data.daysStale} days.</p>
        
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <p style="margin: 0 0 10px 0;"><strong>⚠️ Action Required</strong></p>
          <p><strong>Request:</strong> ${data.title}</p>
          <p><strong>Property:</strong> ${data.propertyName}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          <p><strong>Priority:</strong> <span style="color: ${data.priority === 'URGENT' ? '#d32f2f' : data.priority === 'HIGH' ? '#f57c00' : '#666'};">${data.priority}</span></p>
          <p><strong>Days Pending:</strong> ${data.daysStale} days</p>
          ${data.tenantName ? `<p><strong>Reported by:</strong> ${data.tenantName}</p>` : ''}
        </div>
        
        <p>Please review and update this maintenance request to keep your tenants informed.</p>
        <p>Best regards,<br>DominionDesk Team</p>
      </div>
    `,
    text: `
Maintenance Request Follow-up

Dear ${data.landlordName},

This is a follow-up reminder for a maintenance request that has been pending for ${data.daysStale} days.

⚠️ ACTION REQUIRED

Request: ${data.title}
Property: ${data.propertyName}
Status: ${data.status}
Priority: ${data.priority}
Days Pending: ${data.daysStale} days
${data.tenantName ? `Reported by: ${data.tenantName}` : ''}

Please review and update this maintenance request to keep your tenants informed.

Best regards,
DominionDesk Team
    `.trim(),
  }),
};
