'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { propertiesApi } from '@/lib/types';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertiesApi.getAll().then((res) => {
      setProperties(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Propiedades</h1>
          <Link href="/" className="btn-secondary">
            Volver al Inicio
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No se encontraron propiedades</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link key={property.id} href={`/properties/${property.id}`} className="card hover:shadow-lg transition-shadow flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900">{property.address}</h3>
                <p className="text-gray-500 mt-2">{property.description || 'Sin descripción'}</p>
                <div className="mt-4 text-sm text-blue-600">
                  Propietario: {property.owner?.name} {property.owner?.lastName1}
                </div>
                <div className="mt-auto pt-4">
                  <Link href={`/booking/${property.id}`} className="btn-primary w-full text-center block">
                    Agendar Cita
                  </Link>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
