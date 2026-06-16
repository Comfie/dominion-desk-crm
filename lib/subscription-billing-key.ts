export interface BillingBreakdownKeyItem {
  leaseId?: string | null;
  propertyId: string;
  tenantName: string;
}

export function getBillingBreakdownKey(item: BillingBreakdownKeyItem, index: number): string {
  return item.leaseId || `${item.propertyId}:${item.tenantName}:${index}`;
}
