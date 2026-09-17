'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { appointmentsApi, clientsApi, propertiesApi } from '@/lib/types';

export default function BookingPage() {
  const params = useParams();
  const propertyId = params?.id as string;
  const [property, setProperty] = useState<any>(null);
  const [date, setDate] = useState('');
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

  useEffect(() => {
    if (propertyId) {
      propertiesApi.getById(propertyId).then((res) => setProperty(res.data));
    }
  }, [propertyId]);

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    setSelectedSlot('');
    if (e.target.value && propertyId) {
      setSlotsLoading(true);
      try {
        const response = await appointmentsApi.getAvailableSlots(propertyId, e.target.value);
        setAvailableSlots(response.data.slots || []);
      } catch {
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }
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
        dateSet: date,
        timeSet: selectedSlot,
        duration: 15,
        notes: formData.notes,
      };

      await appointmentsApi.create(appointmentData);
      setSuccess(true);
      setStep(4);
    } catch (error) {
      alert('Error al crear la cita. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

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
              <strong>Fecha:</strong> {date}
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
              <h2 className="text-xl font-semibold mb-4">Paso 1: Seleccione Fecha y Hora</h2>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha:</label>
              <input
                type="date"
                value={date}
                onChange={handleDateChange}
                min={new Date().toISOString().split('T')[0]}
                className="input-field mb-4"
                required
              />
              {slotsLoading ? (
                <div className="text-center py-8 text-gray-500">Cargando horarios disponibles...</div>
              ) : availableSlots.length > 0 ? (
                <div>
                  <h3 className="font-medium mb-2 text-gray-700">Horarios Disponibles</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot: any) => (
                      <button
                        key={slot.start}
                        onClick={() => setSelectedSlot(slot.start)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedSlot === slot.start
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {new Date(slot.start).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                </div>
              ) : date && (
                <div className="text-center py-8 text-gray-500">
                  No hay horarios disponibles para esta fecha
                </div>
              )}
              <button
                onClick={() => step < 2 && setStep(2)}
                disabled={!selectedSlot}
                className="btn-primary mt-6 w-full disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Paso 2: Sus Datos Personales</h2>
              <p className="text-gray-500 mb-4">
                Por favor complete sus datos para registrar su información como cliente.
              </p>
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
                <button onClick={() => setStep(1)} className="btn-secondary w-full">
                  Regresar
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.name || !formData.lastName1 || !formData.email || !formData.phone}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Paso 3: Confirmar Reserva</h2>
              <p className="text-gray-500 mb-4">
                Revise los datos de su cita antes de confirmar.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700"><strong>Propiedad:</strong> {property?.address}</p>
                <p className="text-gray-700"><strong>Fecha:</strong> {date}</p>
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
                <button onClick={() => setStep(2)} className="btn-secondary w-full">
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
