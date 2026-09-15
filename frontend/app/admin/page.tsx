'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function AdminPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'properties' | 'clients'>('appointments');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([
      api.get('/appointments').then((res) => setAppointments(res.data)),
      api.get('/properties').then((res) => setProperties(res.data)),
      api.get('/clients').then((res) => setClients(res.data)),
    ]).finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600">Admin Panel</h1>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'appointments' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'properties' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Properties ({properties.length})
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'clients' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Clients ({clients.length})
          </button>
        </div>

        <div className="card">
          {activeTab === 'appointments' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Appointments</h2>
              {appointments.length === 0 ? (
                <p className="text-gray-500">No appointments found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appointments.map((apt) => (
                        <tr key={apt.id}>
                          <td className="px-6 py-4">{new Date(apt.dateSet).toLocaleDateString()}</td>
                          <td className="px-6 py-4">{new Date(apt.timeSet).toLocaleTimeString()}</td>
                          <td className="px-6 py-4">{apt.client?.name} {apt.client?.lastName1}</td>
                          <td className="px-6 py-4">{apt.property?.address}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                              apt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              apt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {apt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'properties' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Properties</h2>
              {properties.length === 0 ? (
                <p className="text-gray-500">No properties found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {properties.map((prop) => (
                        <tr key={prop.id}>
                          <td className="px-6 py-4">{prop.address}</td>
                          <td className="px-6 py-4">{prop.owner?.name} {prop.owner?.lastName1}</td>
                          <td className="px-6 py-4">{new Date(prop.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'clients' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Clients</h2>
              {clients.length === 0 ? (
                <p className="text-gray-500">No clients found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clients.map((client) => (
                        <tr key={client.id}>
                          <td className="px-6 py-4">{client.name} {client.lastName1}</td>
                          <td className="px-6 py-4">{client.email}</td>
                          <td className="px-6 py-4">{client.phone}</td>
                          <td className="px-6 py-4">{new Date(client.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
