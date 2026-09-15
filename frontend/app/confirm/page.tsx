'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { appointmentsApi } from '@/lib/types';

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || searchParams.get('id') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    if (token) {
      appointmentsApi.confirmByToken(token)
        .then((res) => {
          setStatus('success');
          setMessage(res.data.message);
          setAppointment(res.data.appointment);
        })
        .catch((err) => {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Token inválido o expirado');
        });
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="card max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Procesando...</h2>
            <p className="text-gray-500">Confirmando su cita, por favor espere.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">¡Cita Confirmada!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            {appointment && (
              <div className="bg-gray-50 p-4 rounded-lg text-left mb-6">
                <p className="text-sm text-gray-500">Detalles de la cita:</p>
                <p className="mt-2"><strong>Fecha:</strong> {new Date(appointment.dateSet).toLocaleDateString('es-ES')}</p>
                <p><strong>Hora:</strong> {new Date(appointment.timeSet).toLocaleTimeString('es-ES')}</p>
                <p><strong>Dirección:</strong> {appointment.property?.address}</p>
              </div>
            )}

            <Link href="/" className="btn-primary inline-block">
              Volver al Inicio
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link href="/" className="btn-primary inline-block">
              Volver al Inicio
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
