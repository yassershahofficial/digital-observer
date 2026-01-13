'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import Toast from '@/components/Toast';

interface AnalyticsData {
  stats: any[];
  summary: {
    eventCounts: Array<{ _id: string; count: number }>;
    projectPopularity: Array<{
      projectId: string;
      projectName: string;
      tapeInserted: number;
      launchClicked: number;
      total: number;
    }>;
    contactItemStats: Array<{ _id: string; count: number }>;
    visitorStats: {
      totalVisits: number;
      uniqueVisitors: number;
      dailyVisits: Array<{ _id: string; count: number }>;
    };
  };
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/stats');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load analytics');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data) return;

    try {
      // Prepare CSV data
      const csvRows: string[] = [];

      // Header
      csvRows.push('Analytics Export');
      csvRows.push(`Generated: ${new Date().toISOString()}`);
      csvRows.push('');

      // Visitor Statistics
      if (data.summary.visitorStats) {
        csvRows.push('Visitor Statistics');
        csvRows.push(`Total Visits,${data.summary.visitorStats.totalVisits}`);
        csvRows.push(`Unique Visitors,${data.summary.visitorStats.uniqueVisitors}`);
        csvRows.push('');
        
        if (data.summary.visitorStats.dailyVisits && data.summary.visitorStats.dailyVisits.length > 0) {
          csvRows.push('Daily Visits (Last 30 Days)');
          csvRows.push('Date,Visits');
          data.summary.visitorStats.dailyVisits.forEach((day) => {
            csvRows.push(`${day._id},${day.count}`);
          });
          csvRows.push('');
        }
      }

      // Event Counts
      csvRows.push('Event Counts by Type');
      csvRows.push('Event Type,Count');
      data.summary.eventCounts.forEach((item) => {
        csvRows.push(`${item._id},${item.count}`);
      });
      csvRows.push('');

      // Project Popularity
      csvRows.push('Project Popularity');
      csvRows.push('Project Name,Tape Inserted,Launch Clicked,Total Interactions');
      data.summary.projectPopularity.forEach((item) => {
        csvRows.push(`${item.projectName},${item.tapeInserted},${item.launchClicked},${item.total}`);
      });
      csvRows.push('');

      // Contact Item Stats
      csvRows.push('Contact Item Statistics');
      csvRows.push('Item Type,Count');
      data.summary.contactItemStats.forEach((item) => {
        csvRows.push(`${item._id},${item.count}`);
      });
      csvRows.push('');

      // Recent Events
      csvRows.push('Recent Events (Last 100)');
      csvRows.push('Timestamp,Event Type,Project Name,Item Type');
      data.stats.slice(0, 100).forEach((stat: any) => {
        const timestamp = new Date(stat.timestamp).toISOString();
        const projectName = stat.projectId?.name || 'N/A';
        const itemType = stat.itemType || 'N/A';
        csvRows.push(`${timestamp},${stat.eventType},${projectName},${itemType}`);
      });

      // Create and download CSV
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToast({
        type: 'success',
        message: 'Analytics data exported successfully!',
      });
    } catch (error) {
      setToast({
        type: 'error',
        message: 'Failed to export analytics data',
      });
      console.error('Error exporting CSV:', error);
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      PAGE_VISIT: 'Page Visit',
      TAPE_INSERTED: 'Tape Inserted',
      LAUNCH_CLICKED: 'Launch Clicked',
      ITEM_INSPECTED: 'Item Inspected',
    };
    return labels[eventType] || eventType;
  };

  const getTotalEvents = () => {
    if (!data) return 0;
    return data.summary.eventCounts.reduce((sum, item) => sum + item.count, 0);
  };

  if (loading) {
    return <LoadingSpinner text="Loading analytics..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to Load Analytics"
        message={error}
        onRetry={fetchAnalytics}
      />
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No analytics data available.</p>
      </div>
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
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Track user interactions and engagement metrics
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-500">Total Events</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{getTotalEvents()}</div>
          </div>
          {data.summary.eventCounts.map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500">{getEventTypeLabel(item._id)}</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{item.count}</div>
            </div>
          ))}
        </div>

        {/* Visitor Statistics */}
        {data.summary.visitorStats && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Visitor Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 mb-1">Total Page Visits</div>
                <div className="text-3xl font-bold text-indigo-600">{data.summary.visitorStats.totalVisits}</div>
                <div className="text-xs text-gray-500 mt-1">All time page visits</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 mb-1">Unique Visitors</div>
                <div className="text-3xl font-bold text-green-600">{data.summary.visitorStats.uniqueVisitors}</div>
                <div className="text-xs text-gray-500 mt-1">Distinct visitors tracked</div>
              </div>
            </div>
            
            {/* Daily Visits Chart (Last 30 Days) */}
            {data.summary.visitorStats.dailyVisits && data.summary.visitorStats.dailyVisits.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Daily Visits (Last 30 Days)</h3>
                <div className="space-y-2">
                  {data.summary.visitorStats.dailyVisits.map((day) => {
                    const maxVisits = Math.max(...data.summary.visitorStats.dailyVisits.map(d => d.count));
                    const percentage = maxVisits > 0 ? (day.count / maxVisits) * 100 : 0;
                    const date = new Date(day._id);
                    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return (
                      <div key={day._id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-700">{formattedDate}</span>
                          <span className="text-sm text-gray-500">{day.count} visits</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Event Counts Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Counts by Type</h2>
          <div className="space-y-4">
            {data.summary.eventCounts.map((item) => {
              const total = getTotalEvents();
              const percentage = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div key={item._id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {getEventTypeLabel(item._id)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {item.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Project Popularity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Popularity</h2>
          {data.summary.projectPopularity.length === 0 ? (
            <p className="text-gray-500 text-sm">No project interactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tape Inserted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Launch Clicked
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.summary.projectPopularity.map((item, index) => {
                    const maxTotal = Math.max(...data.summary.projectPopularity.map(p => p.total));
                    const percentage = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
                    return (
                      <tr key={item.projectId || index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.projectName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.tapeInserted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.launchClicked}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900 mr-2">{item.total}</span>
                            <div className="flex-1 max-w-xs">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Contact Item Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Item Statistics</h2>
          {data.summary.contactItemStats.length === 0 ? (
            <p className="text-gray-500 text-sm">No contact item interactions yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.summary.contactItemStats.map((item) => {
                const total = data.summary.contactItemStats.reduce((sum, i) => sum + i.count, 0);
                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                return (
                  <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">{item._id}</div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">{item.count}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of total</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h2>
          {data.stats.length === 0 ? (
            <p className="text-gray-500 text-sm">No events recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.stats.slice(0, 50).map((stat: any, index: number) => (
                    <tr key={stat._id || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(stat.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getEventTypeLabel(stat.eventType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stat.projectId?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stat.itemType || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
