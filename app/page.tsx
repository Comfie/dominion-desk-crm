import type { Metadata } from 'next';
import { LandingPageClient } from './components/LandingPageClient';

export const metadata: Metadata = {
  title: 'DominionDesk | Property Management Software for SA Landlords',
  description:
    'Stop chasing rent. DominionDesk is the all-in-one property management platform built specifically for South Africa. Automate rent reminders, manage tenants, and generate tax-ready reports.',
  openGraph: {
    title: 'DominionDesk | Property Management Software for SA Landlords',
    description:
      'The all-in-one property management platform built specifically for South African landlords.',
    url: 'https://dominiondesk.com',
    siteName: 'DominionDesk',
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DominionDesk | Property Management Software for SA Landlords',
    description:
      'Automate rent reminders, manage tenants, and track maintenance from one dashboard.',
  },
};

export default function Page() {
  return <LandingPageClient />;
}
