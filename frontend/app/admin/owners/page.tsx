'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { ownersApi, Owner } from '@/lib/types';

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [formData, setFormData] = useState<Partial<Owner>>({
    name: '',
    lastName1: '',
    lastName2: '',
    email: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchOwners();
  }, [router]);

  const fetchOwners = async () => {
    try {
      const res = await ownersApi.getAll();
      setOwners(res.data);
    } catch {
      setError('Error loading owners');
    } finally {
      setLoading(false);
    }
  };

  const openForm = (owner?: Owner) => {
    if (owner) {
      setEditingOwner(owner);
      setFormData({
        name: owner.name,
        lastName1: owner.lastName1,
        lastName2: owner.lastName2 || '',
        email: owner.email,
        phone: owner.phone,
      });
    } else {
      setEditingOwner(null);
      setFormData({ name: '', lastName1: '', lastName2: '', email: '', phone: '' });
    }
    setShowForm(true);
    setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingOwner(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      if (editingOwner) {
        await ownersApi.update(editingOwner.id, formData);
        setSuccessMsg('Owner updated successfully');
      } else {
        await ownersApi.create(formData);
        setSuccessMsg('Owner created successfully');
      }
      fetchOwners();
      closeForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving owner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this owner?')) return;
    try {
      await ownersApi.remove(id);
      setOwners(owners.filter((o) => o.id !== id));
      setSuccessMsg('Owner deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting owner');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600">Manage Owners</h1>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-blue-600 text-sm">
                Back to Admin
              </Link>
              <button onClick={() => router.push('/login')} className="btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMsg}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Owners ({owners.length})</h2>
          <button onClick={() => openForm()} className="btn-primary">
            + Add Owner
          </button>
        </div>

        {showForm && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingOwner ? 'Edit Owner' : 'New Owner'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name 1 *</label>
                  <input
                    type="text"
                    value={formData.lastName1 || ''}
                    onChange={(e) => setFormData({ ...formData, lastName1: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name 2</label>
                  <input
                    type="text"
                    value={formData.lastName2 || ''}
                    onChange={(e) => setFormData({ ...formData, lastName2: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="submit" className="btn-primary">
                  {editingOwner ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={closeForm} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {owners.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <p>No owners found. Click "Add Owner" to create one.</p>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Properties</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {owners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {owner.name} {owner.lastName1} {owner.lastName2 || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{owner.email}</td>
                    <td className="px-6 py-4 text-gray-600">{owner.phone}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/properties?ownerId=${owner.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View properties
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(owner.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button onClick={() => openForm(owner)} className="text-blue-600 hover:text-blue-800 text-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(owner.id)} className="text-red-600 hover:text-red-800 text-sm">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
