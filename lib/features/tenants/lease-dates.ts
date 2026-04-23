import { parseIsoDateValue } from './date-of-birth';

export const LEASE_END_DATE_ERROR = 'Lease end date must be after lease start date';

export function isValidLeaseDateRange(leaseStartDate: string, leaseEndDate: string) {
  const startDate = parseIsoDateValue(leaseStartDate);
  const endDate = parseIsoDateValue(leaseEndDate);

  if (!startDate || !endDate) {
    return false;
  }

  return endDate > startDate;
}
