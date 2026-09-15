'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { propertiesApi } from '@/lib/types';

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params?.id as string;
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propertyId) {
      propertiesApi.getById(propertyId).then((res) => {
        setProperty(res.data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [propertyId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!property) return <div className="min-h-screen flex items-center justify-center">Property not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/properties" className="btn-secondary mb-6 inline-block">
          Back to Properties
        </Link>

        <div className="card">
          <h1 className="text-3xl font-bold text-gray-900">{property.address}</h1>
          <p className="text-gray-500 mt-4">{property.description || 'No description available'}</p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Owner</h3>
              <p className="mt-1">{property.owner?.name} {property.owner?.lastName1}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1">{property.owner?.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="mt-1">{property.owner?.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
