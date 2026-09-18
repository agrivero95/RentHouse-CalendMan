import { Suspense } from 'react';
import ConfirmContent from './ConfirmContent';

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <div className="mx-auto w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Procesando...</h2>
          <p className="text-gray-500">Cargando confirmación...</p>
        </div>
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
