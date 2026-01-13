'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import Toast from '@/components/Toast';
import { IAdmin } from '@/models/Admin';

export default function AdminListPage() {
  const [admins, setAdmins] = useState<IAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      // Get current user email from session
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      if (session?.user?.email) {
        setCurrentUserEmail(session.user.email.toLowerCase().trim());
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admins');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load admins');
      }

      setAdmins(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (email: string, role: 'admin' | 'superadmin') => {
    try {
      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create admin');
      }

      setToast({
        type: 'success',
        message: 'Admin created successfully!',
      });
      setShowCreateForm(false);
      fetchAdmins();
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create admin',
      });
      throw error;
    }
  };

  const handleUpdate = async (id: string, role: 'admin' | 'superadmin') => {
    try {
      const response = await fetch(`/api/admins/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update admin');
      }

      setToast({
        type: 'success',
        message: 'Admin role updated successfully!',
      });
      setEditingId(null);
      fetchAdmins();
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update admin',
      });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admins/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete admin');
      }

      setToast({
        type: 'success',
        message: 'Admin deleted successfully!',
      });
      setDeleteConfirmId(null);
      fetchAdmins();
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete admin',
      });
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading admins..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to Load Admins"
        message={error}
        onRetry={fetchAdmins}
      />
    );
  }

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}

      <div>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin List Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage admin accounts and roles. Total: {admins.length} admin{admins.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            + Add Admin
          </button>
        </div>

        {/* Create Admin Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Admin</h2>
            <AdminForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {/* Admins List */}
        {admins.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">No admins found. Add your first admin to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.map((admin) => (
                    <AdminRow
                      key={admin._id?.toString()}
                      admin={admin}
                      isEditing={editingId === admin._id?.toString()}
                      isDeleting={deleteConfirmId === admin._id?.toString()}
                      isCurrentUser={currentUserEmail === admin.email.toLowerCase()}
                      onEdit={() => setEditingId(admin._id?.toString() || null)}
                      onCancel={() => {
                        setEditingId(null);
                        setDeleteConfirmId(null);
                      }}
                      onSave={handleUpdate}
                      onDelete={() => setDeleteConfirmId(admin._id?.toString() || null)}
                      onConfirmDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

interface AdminRowProps {
  admin: IAdmin;
  isEditing: boolean;
  isDeleting: boolean;
  isCurrentUser: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (id: string, role: 'admin' | 'superadmin') => Promise<void>;
  onDelete: () => void;
  onConfirmDelete: (id: string) => Promise<void>;
}

function AdminRow({
  admin,
  isEditing,
  isDeleting,
  isCurrentUser,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onConfirmDelete,
}: AdminRowProps) {
  const [role, setRole] = useState<'admin' | 'superadmin'>(admin.role);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setRole(admin.role);
    }
  }, [isEditing, admin]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(admin._id?.toString() || '', role);
    } finally {
      setSaving(false);
    }
  };

  if (isDeleting) {
    return (
      <tr>
        <td colSpan={4} className="px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 mb-3">
              Are you sure you want to delete admin &quot;{admin.email}&quot;? This action cannot be undone.
            </p>
            {isCurrentUser && (
              <p className="text-sm text-red-600 mb-3 font-medium">
                ⚠️ Warning: You cannot delete your own account.
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => onConfirmDelete(admin._id?.toString() || '')}
                disabled={isCurrentUser}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Confirm Delete
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  if (isEditing) {
    return (
      <tr>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {admin.email}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'superadmin')}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          >
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(admin.createdAt).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex justify-end gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {admin.email}
        {isCurrentUser && (
          <span className="ml-2 text-xs text-indigo-600 font-medium">(You)</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            admin.role === 'superadmin'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {admin.role === 'superadmin' ? 'Superadmin' : 'Admin'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(admin.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end gap-3">
          <button
            onClick={onEdit}
            className="text-indigo-600 hover:text-indigo-900"
          >
            Edit Role
          </button>
          <button
            onClick={onDelete}
            disabled={isCurrentUser}
            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isCurrentUser ? 'Cannot delete your own account' : 'Delete admin'}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

interface AdminFormProps {
  onSubmit: (email: string, role: 'admin' | 'superadmin') => Promise<void>;
  onCancel: () => void;
}

function AdminForm({ onSubmit, onCancel }: AdminFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'superadmin'>('admin');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const validateEmail = (email: string): boolean => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: { email?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(email.trim(), role);
      setEmail('');
      setRole('admin');
    } catch (error) {
      // Error handling is done in parent component via toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
            errors.email ? 'border-red-300' : ''
          }`}
          placeholder="admin@example.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        <p className="mt-1 text-xs text-gray-500">
          The admin must sign in with this Google account email.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'superadmin')}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Superadmins can manage other admins and have full access.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Creating...' : 'Create Admin'}
        </button>
      </div>
    </form>
  );
}
