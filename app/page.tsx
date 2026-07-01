import type { Metadata } from 'next';
import { LandingPageClient } from './components/LandingPageClient';

export const metadata: Metadata = {
  title: 'DominionDesk | Rental Operations OS for South Africa',
  description:
    'Run placement, tenant management, rent collection, maintenance, documents, and reports from one South African rental operations platform.',
  openGraph: {
    title: 'DominionDesk | Rental Operations OS for South Africa',
    description:
      'A South African rental operations platform for landlords, property companies, and rental agents.',
    url: 'https://dominiondesk.com',
    siteName: 'DominionDesk',
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DominionDesk | Rental Operations OS for South Africa',
    description:
      'Manage placement, tenants, rent, maintenance, documents, and reports from one product.',
  },
};

export default function Page() {
  return <LandingPageClient />;
}
