import { PageHeader } from '@/components/shared';
import { NewLandlordForm } from './landlord-form';

export default function NewLandlordPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Landlord" description="Capture an owner represented by the agency" />
      <NewLandlordForm />
    </div>
  );
}
