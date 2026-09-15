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
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'properties' | 'clients' | 'calendar' | 'owners'>('appointments');
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
      api.get('/owners').then((res) => setOwners(res.data)),
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

  const [showCustomSlots, setShowCustomSlots] = useState(false);
  const [customSlotsForm, setCustomSlotsForm] = useState({
    startTime: '09:00',
    endTime: '17:00',
    duration: 15,
    type: 'AVAILABLE' as 'AVAILABLE' | 'RESERVED' | 'BLOCKED',
  });
  const [creatingSlots, setCreatingSlots] = useState(false);

  const createCustomSlots = async () => {
    if (!selectedProperty || !selectedDate) return;
    setCreatingSlots(true);
    try {
      await api.post('/calendar/custom-slots', {
        propertyId: selectedProperty,
        date: selectedDate,
        ...customSlotsForm,
      });
      await fetchSlots();
      setShowCustomSlots(false);
    } catch (err: any) {
      console.error('Error creating slots:', err);
      alert(err.response?.data?.message || 'Error creating slots');
    } finally {
      setCreatingSlots(false);
    }
  };

  const deleteSlot = async (id: string) => {
    if (!confirm('Delete this time slot?')) return;
    try {
      await api.delete(`/calendar/slots/${id}`);
      await fetchSlots();
    } catch (err: any) {
      console.error('Error deleting slot:', err);
      alert(err.response?.data?.message || 'Error deleting slot');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const navItems = [
    { key: 'appointments' as const, label: 'Appointments', icon: '📅' },
    { key: 'owners' as const, label: 'Owners', icon: '👥' },
    { key: 'properties' as const, label: 'Properties', icon: '🏠' },
    { key: 'clients' as const, label: 'Clients', icon: '👤' },
    { key: 'calendar' as const, label: 'Calendar', icon: '🗓️' },
  ];

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

        <div className="flex flex-wrap space-x-2 mb-6">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                activeTab === item.key ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.key === 'appointments' && (
                <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === item.key ? 'bg-blue-500 text-white' : 'bg-gray-300'
                }`}>
                  {appointments.length}
                </span>
              )}
            </button>
          ))}
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

          {activeTab === 'owners' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Owners</h2>
                <Link href="/admin/owners" className="btn-primary text-sm">
                  Manage Owners
                </Link>
              </div>
              {owners.length === 0 ? (
                <p className="text-gray-500">No owners found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Properties</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {owners.map((owner) => {
                        const ownerProps = properties.filter((p) => p.ownerId === owner.id);
                        return (
                          <tr key={owner.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {owner.name} {owner.lastName1} {owner.lastName2 || ''}
                            </td>
                            <td className="px-6 py-4 text-gray-600">{owner.email}</td>
                            <td className="px-6 py-4 text-gray-600">{owner.phone}</td>
                            <td className="px-6 py-4">
                              <Link
                                href={`/admin/properties?ownerId=${owner.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                {ownerProps.length} property/ies
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(owner.createdAt).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'properties' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Properties</h2>
                <Link href="/admin/properties" className="btn-primary text-sm">
                  Manage Properties
                </Link>
              </div>
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
                        <tr key={prop.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{prop.address}</td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/admin/owners`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              {prop.owner?.name} {prop.owner?.lastName1}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(prop.createdAt).toLocaleDateString()}</td>
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
            <CalendarTab
              properties={properties}
              selectedProperty={selectedProperty}
              setSelectedProperty={setSelectedProperty}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              slotsData={slotsData}
              setSlotsData={setSlotsData}
              loadingSlots={loadingSlots}
              fetchSlots={fetchSlots}
              blockAllSlots={blockAllSlots}
              blockingAll={blockingAll}
              cycleSlotType={cycleSlotType}
              deleteSlot={deleteSlot}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CalendarTab({
  properties,
  selectedProperty,
  setSelectedProperty,
  selectedDate,
  setSelectedDate,
  slotsData,
  setSlotsData,
  loadingSlots,
  fetchSlots,
  blockAllSlots,
  blockingAll,
  cycleSlotType,
  deleteSlot,
}: {
  properties: any[];
  selectedProperty: string;
  setSelectedProperty: (v: string) => void;
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  slotsData: any;
  setSlotsData: (v: any) => void;
  loadingSlots: boolean;
  fetchSlots: () => Promise<void>;
  blockAllSlots: (type: 'AVAILABLE' | 'RESERVED' | 'BLOCKED') => Promise<void>;
  blockingAll: boolean;
  cycleSlotType: (slot: any) => Promise<void>;
  deleteSlot: (id: string) => Promise<void>;
}) {
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthData, setMonthData] = useState<any>(null);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [showCustomSlots, setShowCustomSlots] = useState(false);
  const [customSlotsForm, setCustomSlotsForm] = useState({
    startTime: '09:00',
    endTime: '17:00',
    duration: 15,
    type: 'AVAILABLE' as 'AVAILABLE' | 'RESERVED' | 'BLOCKED',
  });
  const [creatingSlots, setCreatingSlots] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const loadMonthData = async (month: number, year: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    setLoadingMonth(true);
    try {
      const res = await api.get('/calendar/month', {
        params: { startDate: firstDay.toISOString(), endDate: lastDay.toISOString() },
      });
      setMonthData(res.data);
    } catch (err) {
      console.error('Error loading month data:', err);
      setMonthData(null);
    } finally {
      setLoadingMonth(false);
    }
  };

  useEffect(() => {
    loadMonthData(currentMonth, currentYear);
  }, [currentMonth, currentYear]);

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setViewMode('day');
  };

  const getDayStatus = (day: number) => {
    if (!selectedProperty || !monthData) return null;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daySlots = monthData.slots?.filter((s: any) => {
      const slotDate = s.date.startsWith('20') ? s.date.split('T')[0] : s.date;
      return slotDate === dateStr && s.propertyId === selectedProperty;
    });
    if (!daySlots || daySlots.length === 0) return null;

    const types = daySlots.map((s: any) => s.type);
    if (types.every((t: string) => t === 'AVAILABLE')) return 'available';
    if (types.every((t: string) => t === 'BLOCKED')) return 'blocked';
    if (types.every((t: string) => t === 'RESERVED')) return 'reserved';
    return 'mixed';
  };

  const getDayAppointments = (day: number) => {
    if (!monthData) return [];
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthData.appointments?.filter((apt: any) => {
      return apt.dateSet.split('T')[0] === dateStr;
    }) || [];
  };

  const dayStatusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    mixed: 'bg-gray-100 text-gray-800',
  };

  const dayBorders: Record<string, string> = {
    available: 'border-green-400',
    blocked: 'border-red-400',
    reserved: 'border-yellow-400',
    mixed: 'border-gray-400',
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getSlotCount = () => {
    if (!customSlotsForm.startTime || !customSlotsForm.endTime) return 0;
    const [startH, startM] = customSlotsForm.startTime.split(':').map(Number);
    const [endH, endM] = customSlotsForm.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const totalMinutes = endMinutes - startMinutes;
    if (totalMinutes <= 0) return 0;
    return Math.floor(totalMinutes / customSlotsForm.duration);
  };

  const createCustomSlots = async () => {
    if (!selectedProperty || !selectedDate) return;
    setCreatingSlots(true);
    try {
      await api.post('/calendar/custom-slots', {
        propertyId: selectedProperty,
        date: selectedDate,
        ...customSlotsForm,
      });
      await fetchSlots();
      setShowCustomSlots(false);
    } catch (err: any) {
      console.error('Error creating slots:', err);
      alert(err.response?.data?.message || 'Error creating slots');
    } finally {
      setCreatingSlots(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">🗓️ Calendar - Manage Time Availability</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-sm rounded-lg ${
              viewMode === 'month' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Month View
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1 text-sm rounded-lg ${
              viewMode === 'day' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Day View
          </button>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="btn-secondary">← Prev</button>
            <h3 className="text-lg font-semibold">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <button onClick={nextMonth} className="btn-secondary">Next →</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();

              const daySlots = monthData?.slots?.filter((s: any) => {
                const slotDate = s.date.startsWith('20') ? s.date.split('T')[0] : s.date;
                return slotDate === dateStr;
              }) || [];

              const dayAppointments = monthData?.appointments?.filter((apt: any) => {
                return apt.dateSet.split('T')[0] === dateStr;
              }) || [];

              const propertyBreakdown: Record<string, Record<string, number>> = {};
              let hasPersonalTime = false;
              let personalMinutes = 0;

              daySlots.forEach((slot: any) => {
                if (!propertyBreakdown[slot.propertyId]) {
                  propertyBreakdown[slot.propertyId] = { AVAILABLE: 0, RESERVED: 0, BLOCKED: 0 };
                }
                propertyBreakdown[slot.propertyId][slot.type] = (propertyBreakdown[slot.propertyId][slot.type] || 0) + 1;
                if (slot.type === 'RESERVED') {
                  hasPersonalTime = true;
                  const start = new Date(slot.startTime);
                  const end = new Date(slot.endTime);
                  personalMinutes += (end.getTime() - start.getTime()) / 60000;
                }
              });

              const dominantType = daySlots.length > 0
                ? daySlots.reduce((acc: any, slot: any) => {
                    acc[slot.type] = (acc[slot.type] || 0) + 1;
                    return acc;
                  }, {})
                : {};
              const dominantSlotType = Object.keys(dominantType).length > 0
                ? Object.keys(dominantType).reduce((a: string, b: string) => dominantType[a] > dominantType[b] ? a : b)
                : null;

              const dayColors: Record<string, string> = {
                AVAILABLE: 'bg-green-50 border-green-300',
                RESERVED: 'bg-yellow-50 border-yellow-300',
                BLOCKED: 'bg-red-50 border-red-300',
              };
              const dayTextColors: Record<string, string> = {
                AVAILABLE: 'text-green-700',
                RESERVED: 'text-yellow-700',
                BLOCKED: 'text-red-700',
              };
              const dayDotColors: Record<string, string> = {
                AVAILABLE: 'bg-green-500',
                RESERVED: 'bg-yellow-500',
                BLOCKED: 'bg-red-500',
              };

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square p-1 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : isToday
                      ? 'border-blue-300 bg-blue-50'
                      : daySlots.length > 0
                      ? dayColors[dominantSlotType!] || 'border-gray-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col h-full">
                    <span className={`text-sm font-medium ${
                      isToday ? 'text-blue-700' :
                      daySlots.length > 0 ? dayTextColors[dominantSlotType!] || 'text-gray-700' : 'text-gray-700'
                    }`}>
                      {day}
                    </span>
                    {daySlots.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {Object.entries(propertyBreakdown).slice(0, 3).map(([propId, counts]) => {
                          const prop = properties.find((p: any) => p.id === propId);
                          const hasAvailable = (counts.AVAILABLE || 0) > 0;
                          const hasReserved = (counts.RESERVED || 0) > 0;
                          const hasBlocked = (counts.BLOCKED || 0) > 0;
                          return (
                            <div key={propId} className="flex flex-col items-center" title={prop?.address || propId}>
                              <span className="text-[8px] truncate w-full text-center text-gray-400 leading-none" style={{ fontSize: '7px' }}>
                                {prop?.address?.split(' ').pop() || '?'}
                              </span>
                              <div className="flex gap-0.5">
                                {hasAvailable && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                                {hasReserved && <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />}
                                {hasBlocked && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {hasPersonalTime && (
                      <span className="text-[8px] text-purple-600 mt-auto" title={`${Math.round(personalMinutes)} min personal time`}>
                        ⏰{Math.round(personalMinutes / 60)}h
                      </span>
                    )}
                    {dayAppointments.length > 0 && (
                      <span className="text-[8px] text-blue-600 mt-auto" title={`${dayAppointments.length} appointment(s)`}>
                        📋{dayAppointments.length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span> Available</span>
              <span className="flex items-center"><span className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></span> Reserved (Personal)</span>
              <span className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span> Blocked</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <span className="flex items-center"><span className="text-purple-600 mr-1">⏰</span> Personal time shown</span>
              <span className="flex items-center"><span className="text-blue-600 mr-1">📋</span> Appointments count</span>
              <span className="flex items-center"><span className="text-blue-500 mr-1">●</span> Today</span>
              <span className="flex items-center"><span className="border border-blue-500 rounded mr-1 px-0.5 text-blue-500">●</span> Selected day</span>
            </div>
          </div>

          {monthData && monthData.slots && monthData.slots.length > 0 && (
            <div className="mt-6">
              <h4 className="text-base font-semibold text-gray-900 mb-3">
                Slots by Property - {monthNames[currentMonth]} {currentYear}
              </h4>
              <div className="space-y-4">
                {properties.map((prop: any) => {
                  const propSlots = monthData.slots.filter((s: any) => s.propertyId === prop.id);
                  if (propSlots.length === 0) return null;

                  const monthSlotsByDate: Record<string, any[]> = {};
                  propSlots.forEach((slot: any) => {
                    const slotDate = slot.date.startsWith('20') ? slot.date.split('T')[0] : slot.date;
                    if (!monthSlotsByDate[slotDate]) monthSlotsByDate[slotDate] = [];
                    monthSlotsByDate[slotDate].push(slot);
                  });

                  return (
                    <div key={prop.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-semibold text-gray-900">
                          🏠 {prop.address}
                        </h5>
                        <div className="flex items-center gap-3 text-xs">
                          {(() => {
                            const counts = propSlots.reduce((acc: any, slot: any) => {
                              acc[slot.type] = (acc[slot.type] || 0) + 1;
                              return acc;
                            }, {});
                            return (
                              <>
                                {counts.AVAILABLE > 0 && (
                                  <span className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>{counts.AVAILABLE}</span>
                                )}
                                {counts.RESERVED > 0 && (
                                  <span className="flex items-center"><span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>{counts.RESERVED}</span>
                                )}
                                {counts.BLOCKED > 0 && (
                                  <span className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>{counts.BLOCKED}</span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {weekDays.map((day) => (
                          <div key={day} className="text-center text-[10px] font-medium text-gray-400 py-1">
                            {day}
                          </div>
                        ))}
                        {Array.from({ length: firstDay }).map((_, i) => (
                          <div key={`empty-${i}`} className="h-8" />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const daySlots = monthSlotsByDate[dateStr] || [];
                          const hasAvailable = daySlots.some((s: any) => s.type === 'AVAILABLE');
                          const hasReserved = daySlots.some((s: any) => s.type === 'RESERVED');
                          const hasBlocked = daySlots.some((s: any) => s.type === 'BLOCKED');
                          const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();

                          return (
                            <div
                              key={day}
                              className={`h-8 rounded flex items-center justify-center text-[9px] ${
                                daySlots.length === 0
                                  ? 'bg-gray-50'
                                  : hasAvailable && !hasReserved && !hasBlocked
                                  ? 'bg-green-100 text-green-700'
                                  : hasReserved && hasBlocked
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : hasReserved
                                  ? 'bg-yellow-50 text-yellow-600'
                                  : hasBlocked
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-50 text-green-600'
                              } ${isToday ? 'ring-1 ring-blue-400' : ''}`}
                            >
                              {daySlots.length > 0 ? (
                                <div className="flex flex-col items-center leading-none">
                                  <span className="font-medium">{daySlots.length}</span>
                                  <div className="flex gap-0.5 mt-0.5">
                                    {hasAvailable && <span className="w-1 h-1 bg-green-500 rounded-full" />}
                                    {hasReserved && <span className="w-1 h-1 bg-yellow-500 rounded-full" />}
                                    {hasBlocked && <span className="w-1 h-1 bg-red-500 rounded-full" />}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-300">{day}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'day' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Property</label>
              <select
                value={selectedProperty}
                onChange={(e) => {
                  setSelectedProperty(e.target.value);
                  setSlotsData(null);
                }}
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
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSlotsData(null);
                }}
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
                <button
                  onClick={() => setShowCustomSlots(!showCustomSlots)}
                  disabled={blockingAll}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50"
                >
                  ➕ Create Custom Time Slots
                </button>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                💡 These actions will set the entire day for the selected property.
              </p>

              {showCustomSlots && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-3">Create Custom Time Slots</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={customSlotsForm.startTime}
                        onChange={(e) => setCustomSlotsForm({ ...customSlotsForm, startTime: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={customSlotsForm.endTime}
                        onChange={(e) => setCustomSlotsForm({ ...customSlotsForm, endTime: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={customSlotsForm.duration}
                        onChange={(e) => setCustomSlotsForm({ ...customSlotsForm, duration: parseInt(e.target.value) || 15 })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Slot Type</label>
                      <select
                        value={customSlotsForm.type}
                        onChange={(e) => setCustomSlotsForm({ ...customSlotsForm, type: e.target.value as 'AVAILABLE' | 'RESERVED' | 'BLOCKED' })}
                        className="input-field"
                      >
                        <option value="AVAILABLE">✅ Available</option>
                        <option value="RESERVED">⏰ Reserved</option>
                        <option value="BLOCKED">🔒 Blocked</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={createCustomSlots}
                      disabled={creatingSlots || customSlotsForm.startTime >= customSlotsForm.endTime}
                      className="btn-primary disabled:opacity-50"
                    >
                      {creatingSlots ? 'Creating...' : `Create ${getSlotCount()} slots`}
                    </button>
                    <button
                      onClick={() => setShowCustomSlots(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    {customSlotsForm.startTime < customSlotsForm.endTime && (
                      <span className="text-sm text-gray-600">
                        Will create <strong>{getSlotCount()}</strong> slot{getSlotCount() !== 1 ? 's' : ''} of {customSlotsForm.duration} min each
                      </span>
                    )}
                  </div>
                  {customSlotsForm.startTime >= customSlotsForm.endTime && (
                    <p className="text-sm text-red-600 mt-2">End time must be after start time</p>
                  )}
                </div>
              )}
            </div>
          )}

          {slotsData && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                Slots for {new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>

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

              <h4 className="text-sm font-medium text-gray-700 mb-2">⏱️ Time Slots by Property</h4>
              
              {properties.map((prop: any) => {
                const propSlots = slotsData.slots.filter((s: any) => s.propertyId === prop.id);
                if (propSlots.length === 0) return null;
                
                return (
                  <div key={prop.id} className="mb-6">
                    <h5 className="text-base font-semibold text-gray-800 mb-2">
                      🏠 {prop.address}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {propSlots.map((slot: any) => (
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
                             <div className="flex space-x-1">
                               <button
                                 onClick={() => cycleSlotType(slot)}
                                 className="text-xs px-2 py-1 rounded bg-white border hover:bg-gray-50"
                               >
                                 Change
                               </button>
                               <button
                                 onClick={() => deleteSlot(slot.id)}
                                 className="text-xs px-2 py-1 rounded bg-white border border-red-300 text-red-600 hover:bg-red-50"
                               >
                                 Delete
                               </button>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!slotsData && !loadingSlots && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🗓️</div>
              <p>Select a property and date, then click "Load Slots" to manage availability</p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'month' && selectedProperty && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Click on any day to switch to day view and manage slots for that property. Use the property dropdown to switch properties.
          </p>
        </div>
      )}

      {viewMode === 'month' && !selectedProperty && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Please select a property first to see the calendar status and manage availability.
          </p>
        </div>
      )}
    </div>
  );
}
