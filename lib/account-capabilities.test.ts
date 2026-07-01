import { describe, expect, it } from 'vitest';

import {
  canAccessPlacementFeatures,
  getAccountCapabilities,
  isCustomerAccountType,
  type CustomerAccountType,
} from './account-capabilities';

describe('account capabilities', () => {
  it('allows only agency accounts to access placement features', () => {
    const accountTypes: CustomerAccountType[] = ['INDIVIDUAL', 'COMPANY', 'AGENCY'];

    expect(accountTypes.filter(canAccessPlacementFeatures)).toEqual(['AGENCY']);
  });

  it('keeps private and company accounts focused on management features', () => {
    expect(getAccountCapabilities('INDIVIDUAL')).toMatchObject({
      canManageOwnPortfolio: true,
      canUseCompanyTeamFeatures: false,
      canUsePlacementFeatures: false,
    });
    expect(getAccountCapabilities('COMPANY')).toMatchObject({
      canManageOwnPortfolio: true,
      canUseCompanyTeamFeatures: true,
      canUsePlacementFeatures: false,
    });
  });

  it('gives agency accounts both management and placement capabilities', () => {
    expect(getAccountCapabilities('AGENCY')).toMatchObject({
      canManageOwnPortfolio: true,
      canUseCompanyTeamFeatures: true,
      canUsePlacementFeatures: true,
    });
  });

  it('treats tenant accounts as non-customer accounts', () => {
    expect(isCustomerAccountType('TENANT')).toBe(false);
    expect(getAccountCapabilities('TENANT')).toMatchObject({
      canManageOwnPortfolio: false,
      canUseCompanyTeamFeatures: false,
      canUsePlacementFeatures: false,
    });
  });
});
