import { Suspense } from 'react';
import PropertiesContent from './PropertiesContent';

export default function AdminPropertiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PropertiesContent />
    </Suspense>
  );
}
