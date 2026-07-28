import { Suspense } from 'react';
import { SecureAuthPage } from '@/components/auth/secure-auth-page';

export default function AuthRoute() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] animate-pulse bg-muted/20" />}>
      <SecureAuthPage />
    </Suspense>
  );
}
