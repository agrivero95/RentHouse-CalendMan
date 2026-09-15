import api from './api';

export interface Owner {
  id: string;
  email: string;
  phone: string;
  name: string;
  lastName1: string;
  lastName2?: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  ownerId: string;
  owner: Owner;
  address: string;
  description?: string;
  pictures?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  lastName1: string;
  lastName2?: string;
  email: string;
  phone: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  createdAt: string;
  dateSet: string;
  timeSet: string;
  duration: number;
  clientId: string;
  propertyId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  client?: Client;
  property?: Property;
}

export interface TimeSlot {
  id: string;
  propertyId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'AVAILABLE' | 'RESERVED' | 'BLOCKED';
}

export interface TravelTime {
  id: string;
  propertyId1: string;
  propertyId2: string;
  duration: number;
}

export const propertiesApi = {
  getAll: () => api.get('/properties/public'),
  getById: (id: string) => api.get(`/properties/${id}`),
};

export const clientsApi = {
  findOrCreate: (data: Partial<Client>) => api.post('/clients/find-or-create', data),
  getAll: () => api.get('/clients'),
  getById: (id: string) => api.get(`/clients/${id}`),
};

export const appointmentsApi = {
  create: (data: Partial<Appointment>) => api.post('/appointments', data),
  getAll: () => api.get('/appointments'),
  getById: (id: string) => api.get(`/appointments/${id}`),
  getByProperty: (propertyId: string, startDate: string, endDate: string) =>
    api.get(`/appointments/property/${propertyId}`, { params: { startDate, endDate } }),
  getAvailableSlots: (propertyId: string, date: string) =>
    api.get(`/appointments/available-slots/${propertyId}`, { params: { date } }),
};

export const calendarApi = {
  getSlots: (propertyId: string, date: string) =>
    api.get(`/calendar/available/${propertyId}`, { params: { date } }),
  blockSlots: (propertyId: string, date: string, type: string) =>
    api.post(`/calendar/block/${propertyId}`, null, { params: { date, type } }),
};
