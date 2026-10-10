import { AuthProvider } from '@/contexts/AuthContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import Layout from '@/components/Layout';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <Suspense fallback={<div className="min-h-screen bg-gray-100 p-6">Chargement...</div>}>
          <Layout>
            {children}
          </Layout>
        </Suspense>
      </RealtimeProvider>
    </AuthProvider>
  );
}
