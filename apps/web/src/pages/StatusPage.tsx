import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchStatus, fetchLatency, fetchPublicIncidents } from '../api/client';
import type { Incident, MonitorStatus, PublicMonitor, StatusResponse } from '../api/types';
import { HeartbeatBar } from '../components/HeartbeatBar';
import { LatencyChart } from '../components/LatencyChart';
import { Markdown } from '../components/Markdown';

type BannerStatus = StatusResponse['banner']['status'];

function getBannerText(status: BannerStatus): string {
  switch (status) {
    case 'operational':
      return 'All Systems Operational';
    case 'partial_outage':
      return 'Partial Outage';
    case 'major_outage':
      return 'Major Outage';
    case 'maintenance':
      return 'Maintenance';
    case 'unknown':
    default:
      return 'Status Unknown';
  }
}

function getBannerColor(status: BannerStatus): string {
  switch (status) {
    case 'operational':
      return 'bg-green-500';
    case 'partial_outage':
      return 'bg-orange-500';
    case 'major_outage':
      return 'bg-red-500';
    case 'maintenance':
      return 'bg-blue-500';
    case 'unknown':
    default:
      return 'bg-gray-500';
  }
}

function getStatusBadge(status: MonitorStatus): string {
  switch (status) {
    case 'up':
      return 'bg-green-100 text-green-800';
    case 'down':
      return 'bg-red-100 text-red-800';
    case 'maintenance':
      return 'bg-blue-100 text-blue-800';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800';
    case 'unknown':
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function MonitorCard({ monitor, onSelect }: { monitor: PublicMonitor; onSelect: () => void }) {
  return (
    <div
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">{monitor.name}</h3>
          <span className="text-xs text-gray-500 uppercase">{monitor.type}</span>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(monitor.status)}`}>
          {monitor.status}
        </span>
      </div>
      <HeartbeatBar heartbeats={monitor.heartbeats} />
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>
          {monitor.last_latency_ms !== null ? `${monitor.last_latency_ms}ms` : '-'}
        </span>
        <span>
          {monitor.last_checked_at !== null
            ? new Date(monitor.last_checked_at * 1000).toLocaleTimeString()
            : 'Never'}
        </span>
      </div>
    </div>
  );
}

function MonitorDetail({ monitorId, onClose }: { monitorId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['latency', monitorId],
    queryFn: () => fetchLatency(monitorId),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{data?.monitor.name ?? 'Loading...'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center">Loading...</div>
        ) : data ? (
          <>
            <div className="mb-4 text-sm text-gray-600">
              <span>Avg: {data.avg_latency_ms ?? '-'}ms</span>
              <span className="mx-2">|</span>
              <span>P95: {data.p95_latency_ms ?? '-'}ms</span>
            </div>
            <LatencyChart points={data.points} />
          </>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-gray-500">
            Failed to load data
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusPage() {
  const [selectedMonitorId, setSelectedMonitorId] = useState<number | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['status'],
    queryFn: fetchStatus,
    refetchInterval: 30000,
  });

  const incidentsQuery = useQuery({
    queryKey: ['public-incidents'],
    queryFn: () => fetchPublicIncidents(20),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">Failed to load status</div>
      </div>
    );
  }

  const publicMonitorNameById = new Map(data.monitors.map((m) => [m.id, m.name] as const));
  const activeIncidents = (incidentsQuery.data?.incidents ?? []).filter((it) => it.status !== 'resolved');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Uptimer</h1>
          <Link to="/admin" className="text-sm text-gray-600 hover:text-gray-900">
            Admin
          </Link>
        </div>
      </header>

      <div className={`${getBannerColor(data.banner.status)} text-white py-8`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold">{getBannerText(data.banner.status)}</h2>
          {data.banner.source === 'incident' && data.banner.incident && (
            <p className="mt-2 text-sm opacity-90">Incident: {data.banner.incident.title}</p>
          )}
          {data.banner.source === 'maintenance' && data.banner.maintenance_window && (
            <p className="mt-2 text-sm opacity-90">Maintenance: {data.banner.maintenance_window.title}</p>
          )}
          <p className="mt-2 text-sm opacity-90">
            Last updated: {new Date(data.generated_at * 1000).toLocaleString()}
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Maintenance */}
        {(data.maintenance_windows.active.length > 0 || data.maintenance_windows.upcoming.length > 0) && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Maintenance</h3>

            {data.maintenance_windows.active.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Active</div>
                <div className="space-y-2">
                  {data.maintenance_windows.active.map((w) => (
                    <div key={w.id} className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">{w.title}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(w.starts_at * 1000).toLocaleString()} – {new Date(w.ends_at * 1000).toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        Affected: {w.monitor_ids.map((id) => publicMonitorNameById.get(id) ?? `#${id}`).join(', ')}
                      </div>
                      {w.message && (
                        <div className="mt-2">
                          <Markdown text={w.message} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.maintenance_windows.upcoming.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Upcoming</div>
                <div className="space-y-2">
                  {data.maintenance_windows.upcoming.map((w) => (
                    <div key={w.id} className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">{w.title}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(w.starts_at * 1000).toLocaleString()} – {new Date(w.ends_at * 1000).toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        Affected: {w.monitor_ids.map((id) => publicMonitorNameById.get(id) ?? `#${id}`).join(', ')}
                      </div>
                      {w.message && (
                        <div className="mt-2">
                          <Markdown text={w.message} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Incidents */}
        <section className="mb-10">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Incidents</h3>

          {incidentsQuery.isLoading ? (
            <div className="text-gray-500">Loading incidents...</div>
          ) : activeIncidents.length === 0 ? (
            <div className="text-gray-500">No ongoing incidents</div>
          ) : (
            <div className="space-y-2">
              {activeIncidents.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setSelectedIncident(it)}
                  className="w-full text-left bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-gray-900">{it.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(it.started_at * 1000).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-600 flex gap-3">
                    <span>Status: {it.status}</span>
                    <span>Impact: {it.impact}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    Affected: {it.monitor_ids.map((id) => publicMonitorNameById.get(id) ?? `#${id}`).join(', ')}
                  </div>
                  {it.message && (
                    <div className="mt-2 text-sm text-gray-700">
                      {it.message.length > 140 ? `${it.message.slice(0, 140)}...` : it.message}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-4">
          {data.monitors.map((monitor) => (
            <MonitorCard
              key={monitor.id}
              monitor={monitor}
              onSelect={() => setSelectedMonitorId(monitor.id)}
            />
          ))}
        </div>
        {data.monitors.length === 0 && (
          <div className="text-center text-gray-500 py-8">No monitors configured</div>
        )}
      </main>

      {selectedMonitorId !== null && (
        <MonitorDetail monitorId={selectedMonitorId} onClose={() => setSelectedMonitorId(null)} />
      )}

      {selectedIncident && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedIncident(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedIncident.title}</h2>
              <button onClick={() => setSelectedIncident(null)} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <div>Status: {selectedIncident.status}</div>
              <div>Impact: {selectedIncident.impact}</div>
              <div>
                Affected:{' '}
                {selectedIncident.monitor_ids.map((id) => publicMonitorNameById.get(id) ?? `#${id}`).join(', ')}
              </div>
              <div>Started: {new Date(selectedIncident.started_at * 1000).toLocaleString()}</div>
              {selectedIncident.resolved_at && (
                <div>Resolved: {new Date(selectedIncident.resolved_at * 1000).toLocaleString()}</div>
              )}
            </div>

            <div className="space-y-4">
              {selectedIncident.message && (
                <div className="border rounded p-3 bg-gray-50">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Initial</div>
                  <Markdown text={selectedIncident.message} />
                </div>
              )}

              {selectedIncident.updates.map((u) => (
                <div key={u.id} className="border rounded p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="text-xs uppercase tracking-wide text-gray-500">
                      {u.status ? `Update (${u.status})` : 'Update'}
                    </div>
                    <div className="text-xs text-gray-500">{new Date(u.created_at * 1000).toLocaleString()}</div>
                  </div>
                  <Markdown text={u.message} />
                </div>
              ))}

              {!selectedIncident.message && selectedIncident.updates.length === 0 && (
                <div className="text-sm text-gray-500">No details</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
