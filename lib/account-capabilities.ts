export type CustomerAccountType = 'INDIVIDUAL' | 'COMPANY' | 'AGENCY';
export type SupportedAccountType = CustomerAccountType | 'TENANT';

export interface AccountCapabilities {
  canManageOwnPortfolio: boolean;
  canUseCompanyTeamFeatures: boolean;
  canUsePlacementFeatures: boolean;
}

const customerAccountTypes = new Set<string>(['INDIVIDUAL', 'COMPANY', 'AGENCY']);

export function isCustomerAccountType(
  accountType: string | null | undefined
): accountType is CustomerAccountType {
  return Boolean(accountType && customerAccountTypes.has(accountType));
}

export function canAccessPlacementFeatures(accountType: string | null | undefined): boolean {
  return accountType === 'AGENCY';
}

export function getAccountCapabilities(
  accountType: string | null | undefined
): AccountCapabilities {
  if (!isCustomerAccountType(accountType)) {
    return {
      canManageOwnPortfolio: false,
      canUseCompanyTeamFeatures: false,
      canUsePlacementFeatures: false,
    };
  }

  return {
    canManageOwnPortfolio: true,
    canUseCompanyTeamFeatures: accountType === 'COMPANY' || accountType === 'AGENCY',
    canUsePlacementFeatures: canAccessPlacementFeatures(accountType),
  };
}
