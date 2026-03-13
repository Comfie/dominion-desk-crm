import type { Metadata } from 'next';
import EarlyAccessPage from './_components/EarlyAccessPage';

export const metadata: Metadata = {
  title: 'DominionDesk — Early Access',
  description:
    'Apply for early access to DominionDesk — the property management platform built for South African landlords.',
};

export default function Page() {
  return <EarlyAccessPage />;
}
