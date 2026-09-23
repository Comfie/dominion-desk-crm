import type { Metadata } from 'next';
import { LandingPageClient } from './components/LandingPageClient';

export const metadata: Metadata = {
  title: 'DominionDesk | See who has paid rent in seconds',
  description:
    'Upload your bank statement and DominionDesk matches every EFT to the right tenant. Rent roll, arrears, reminders, leases and a tenant portal for South African landlords.',
  openGraph: {
    title: 'DominionDesk | See who has paid rent in seconds',
    description:
      'Bank statement reconciliation, arrears and reminders for South African landlords. R99 per occupied unit.',
    url: 'https://dominiondesk.com',
    siteName: 'DominionDesk',
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DominionDesk | See who has paid rent in seconds',
    description: 'Upload your bank statement. See who hasn’t paid.',
  },
};

export default function Page() {
  return <LandingPageClient />;
}
