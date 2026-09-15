'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useNotifications, NotificationBell } from '@/components/NotificationSystem';

export default function AdminPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'properties' | 'clients' | 'calendar'>('appointments');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CONFIRMED' | 'PENDING'>('ALL');
  const router = useRouter();
  const { notifications, unreadCount } = useNotifications();

  // Calendar state
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotsData, setSlotsData] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [blockingAll, setBlockingAll] = useState(false);

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

  const getFilteredAppointments = () => {
    if (filterStatus === 'ALL') return appointments;
    return appointments.filter((apt) => apt.status === filterStatus);
  };

  const filteredAppointments = getFilteredAppointments();
  const confirmedCount = appointments.filter((apt) => apt.status === 'CONFIRMED').length;
  const pendingCount = appointments.filter((apt) => apt.status === 'PENDING').length;

  const fetchSlots = async () => {
    if (!selectedProperty || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const response = await api.get(`/calendar/available/${selectedProperty}`, {
        params: { date: selectedDate },
      });
      setSlotsData(response.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const blockAllSlots = async (type: 'AVAILABLE' | 'RESERVED' | 'BLOCKED') => {
    if (!selectedProperty || !selectedDate) return;
    setBlockingAll(true);
    try {
      await api.post(`/calendar/block/${selectedProperty}`, null, {
        params: { date: selectedDate, type },
      });
      await fetchSlots();
    } catch (error) {
      console.error('Error blocking slots:', error);
      alert('Error updating slots');
    } finally {
      setBlockingAll(false);
    }
  };

  const cycleSlotType = async (slot: any) => {
    const types: ('AVAILABLE' | 'RESERVED' | 'BLOCKED')[] = ['AVAILABLE', 'RESERVED', 'BLOCKED'];
    const currentIndex = types.indexOf(slot.type);
    const nextType = types[(currentIndex + 1) % types.length];

    try {
      await api.put(`/calendar/slots/${slot.id}`, { type: nextType });
      await fetchSlots();
    } catch (error) {
      console.error('Error updating slot:', error);
      alert('Error updating slot');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600">Admin Panel</h1>
            <div className="flex items-center space-x-4">
              <Link href="/admin/docs" className="text-gray-600 hover:text-blue-600 flex items-center space-x-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm">Documentación</span>
              </Link>
              <NotificationBell />
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Citas</p>
                <p className="text-3xl font-bold text-gray-900">{appointments.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Confirmadas</p>
                <p className="text-3xl font-bold text-green-600">{confirmedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

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
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            🗓️ Calendar
          </button>
        </div>

        <div className="card">
          {activeTab === 'appointments' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Appointments</h2>
                <div className="flex space-x-2">
                  {(['ALL', 'CONFIRMED', 'PENDING'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        filterStatus === status
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'ALL' ? 'Todos' : status === 'CONFIRMED' ? '✓ Confirmadas' : '⏳ Pendientes'}
                    </button>
                  ))}
                </div>
              </div>
              {filteredAppointments.length === 0 ? (
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confirmation</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAppointments.map((apt) => (
                        <tr key={apt.id} className={apt.status === 'CONFIRMED' ? 'bg-green-50' : ''}>
                          <td className="px-6 py-4">{new Date(apt.dateSet).toLocaleDateString()}</td>
                          <td className="px-6 py-4">{new Date(apt.timeSet).toLocaleTimeString()}</td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{apt.client?.name} {apt.client?.lastName1}</div>
                              <div className="text-sm text-gray-500">{apt.client?.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">{apt.property?.address}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                              apt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              apt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {apt.status === 'CONFIRMED' ? '✓ ' : ''}{apt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {apt.status === 'CONFIRMED' ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Cliente confirmó
                              </span>
                            ) : apt.confirmationToken ? (
                              <span className="text-xs text-gray-400">Token generado</span>
                            ) : (
                              <span className="text-xs text-gray-400">Pendiente</span>
                            )}
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

          {activeTab === 'calendar' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">🗓️ Calendar - Manage Time Availability</h2>
              </div>

              {/* Property and Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Property</label>
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="input-field"
                  >
                    <option value="">-- Choose Property --</option>
                    {properties.map((prop) => (
                      <option key={prop.id} value={prop.id}>{prop.address}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={fetchSlots}
                    disabled={!selectedProperty || loadingSlots}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {loadingSlots ? 'Loading...' : '🔍 Load Slots'}
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              {selectedProperty && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-900 mb-2">Quick Actions for this Property</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => blockAllSlots('AVAILABLE')}
                      disabled={blockingAll}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                    >
                      ✅ Set All as Available
                    </button>
                    <button
                      onClick={() => blockAllSlots('RESERVED')}
                      disabled={blockingAll}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm disabled:opacity-50"
                    >
                      ⏰ Set All as Reserved (Personal Use)
                    </button>
                    <button
                      onClick={() => blockAllSlots('BLOCKED')}
                      disabled={blockingAll}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
                    >
                      🔒 Block All (Unavailable)
                    </button>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    💡 These actions will set the entire day for the selected property.
                  </p>
                </div>
              )}

              {/* Slots Display */}
              {slotsData && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Slots for {new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>

                  {/* Appointments Section */}
                  {slotsData.appointments && slotsData.appointments.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">📋 Existing Appointments</h4>
                      <div className="space-y-2">
                        {slotsData.appointments.map((apt: any) => (
                          <div key={apt.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(apt.timeSet).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                - {apt.client?.name} {apt.client?.lastName1}
                              </span>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                              apt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Slots Section */}
                  <h4 className="text-sm font-medium text-gray-700 mb-2">⏱️ Time Slots</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {slotsData.slots.map((slot: any) => (
                      <div
                        key={slot.id}
                        className={`p-4 rounded-lg border-2 ${
                          slot.type === 'AVAILABLE' ? 'bg-green-50 border-green-200' :
                          slot.type === 'RESERVED' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {' - '}
                              {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {slot.type === 'AVAILABLE' ? '✅ Available for booking' :
                               slot.type === 'RESERVED' ? '⏰ Reserved (personal use)' :
                               '🔒 Blocked (unavailable)'}
                            </div>
                          </div>
                          <button
                            onClick={() => cycleSlotType(slot)}
                            className="text-xs px-2 py-1 rounded bg-white border hover:bg-gray-50"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!slotsData && !loadingSlots && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-3">🗓️</div>
                  <p>Select a property and date, then click "Load Slots" to manage availability</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
