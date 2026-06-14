import * as XLSX from 'xlsx';

type ExportableProperty = {
  id: string;
  name: string;
  description?: string | null;
  propertyType: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string | null;
  bedrooms: number;
  bathrooms: number;
  size?: number | null;
  furnished?: boolean;
  parkingSpaces?: number;
  amenities?: unknown;
  primaryImageUrl?: string | null;
  rentalType: string;
  monthlyRent?: number | null;
  dailyRate?: number | null;
  weeklyRate?: number | null;
  monthlyRate?: number | null;
  cleaningFee?: number | null;
  securityDeposit?: number | null;
  isAvailable?: boolean;
  availableFrom?: string | Date | null;
  minimumStay?: number | null;
  maximumStay?: number | null;
  allowsMultipleTenants?: boolean;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  houseRules?: string | null;
  status: string;
  activeTenantCount?: number;
  occupiedTenantCount?: number;
  reservedTenantCount?: number;
  hasActiveTenant?: boolean;
  isOccupied?: boolean;
  isReserved?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  _count?: {
    bookings?: number;
    tenants?: number;
  };
};

const columns = [
  { header: 'Property ID', value: (property: ExportableProperty) => property.id },
  { header: 'Name', value: (property: ExportableProperty) => property.name },
  { header: 'Description', value: (property: ExportableProperty) => property.description || '' },
  { header: 'Property Type', value: (property: ExportableProperty) => property.propertyType },
  { header: 'Status', value: (property: ExportableProperty) => property.status },
  { header: 'Address', value: (property: ExportableProperty) => property.address },
  { header: 'City', value: (property: ExportableProperty) => property.city },
  { header: 'Province', value: (property: ExportableProperty) => property.province },
  { header: 'Postal Code', value: (property: ExportableProperty) => property.postalCode },
  { header: 'Country', value: (property: ExportableProperty) => property.country || '' },
  { header: 'Bedrooms', value: (property: ExportableProperty) => String(property.bedrooms) },
  { header: 'Bathrooms', value: (property: ExportableProperty) => String(property.bathrooms) },
  { header: 'Size (sqm)', value: (property: ExportableProperty) => formatCellValue(property.size) },
  {
    header: 'Furnished',
    value: (property: ExportableProperty) => formatCellValue(property.furnished),
  },
  {
    header: 'Parking Spaces',
    value: (property: ExportableProperty) => formatCellValue(property.parkingSpaces),
  },
  {
    header: 'Amenities',
    value: (property: ExportableProperty) => formatAmenities(property.amenities),
  },
  {
    header: 'Primary Image URL',
    value: (property: ExportableProperty) => property.primaryImageUrl || '',
  },
  { header: 'Rental Type', value: (property: ExportableProperty) => property.rentalType },
  {
    header: 'Monthly Rent',
    value: (property: ExportableProperty) => formatCellValue(property.monthlyRent),
  },
  {
    header: 'Daily Rate',
    value: (property: ExportableProperty) => formatCellValue(property.dailyRate),
  },
  {
    header: 'Weekly Rate',
    value: (property: ExportableProperty) => formatCellValue(property.weeklyRate),
  },
  {
    header: 'Monthly Rate',
    value: (property: ExportableProperty) => formatCellValue(property.monthlyRate),
  },
  {
    header: 'Cleaning Fee',
    value: (property: ExportableProperty) => formatCellValue(property.cleaningFee),
  },
  {
    header: 'Security Deposit',
    value: (property: ExportableProperty) => formatCellValue(property.securityDeposit),
  },
  {
    header: 'Is Available',
    value: (property: ExportableProperty) => formatCellValue(property.isAvailable),
  },
  {
    header: 'Available From',
    value: (property: ExportableProperty) => formatDateCellValue(property.availableFrom),
  },
  {
    header: 'Minimum Stay',
    value: (property: ExportableProperty) => formatCellValue(property.minimumStay),
  },
  {
    header: 'Maximum Stay',
    value: (property: ExportableProperty) => formatCellValue(property.maximumStay),
  },
  {
    header: 'Allows Multiple Tenants',
    value: (property: ExportableProperty) => formatCellValue(property.allowsMultipleTenants),
  },
  {
    header: 'Pets Allowed',
    value: (property: ExportableProperty) => formatCellValue(property.petsAllowed),
  },
  {
    header: 'Smoking Allowed',
    value: (property: ExportableProperty) => formatCellValue(property.smokingAllowed),
  },
  { header: 'Check-In Time', value: (property: ExportableProperty) => property.checkInTime || '' },
  {
    header: 'Check-Out Time',
    value: (property: ExportableProperty) => property.checkOutTime || '',
  },
  { header: 'House Rules', value: (property: ExportableProperty) => property.houseRules || '' },
  {
    header: 'Active Tenant Count',
    value: (property: ExportableProperty) => formatCellValue(property.activeTenantCount),
  },
  {
    header: 'Occupied Tenant Count',
    value: (property: ExportableProperty) => formatCellValue(property.occupiedTenantCount),
  },
  {
    header: 'Reserved Tenant Count',
    value: (property: ExportableProperty) => formatCellValue(property.reservedTenantCount),
  },
  {
    header: 'Has Active Tenant',
    value: (property: ExportableProperty) => formatCellValue(property.hasActiveTenant),
  },
  {
    header: 'Is Occupied',
    value: (property: ExportableProperty) => formatCellValue(property.isOccupied),
  },
  {
    header: 'Is Reserved',
    value: (property: ExportableProperty) => formatCellValue(property.isReserved),
  },
  {
    header: 'Bookings Count',
    value: (property: ExportableProperty) => formatCellValue(property._count?.bookings),
  },
  {
    header: 'Tenants Count',
    value: (property: ExportableProperty) => formatCellValue(property._count?.tenants),
  },
  {
    header: 'Created At',
    value: (property: ExportableProperty) => formatDateCellValue(property.createdAt),
  },
  {
    header: 'Updated At',
    value: (property: ExportableProperty) => formatDateCellValue(property.updatedAt),
  },
];

function formatCellValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function formatDateCellValue(value: string | Date | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString('en-ZA');
}

function formatAmenities(amenities: unknown) {
  if (!Array.isArray(amenities)) return '';
  return amenities.map((item) => String(item)).join(' | ');
}

export function buildPropertyExportWorkbook(properties: ExportableProperty[]) {
  const rows = properties.map((property) =>
    columns.reduce<Record<string, string>>((row, column) => {
      row[column.header] = column.value(property);
      return row;
    }, {})
  );

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: columns.map((column) => column.header),
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Properties');

  return workbook;
}

export function downloadPropertyExport(
  properties: ExportableProperty[],
  filename = 'properties-export.xlsx'
) {
  const workbook = buildPropertyExportWorkbook(properties);
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type { ExportableProperty };
