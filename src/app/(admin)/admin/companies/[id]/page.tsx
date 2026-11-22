'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CompanyView } from '@/components/admin/CompanyView';

function CompanyPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  return <CompanyView key={id} companyId={id} platform startInviting={params.get('invite') === '1'} />;
}

export default function Page() {
  return (
    <Suspense>
      <CompanyPage />
    </Suspense>
  );
}
