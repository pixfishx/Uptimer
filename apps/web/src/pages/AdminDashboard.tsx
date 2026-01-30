import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { useAuth } from '../app/AuthContext';
import {
  fetchAdminMonitors,
  createMonitor,
  updateMonitor,
  deleteMonitor,
  testMonitor,
  fetchNotificationChannels,
  createNotificationChannel,
  updateNotificationChannel,
  testNotificationChannel,
  fetchAdminIncidents,
  createIncident,
  addIncidentUpdate,
  resolveIncident,
  deleteIncident,
  fetchMaintenanceWindows,
  createMaintenanceWindow,
  updateMaintenanceWindow,
  deleteMaintenanceWindow,
} from '../api/client';
import type { AdminMonitor, Incident, MaintenanceWindow, NotificationChannel } from '../api/types';
import { IncidentForm } from '../components/IncidentForm';
import { IncidentUpdateForm } from '../components/IncidentUpdateForm';
import { MaintenanceWindowForm } from '../components/MaintenanceWindowForm';
import { MonitorForm } from '../components/MonitorForm';
import { NotificationChannelForm } from '../components/NotificationChannelForm';
import { ResolveIncidentForm } from '../components/ResolveIncidentForm';

type Tab = 'monitors' | 'notifications' | 'incidents' | 'maintenance';
type ModalState =
  | { type: 'none' }
  | { type: 'create-monitor' }
  | { type: 'edit-monitor'; monitor: AdminMonitor }
  | { type: 'create-channel' }
  | { type: 'edit-channel'; channel: NotificationChannel }
  | { type: 'create-incident' }
  | { type: 'add-incident-update'; incident: Incident }
  | { type: 'resolve-incident'; incident: Incident }
  | { type: 'create-maintenance' }
  | { type: 'edit-maintenance'; window: MaintenanceWindow };

export function AdminDashboard() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('monitors');
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [testingMonitorId, setTestingMonitorId] = useState<number | null>(null);
  const [testingChannelId, setTestingChannelId] = useState<number | null>(null);

  // Queries
  const monitorsQuery = useQuery({
    queryKey: ['admin-monitors'],
    queryFn: () => fetchAdminMonitors(),
  });

  const channelsQuery = useQuery({
    queryKey: ['admin-channels'],
    queryFn: () => fetchNotificationChannels(),
  });

  const incidentsQuery = useQuery({
    queryKey: ['admin-incidents'],
    queryFn: () => fetchAdminIncidents(),
  });

  const maintenanceQuery = useQuery({
    queryKey: ['admin-maintenance-windows'],
    queryFn: () => fetchMaintenanceWindows(),
  });

  // Monitor mutations
  const createMonitorMut = useMutation({
    mutationFn: createMonitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-monitors'] });
      setModal({ type: 'none' });
    },
  });

  const updateMonitorMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateMonitor>[1] }) =>
      updateMonitor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-monitors'] });
      setModal({ type: 'none' });
    },
  });

  const deleteMonitorMut = useMutation({
    mutationFn: deleteMonitor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-monitors'] }),
  });

  const testMonitorMut = useMutation({
    mutationFn: testMonitor,
    onSettled: () => setTestingMonitorId(null),
  });

  // Channel mutations
  const createChannelMut = useMutation({
    mutationFn: createNotificationChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-channels'] });
      setModal({ type: 'none' });
    },
  });

  const updateChannelMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateNotificationChannel>[1] }) =>
      updateNotificationChannel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-channels'] });
      setModal({ type: 'none' });
    },
  });

  const testChannelMut = useMutation({
    mutationFn: testNotificationChannel,
    onSettled: () => setTestingChannelId(null),
  });

  const monitorNameById = new Map((monitorsQuery.data?.monitors ?? []).map((m) => [m.id, m.name] as const));

  // Incident mutations
  const createIncidentMut = useMutation({
    mutationFn: createIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incidents'] });
      setModal({ type: 'none' });
    },
  });

  const addIncidentUpdateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof addIncidentUpdate>[1] }) =>
      addIncidentUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incidents'] });
      setModal({ type: 'none' });
    },
  });

  const resolveIncidentMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof resolveIncident>[1] }) =>
      resolveIncident(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incidents'] });
      setModal({ type: 'none' });
    },
  });

  const deleteIncidentMut = useMutation({
    mutationFn: deleteIncident,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-incidents'] }),
  });

  // Maintenance mutations
  const createMaintenanceMut = useMutation({
    mutationFn: createMaintenanceWindow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-maintenance-windows'] });
      setModal({ type: 'none' });
    },
  });

  const updateMaintenanceMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateMaintenanceWindow>[1] }) =>
      updateMaintenanceWindow(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-maintenance-windows'] });
      setModal({ type: 'none' });
    },
  });

  const deleteMaintenanceMut = useMutation({
    mutationFn: deleteMaintenanceWindow,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-maintenance-windows'] }),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">Status Page</Link>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex gap-4 border-b">
          <button
            onClick={() => setTab('monitors')}
            className={`pb-2 px-1 ${tab === 'monitors' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Monitors
          </button>
          <button
            onClick={() => setTab('notifications')}
            className={`pb-2 px-1 ${tab === 'notifications' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Notifications
          </button>
          <button
            onClick={() => setTab('incidents')}
            className={`pb-2 px-1 ${tab === 'incidents' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Incidents
          </button>
          <button
            onClick={() => setTab('maintenance')}
            className={`pb-2 px-1 ${tab === 'maintenance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Maintenance
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'monitors' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Monitors</h2>
              <button
                onClick={() => setModal({ type: 'create-monitor' })}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Monitor
              </button>
            </div>

            {monitorsQuery.isLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : monitorsQuery.data?.monitors.length === 0 ? (
              <div className="text-gray-500">No monitors yet</div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Target</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {monitorsQuery.data?.monitors.map((m) => (
                      <tr key={m.id}>
                        <td className="px-4 py-3 text-sm">{m.name}</td>
                        <td className="px-4 py-3 text-sm uppercase text-gray-500">{m.type}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">{m.target}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${m.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {m.is_active ? 'Active' : 'Paused'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right space-x-2">
                          <button
                            onClick={() => { setTestingMonitorId(m.id); testMonitorMut.mutate(m.id); }}
                            disabled={testingMonitorId === m.id}
                            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          >
                            {testingMonitorId === m.id ? 'Testing...' : 'Test'}
                          </button>
                          <button
                            onClick={() => setModal({ type: 'edit-monitor', monitor: m })}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this monitor?')) deleteMonitorMut.mutate(m.id); }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'notifications' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Notification Channels</h2>
              <button
                onClick={() => setModal({ type: 'create-channel' })}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Channel
              </button>
            </div>

            {channelsQuery.isLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : channelsQuery.data?.notification_channels.length === 0 ? (
              <div className="text-gray-500">No channels yet</div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">URL</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {channelsQuery.data?.notification_channels.map((ch) => (
                      <tr key={ch.id}>
                        <td className="px-4 py-3 text-sm">{ch.name}</td>
                        <td className="px-4 py-3 text-sm uppercase text-gray-500">{ch.type}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">{ch.config_json.url}</td>
                        <td className="px-4 py-3 text-sm text-right space-x-2">
                          <button
                            onClick={() => { setTestingChannelId(ch.id); testChannelMut.mutate(ch.id); }}
                            disabled={testingChannelId === ch.id}
                            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          >
                            {testingChannelId === ch.id ? 'Testing...' : 'Test'}
                          </button>
                          <button
                            onClick={() => setModal({ type: 'edit-channel', channel: ch })}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'incidents' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Incidents</h2>
              <button
                onClick={() => setModal({ type: 'create-incident' })}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Incident
              </button>
            </div>

            {incidentsQuery.isLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : incidentsQuery.data?.incidents.length === 0 ? (
              <div className="text-gray-500">No incidents yet</div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Title</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Monitors</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Impact</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Started</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Resolved</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {incidentsQuery.data?.incidents.map((it) => (
                      <tr key={it.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{it.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {it.monitor_ids.map((id) => monitorNameById.get(id) ?? `#${id}`).join(', ')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{it.status}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{it.impact}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(it.started_at * 1000).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {it.resolved_at ? new Date(it.resolved_at * 1000).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right space-x-2">
                          <button
                            onClick={() => setModal({ type: 'add-incident-update', incident: it })}
                            disabled={it.status === 'resolved'}
                            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => setModal({ type: 'resolve-incident', incident: it })}
                            disabled={it.status === 'resolved'}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete incident "${it.title}"?`)) {
                                deleteIncidentMut.mutate(it.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'maintenance' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Maintenance Windows</h2>
              <button
                onClick={() => setModal({ type: 'create-maintenance' })}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Window
              </button>
            </div>

            {maintenanceQuery.isLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : maintenanceQuery.data?.maintenance_windows.length === 0 ? (
              <div className="text-gray-500">No maintenance windows yet</div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Title</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Monitors</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Starts</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ends</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">State</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {maintenanceQuery.data?.maintenance_windows.map((w) => {
                      const now = Math.floor(Date.now() / 1000);
                      const state =
                        w.starts_at <= now && w.ends_at > now ? 'Active' : w.starts_at > now ? 'Upcoming' : 'Ended';

                      return (
                        <tr key={w.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{w.title}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {w.monitor_ids.map((id) => monitorNameById.get(id) ?? `#${id}`).join(', ')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(w.starts_at * 1000).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(w.ends_at * 1000).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{state}</td>
                          <td className="px-4 py-3 text-sm text-right space-x-2">
                            <button
                              onClick={() => setModal({ type: 'edit-maintenance', window: w })}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete maintenance window "${w.title}"?`)) {
                                  deleteMaintenanceMut.mutate(w.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      {modal.type !== 'none' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {modal.type === 'create-monitor' && 'Create Monitor'}
              {modal.type === 'edit-monitor' && 'Edit Monitor'}
              {modal.type === 'create-channel' && 'Create Channel'}
              {modal.type === 'edit-channel' && 'Edit Channel'}
              {modal.type === 'create-incident' && 'Create Incident'}
              {modal.type === 'add-incident-update' && 'Post Incident Update'}
              {modal.type === 'resolve-incident' && 'Resolve Incident'}
              {modal.type === 'create-maintenance' && 'Create Maintenance Window'}
              {modal.type === 'edit-maintenance' && 'Edit Maintenance Window'}
            </h2>

            {(modal.type === 'create-monitor' || modal.type === 'edit-monitor') && (
              <MonitorForm
                monitor={modal.type === 'edit-monitor' ? modal.monitor : undefined}
                onSubmit={(data) => {
                  if (modal.type === 'edit-monitor') {
                    updateMonitorMut.mutate({ id: modal.monitor.id, data });
                  } else {
                    createMonitorMut.mutate(data);
                  }
                }}
                onCancel={() => setModal({ type: 'none' })}
                isLoading={createMonitorMut.isPending || updateMonitorMut.isPending}
              />
            )}

            {(modal.type === 'create-channel' || modal.type === 'edit-channel') && (
              <NotificationChannelForm
                channel={modal.type === 'edit-channel' ? modal.channel : undefined}
                onSubmit={(data) => {
                  if (modal.type === 'edit-channel') {
                    updateChannelMut.mutate({ id: modal.channel.id, data });
                  } else {
                    createChannelMut.mutate(data);
                  }
                }}
                onCancel={() => setModal({ type: 'none' })}
                isLoading={createChannelMut.isPending || updateChannelMut.isPending}
              />
            )}

            {modal.type === 'create-incident' && (
              <IncidentForm
                monitors={(monitorsQuery.data?.monitors ?? []).map((m) => ({ id: m.id, name: m.name }))}
                onSubmit={(data) => createIncidentMut.mutate(data)}
                onCancel={() => setModal({ type: 'none' })}
                isLoading={createIncidentMut.isPending}
              />
            )}

            {modal.type === 'add-incident-update' && (
              <IncidentUpdateForm
                onSubmit={(data) => addIncidentUpdateMut.mutate({ id: modal.incident.id, data })}
                onCancel={() => setModal({ type: 'none' })}
                isLoading={addIncidentUpdateMut.isPending}
              />
            )}

            {modal.type === 'resolve-incident' && (
              <ResolveIncidentForm
                onSubmit={(data) => resolveIncidentMut.mutate({ id: modal.incident.id, data })}
                onCancel={() => setModal({ type: 'none' })}
                isLoading={resolveIncidentMut.isPending}
              />
            )}

            {modal.type === 'create-maintenance' && (
              <MaintenanceWindowForm
                monitors={(monitorsQuery.data?.monitors ?? []).map((m) => ({ id: m.id, name: m.name }))}
                onSubmit={(data) => createMaintenanceMut.mutate(data)}
                onCancel={() => setModal({ type: 'none' })}
                isLoading={createMaintenanceMut.isPending}
              />
            )}

            {modal.type === 'edit-maintenance' && (
              <MaintenanceWindowForm
                monitors={(monitorsQuery.data?.monitors ?? []).map((m) => ({ id: m.id, name: m.name }))}
                window={modal.window}
                onSubmit={(data) => updateMaintenanceMut.mutate({ id: modal.window.id, data })}
                onCancel={() => setModal({ type: 'none' })}
                isLoading={updateMaintenanceMut.isPending}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
