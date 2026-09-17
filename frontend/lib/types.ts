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
  notifications?: Notification[];
  confirmationTokens?: ConfirmationToken[];
}

export interface Notification {
  id: string;
  appointmentId: string;
  recipientId: string;
  recipientType: string;
  type: string;
  title: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'READ';
  data?: any;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  appointment?: Appointment;
}

export interface ConfirmationToken {
  id: string;
  appointmentId: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
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
  getAllAdmin: () => api.get('/properties'),
  getById: (id: string) => api.get(`/properties/${id}`),
  create: (data: Partial<Property>) => api.post('/properties', data),
  update: (id: string, data: Partial<Property>) => api.put(`/properties/${id}`, data),
  remove: (id: string) => api.delete(`/properties/${id}`),
  getByOwner: (ownerId: string) => api.get(`/properties/owner/${ownerId}`),
};

export const ownersApi = {
  getAll: () => api.get('/owners'),
  getById: (id: string) => api.get(`/owners/${id}`),
  create: (data: Partial<Owner>) => api.post('/owners', data),
  update: (id: string, data: Partial<Owner>) => api.put(`/owners/${id}`, data),
  remove: (id: string) => api.delete(`/owners/${id}`),
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
  confirmByToken: (token: string) => api.post(`/appointments/confirm/${token}`),
};

export const calendarApi = {
  getSlots: (propertyId: string, date: string) =>
    api.get(`/calendar/available/${propertyId}`, { params: { date } }),
  blockSlots: (propertyId: string, date: string, type: string) =>
    api.post(`/calendar/block/${propertyId}`, null, { params: { date, type } }),
  getMonthSlots: (startDate: string, endDate: string) =>
    api.get('/calendar/month', { params: { startDate, endDate } }),
  getAvailableDays: (propertyId: string, startDate: string, endDate: string) =>
    api.get(`/calendar/available-days/${propertyId}`, { params: { startDate, endDate } }),
};

export const notificationsApi = {
  getUnread: (recipientId: string, recipientType: string) =>
    api.get(`/notifications/unread/${recipientId}/${recipientType}`),
  getAll: (recipientId: string, recipientType: string) =>
    api.get(`/notifications/all/${recipientId}/${recipientType}`),
  markAsRead: (id: string) => api.put(`/notifications/read/${id}`),
  getAdmin: () => api.get('/notifications/admin'),
  getAppointment: (appointmentId: string) =>
    api.get(`/notifications/appointment/${appointmentId}`),
  getPendingConfirmation: () => api.get('/notifications/pending-confirmation'),
  sendReminder: (appointmentId: string) =>
    api.post(`/notifications/send-reminder/${appointmentId}`),
};
