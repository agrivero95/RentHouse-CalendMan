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

  useEffect(() => {
    if (propertyId) {
      propertiesApi.getById(propertyId).then((res) => setProperty(res.data));
    }
  }, [propertyId]);

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    if (e.target.value && propertyId) {
      const response = await appointmentsApi.getAvailableSlots(propertyId, e.target.value);
      setAvailableSlots(response.data.slots || []);
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
      alert('Error creating appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-6">Your appointment has been scheduled successfully.</p>
          <Link href="/" className="btn-primary inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/properties" className="btn-secondary mb-6 inline-block">
          Back to Properties
        </Link>

        {property && (
          <div className="card mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
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
              <h2 className="text-xl font-semibold mb-4">Select Date</h2>
              <input
                type="date"
                value={date}
                onChange={handleDateChange}
                min={new Date().toISOString().split('T')[0]}
                className="input-field mb-4"
                required
              />
              {availableSlots.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Available Time Slots</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot: any) => (
                      <button
                        key={slot.start}
                        onClick={() => setSelectedSlot(slot.start)}
                        className={`p-2 rounded-lg border ${
                          selectedSlot === slot.start
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => step < 2 && setStep(2)}
                disabled={!selectedSlot}
                className="btn-primary mt-6 w-full disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Information</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name 1"
                  value={formData.lastName1}
                  onChange={(e) => setFormData({ ...formData, lastName1: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name 2 (Optional)"
                  value={formData.lastName2}
                  onChange={(e) => setFormData({ ...formData, lastName2: e.target.value })}
                  className="input-field"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary w-full">
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="btn-primary w-full"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Confirm Booking</h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Date:</strong> {date}</p>
                <p><strong>Time:</strong> {new Date(selectedSlot).toLocaleTimeString()}</p>
                <p><strong>Duration:</strong> 15 minutes</p>
                <p><strong>Property:</strong> {property?.address}</p>
                <p><strong>Name:</strong> {formData.name} {formData.lastName1} {formData.lastName2}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Phone:</strong> {formData.phone}</p>
                {formData.notes && <p><strong>Notes:</strong> {formData.notes}</p>}
              </div>
              <textarea
                placeholder="Notes (Optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field mb-4"
                rows={3}
              />
              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="btn-secondary w-full">
                  Back
                </button>
                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
