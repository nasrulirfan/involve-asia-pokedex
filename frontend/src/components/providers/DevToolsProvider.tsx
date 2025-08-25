'use client';

import dynamic from 'next/dynamic';

// Dynamic import for development tools
const PerformanceDashboard = dynamic(
  () => import('@/components/dev/PerformanceDashboard'),
  { 
    ssr: false,
    loading: () => null
  }
);

interface DevToolsProviderProps {
  children: React.ReactNode;
}

export default function DevToolsProvider({ children }: DevToolsProviderProps) {
  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceDashboard isVisible={true} />
      )}
    </>
  );
}