'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { appointmentsApi, clientsApi, propertiesApi, calendarApi } from '@/lib/types';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function BookingPage() {
  const params = useParams();
  const propertyId = params?.id as string;
  const [property, setProperty] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    lastName1: '',
    lastName2: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableDays, setAvailableDays] = useState<any[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);

  useEffect(() => {
    if (propertyId) {
      propertiesApi.getById(propertyId).then((res) => setProperty(res.data));
    }
  }, [propertyId]);

  useEffect(() => {
    loadAvailableDays();
  }, [currentMonth, currentYear, propertyId]);

  const loadAvailableDays = async () => {
    if (!propertyId) return;
    setMonthLoading(true);
    try {
      const firstDay = new Date(Date.UTC(currentYear, currentMonth, 1));
      const lastDay = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
      const response = await calendarApi.getAvailableDays(
        propertyId,
        firstDay.toISOString().split('T')[0],
        lastDay.toISOString().split('T')[0],
      );
      setAvailableDays(response.data || []);
    } catch {
      setAvailableDays([]);
    } finally {
      setMonthLoading(false);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const handleDateSelect = async (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setSelectedSlot('');
    setStep(2);

    setSlotsLoading(true);
    try {
      const response = await appointmentsApi.getAvailableSlots(propertyId, dateStr);
      setAvailableSlots(response.data.slots || []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const isDateInPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(currentYear, currentMonth, day);
    return date < today;
  };

  const isDateAvailable = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return availableDays.some(
      (d: any) => {
        const slotDate = new Date(Date.UTC(d.year, d.month, d.day));
        const slotDateStr = `${slotDate.getUTCFullYear()}-${String(slotDate.getUTCMonth() + 1).padStart(2, '0')}-${String(slotDate.getUTCDate()).padStart(2, '0')}`;
        return slotDateStr === dateStr && d.hasAvailableSlots;
      }
    );
  };

  const isSlotAvailable = (slotStart: string) => {
    if (!selectedDate) return false;
    const slotDate = (() => { const d = new Date(slotStart); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    const isTodayOrFuture = selected >= today;
    return isSlotAvailableInList(slotStart) && isTodayOrFuture;
  };

  const isSlotAvailableInList = (slotStart: string) => {
    const slot = availableSlots.find((s: any) => s.start === slotStart);
    return slot?.available !== false;
  };

  const handleBooking = async () => {
    setLoading(true);
    try {
      const clientData = {
        name: formData.name,
        lastName1: formData.lastName1,
        lastName2: formData.lastName2 || undefined,
        email: formData.email,
        phone: formData.phone,
      };

      const clientResponse = await clientsApi.findOrCreate(clientData);
      const client = clientResponse.data.client;

      const appointmentData = {
        clientId: client.id,
        propertyId,
        dateSet: selectedDate,
        timeSet: selectedSlot,
        duration: 15,
        notes: formData.notes,
      };

      await appointmentsApi.create(appointmentData);
      setSuccess(true);
      setStep(4);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al crear la cita. Por favor intente nuevamente.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const days: any[] = [];
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);

    for (let i = 0; i < firstDay; i++) {
      days.push({ type: 'empty', key: `empty-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isInPast = isDateInPast(day);
      const isAvailable = isDateAvailable(day);
      const isSelected = selectedDate === dateStr;
      const hasAvailableSlots = availableDays.some(
        (d: any) => d.day === day && d.month === currentMonth && d.year === currentYear && d.hasAvailableSlots
      );

      days.push({
        type: 'day',
        day,
        dateStr,
        isInPast,
        isAvailable: hasAvailableSlots,
        isSelected,
        key: `day-${day}`,
      });
    }

    return days;
  }, [currentYear, currentMonth, availableDays, selectedDate]);

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-600 mb-4">¡Cita Agendada!</h2>
          <p className="text-gray-600 mb-2">Su cita ha sido programada exitosamente.</p>
          <p className="text-gray-500 text-sm mb-6">
            Recibirá un recordatorio 30 minutos antes de la cita.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <p className="text-sm text-gray-600">
              <strong>Propiedad:</strong> {property?.address}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Fecha:</strong> {selectedDate}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Hora:</strong> {new Date(selectedSlot).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Link href="/" className="btn-primary inline-block">
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/properties" className="btn-secondary mb-6 inline-block">
          Volver a Propiedades
        </Link>

        {property && (
          <div className="card mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Agendar Cita</h1>
            <p className="text-gray-500">{property.address}</p>
          </div>
        )}

        <div className="card">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Paso 1: Seleccione una Fecha</h2>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => handleMonthChange('prev')}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  ←
                </button>
                <h3 className="text-lg font-semibold">
                  {MONTHS[currentMonth]} {currentYear}
                </h3>
                <button
                  onClick={() => handleMonthChange('next')}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  →
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {monthLoading ? (
                <div className="text-center py-8 text-gray-500">Cargando disponibilidad...</div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((item: any) => {
                    if (item.type === 'empty') {
                      return <div key={item.key} className="aspect-square" />;
                    }

                    const isSelectable = item.isAvailable && !item.isInPast;

                    return (
                      <button
                        key={item.key}
                        onClick={() => isSelectable && handleDateSelect(item.day)}
                        disabled={!isSelectable}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                          item.isSelected
                            ? 'bg-blue-600 text-white'
                            : item.isInPast
                            ? 'text-gray-300 cursor-not-allowed'
                            : isSelectable
                            ? 'bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 border-2 border-transparent cursor-pointer'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          item.isInPast
                            ? 'Fecha pasada'
                            : item.isAvailable
                            ? 'Fecha disponible'
                            : 'Sin slots disponibles'
                        }
                      >
                        {item.day}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-50" />
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-blue-600" />
                  <span>Seleccionado</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-gray-200" />
                  <span>No disponible</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Paso 2: Seleccione un Horario</h2>
              <p className="text-gray-600 mb-4">
                Fecha seleccionada: <strong>{selectedDate}</strong>
              </p>
              {slotsLoading ? (
                <div className="text-center py-8 text-gray-500">Cargando horarios disponibles...</div>
              ) : availableSlots.length > 0 ? (
                <div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot: any) => (
                      <button
                        key={slot.start}
                        onClick={() => {
                          if (isSlotAvailable(slot.start)) {
                            setSelectedSlot(slot.start);
                          } else {
                            alert('Este horario ya no está disponible');
                          }
                        }}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedSlot === slot.start
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                            : isSlotAvailable(slot.start)
                            ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                            : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!isSlotAvailable(slot.start)}
                      >
                        {new Date(slot.start).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedSlot}
                    className="btn-primary mt-6 w-full disabled:opacity-50"
                  >
                    Continuar
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay horarios disponibles para esta fecha
                </div>
              )}
              <button onClick={() => setStep(1)} className="btn-secondary mt-4 w-full">
                Regresar
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Paso 3: Sus Datos Personales</h2>
              <p className="text-gray-500 mb-4">
                Por favor complete sus datos para registrar su información como cliente.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Fecha:</strong> {selectedDate}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Hora:</strong> {new Date(selectedSlot).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} hrs
                </p>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre(s)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  placeholder="Primer Apellido"
                  value={formData.lastName1}
                  onChange={(e) => setFormData({ ...formData, lastName1: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  placeholder="Segundo Apellido (Opcional)"
                  value={formData.lastName2}
                  onChange={(e) => setFormData({ ...formData, lastName2: e.target.value })}
                  className="input-field"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={() => setStep(2)} className="btn-secondary w-full">
                  Regresar
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!formData.name || !formData.lastName1 || !formData.email || !formData.phone}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Paso 4: Confirmar Reserva</h2>
              <p className="text-gray-500 mb-4">
                Revise los datos de su cita antes de confirmar.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700"><strong>Propiedad:</strong> {property?.address}</p>
                <p className="text-gray-700"><strong>Fecha:</strong> {selectedDate}</p>
                <p className="text-gray-700"><strong>Hora:</strong> {new Date(selectedSlot).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} hrs</p>
                <p className="text-gray-700"><strong>Duración:</strong> 15 minutos</p>
                <hr className="my-3" />
                <p className="text-gray-700"><strong>Nombre:</strong> {formData.name} {formData.lastName1} {formData.lastName2 || ''}</p>
                <p className="text-gray-700"><strong>Correo:</strong> {formData.email}</p>
                <p className="text-gray-700"><strong>Teléfono:</strong> {formData.phone}</p>
                {formData.notes && <p className="text-gray-700 mt-2"><strong>Notas:</strong> {formData.notes}</p>}
              </div>
              <textarea
                placeholder="Notas adicionales (Opcional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field mb-4"
                rows={3}
              />
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-700">
                  ℹ️ Recibirá un recordatorio 30 minutos antes de su cita. Deberá confirmar su asistencia.
                </p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(3)} className="btn-secondary w-full">
                  Regresar
                </button>
                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading ? 'Agendando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
