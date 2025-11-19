"use client"
import dynamic from 'next/dynamic';

// Import the Home component with SSR disabled
const HomeClient = dynamic(
  () => import('./components/dashboard/dash'),
  { ssr: false }
);

export default function Page() {
  return <HomeClient />;
}