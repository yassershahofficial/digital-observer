'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import Toast from '@/components/Toast';
import { IProject } from '@/models/Project';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/projects');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load projects');
      }

      setProjects(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (name: string, youtubeUrl: string, order: number) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, youtubeUrl, order }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create project');
      }

      // Trigger revalidation
      try {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ path: '/' }),
        });
      } catch (revalidateError) {
        console.warn('Revalidation failed:', revalidateError);
      }

      setToast({
        type: 'success',
        message: 'Project created successfully!',
      });
      setShowCreateForm(false);
      fetchProjects();
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create project',
      });
      throw error;
    }
  };

  const handleUpdate = async (id: string, name: string, youtubeUrl: string, order: number) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, youtubeUrl, order }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update project');
      }

      // Trigger revalidation
      try {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ path: '/' }),
        });
      } catch (revalidateError) {
        console.warn('Revalidation failed:', revalidateError);
      }

      setToast({
        type: 'success',
        message: 'Project updated successfully!',
      });
      setEditingId(null);
      fetchProjects();
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update project',
      });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete project');
      }

      // Trigger revalidation
      try {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ path: '/' }),
        });
      } catch (revalidateError) {
        console.warn('Revalidation failed:', revalidateError);
      }

      setToast({
        type: 'success',
        message: 'Project deleted successfully!',
      });
      setDeleteConfirmId(null);
      fetchProjects();
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete project',
      });
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading projects..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to Load Projects"
        message={error}
        onRetry={fetchProjects}
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
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Projects Management</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Manage VCR cassette projects. Total: {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            + Create Project
          </button>
        </div>

        {/* Create Project Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Create New Project</h2>
            <ProjectForm
              projects={projects}
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">No projects yet. Create your first project to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      YouTube URL
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <ProjectRow
                      key={project._id?.toString()}
                      project={project}
                      isEditing={editingId === project._id?.toString()}
                      isDeleting={deleteConfirmId === project._id?.toString()}
                      onEdit={() => setEditingId(project._id?.toString() || null)}
                      onCancel={() => {
                        setEditingId(null);
                        setDeleteConfirmId(null);
                      }}
                      onSave={handleUpdate}
                      onDelete={() => setDeleteConfirmId(project._id?.toString() || null)}
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

interface ProjectRowProps {
  project: IProject;
  isEditing: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (id: string, name: string, youtubeUrl: string, order: number) => Promise<void>;
  onDelete: () => void;
  onConfirmDelete: (id: string) => Promise<void>;
}

function ProjectRow({
  project,
  isEditing,
  isDeleting,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onConfirmDelete,
}: ProjectRowProps) {
  const [name, setName] = useState(project.name);
  const [youtubeUrl, setYoutubeUrl] = useState(project.youtubeUrl);
  const [order, setOrder] = useState(project.order);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setName(project.name);
      setYoutubeUrl(project.youtubeUrl);
      setOrder(project.order);
    }
  }, [isEditing, project]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(project._id?.toString() || '', name, youtubeUrl, order);
    } finally {
      setSaving(false);
    }
  };

  if (isDeleting) {
    return (
      <tr>
        <td colSpan={4} className="px-3 sm:px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <p className="text-sm text-red-800 mb-3">
              Are you sure you want to delete &quot;{project.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onConfirmDelete(project._id?.toString() || '')}
                className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 text-sm"
              >
                Confirm Delete
              </button>
              <button
                onClick={onCancel}
                className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm"
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
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
            className="w-16 sm:w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            min="0"
          />
        </td>
        <td className="px-3 sm:px-6 py-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            placeholder="Project name"
          />
        </td>
        <td className="px-3 sm:px-6 py-4">
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            placeholder="https://youtube.com/..."
          />
        </td>
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex justify-end gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || !youtubeUrl.trim()}
              className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  // Truncate URL for mobile view
  const truncateUrl = (url: string, maxLength: number = 20) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <tr>
      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
        {project.order}
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-900">
        {project.name}
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">
        <a
          href={project.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-900 block"
          title={project.youtubeUrl}
        >
          <span className="hidden sm:inline truncate block max-w-md">
            {project.youtubeUrl}
          </span>
          <span className="sm:hidden">
            {truncateUrl(project.youtubeUrl, 15)}
          </span>
        </a>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end gap-2 sm:gap-3">
          <button
            onClick={onEdit}
            className="text-indigo-600 hover:text-indigo-900 text-xs sm:text-sm"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

interface ProjectFormProps {
  projects: IProject[];
  onSubmit: (name: string, youtubeUrl: string, order: number) => Promise<void>;
  onCancel: () => void;
}

function ProjectForm({ projects, onSubmit, onCancel }: ProjectFormProps) {
  // Calculate default order (highest order + 1, or 0 if no projects)
  const getDefaultOrder = () => {
    if (projects.length === 0) return 0;
    const maxOrder = Math.max(...projects.map(p => p.order));
    return maxOrder + 1;
  };

  const [name, setName] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [order, setOrder] = useState(getDefaultOrder());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; youtubeUrl?: string }>({});

  const validateYouTubeUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeUrlPattern.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: { name?: string; youtubeUrl?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Project name is required';
    }
    if (!youtubeUrl.trim()) {
      newErrors.youtubeUrl = 'YouTube URL is required';
    } else if (!validateYouTubeUrl(youtubeUrl)) {
      newErrors.youtubeUrl = 'Please provide a valid YouTube URL';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(name.trim(), youtubeUrl.trim(), order);
      setName('');
      setYoutubeUrl('');
      setOrder(getDefaultOrder());
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
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
            errors.name ? 'border-red-300' : ''
          }`}
          placeholder="Enter project name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          YouTube URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
            errors.youtubeUrl ? 'border-red-300' : ''
          }`}
          placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
        />
        {errors.youtubeUrl && <p className="mt-1 text-sm text-red-600">{errors.youtubeUrl}</p>}
        <p className="mt-1 text-xs text-gray-500">
          Supports youtube.com and youtu.be URLs
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Order
        </label>
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          min="0"
        />
        <p className="mt-1 text-xs text-gray-500">
          Lower numbers appear first. Defaults to the next available order.
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
          {saving ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
