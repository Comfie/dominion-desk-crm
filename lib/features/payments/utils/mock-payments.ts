export function allowMockTenantPayments() {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_PAYMENTS === 'true';
}
