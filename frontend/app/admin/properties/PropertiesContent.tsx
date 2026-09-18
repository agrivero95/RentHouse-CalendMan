'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { propertiesApi, ownersApi, Property, Owner } from '@/lib/types';

export default function PropertiesContent() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<Partial<Property>>({
    address: '',
    description: '',
    ownerId: '',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const ownerId = searchParams.get('ownerId');
    if (ownerId) {
      setFilterOwner(ownerId);
    }
    fetchData();
  }, [router, searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propsRes, ownersRes] = await Promise.all([
        propertiesApi.getAllAdmin(),
        ownersApi.getAll(),
      ]);
      setProperties(propsRes.data);
      setOwners(ownersRes.data);
    } catch {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const openForm = (property?: Property) => {
    if (property) {
      setEditingProperty(property);
      setFormData({
        address: property.address,
        description: property.description || '',
        ownerId: property.ownerId,
      });
    } else {
      setEditingProperty(null);
      setFormData({ address: '', description: '', ownerId: filterOwner || '' });
    }
    setShowForm(true);
    setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProperty(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.ownerId) {
      setError('Owner is required');
      return;
    }

    try {
      if (editingProperty) {
        await propertiesApi.update(editingProperty.id, formData);
        setSuccessMsg('Property updated successfully');
      } else {
        await propertiesApi.create(formData);
        setSuccessMsg('Property created successfully');
      }
      fetchData();
      closeForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving property');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      await propertiesApi.remove(id);
      setProperties(properties.filter((p) => p.id !== id));
      setSuccessMsg('Property deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting property');
    }
  };

  const filteredProperties = filterOwner
    ? properties.filter((p) => p.ownerId === filterOwner)
    : properties;

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600">Manage Properties</h1>
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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Properties ({filteredProperties.length})
            </h2>
            {filterOwner && (
              <button
                onClick={() => setFilterOwner('')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear filter
              </button>
            )}
          </div>
          <button onClick={() => openForm()} className="btn-primary">
            + Add Property
          </button>
        </div>

        {!filterOwner && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Owner</label>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="">All Owners</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} {owner.lastName1}
                </option>
              ))}
            </select>
          </div>
        )}

        {showForm && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingProperty ? 'Edit Property' : 'New Property'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
                  <select
                    value={formData.ownerId || ''}
                    onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Owner</option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name} {owner.lastName1} ({owner.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="submit" className="btn-primary">
                  {editingProperty ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={closeForm} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {filteredProperties.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <p>No properties found.</p>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProperties.map((prop) => (
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
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {prop.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(prop.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button onClick={() => openForm(prop)} className="text-blue-600 hover:text-blue-800 text-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(prop.id)} className="text-red-600 hover:text-red-800 text-sm">
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
