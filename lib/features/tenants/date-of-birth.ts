export const MINIMUM_TENANT_AGE = 15;

export const TENANT_DATE_OF_BIRTH_ERROR =
  'Date of birth cannot be in the future and tenant must be at least 15 years old';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function createUtcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

function padDatePart(value: number) {
  return value.toString().padStart(2, '0');
}

export function formatDateInputValue(date: Date) {
  return [
    date.getUTCFullYear(),
    padDatePart(date.getUTCMonth() + 1),
    padDatePart(date.getUTCDate()),
  ].join('-');
}

export function parseIsoDateValue(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsedDate = createUtcDate(year, month, day);

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

export function getLatestAllowedTenantDateOfBirth(referenceDate = new Date()) {
  const latestAllowedDate = createUtcDate(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth() + 1,
    referenceDate.getUTCDate()
  );

  latestAllowedDate.setUTCFullYear(latestAllowedDate.getUTCFullYear() - MINIMUM_TENANT_AGE);

  return latestAllowedDate;
}

export function getLatestAllowedTenantDateOfBirthInputValue(referenceDate = new Date()) {
  return formatDateInputValue(getLatestAllowedTenantDateOfBirth(referenceDate));
}

export function isAllowedTenantDateOfBirth(value: string, referenceDate = new Date()) {
  const parsedDate = parseIsoDateValue(value);

  if (!parsedDate) {
    return false;
  }

  return parsedDate <= getLatestAllowedTenantDateOfBirth(referenceDate);
}
