'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ContentForm from '@/components/ContentForm';

export default function AdminContentPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/site-config');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load site config');
      }

      setConfig(data.data || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load site config');
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading site configuration..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to Load Configuration"
        message={error}
        onRetry={fetchConfig}
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Edit all text content for your portfolio website
        </p>
      </div>

      <ContentForm initialData={config} />
    </div>
  );
}
