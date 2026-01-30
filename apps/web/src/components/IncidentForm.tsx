import { useMemo, useState } from 'react';

import type { CreateIncidentInput, IncidentImpact, IncidentStatus } from '../api/types';
import { Markdown } from './Markdown';

const impactOptions: IncidentImpact[] = ['none', 'minor', 'major', 'critical'];
const statusOptions: Array<Exclude<IncidentStatus, 'resolved'>> = ['investigating', 'identified', 'monitoring'];

export function IncidentForm({
  monitors,
  onSubmit,
  onCancel,
  isLoading,
}: {
  monitors: Array<{ id: number; name: string }>;
  onSubmit: (input: CreateIncidentInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [title, setTitle] = useState('');
  const [impact, setImpact] = useState<IncidentImpact>('minor');
  const [status, setStatus] = useState<Exclude<IncidentStatus, 'resolved'>>('investigating');
  const [message, setMessage] = useState('');
  const [selectedMonitorIds, setSelectedMonitorIds] = useState<number[]>([]);

  const normalized = useMemo(() => message.trim(), [message]);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const monitor_ids = selectedMonitorIds;
        if (monitor_ids.length === 0) return;
        const base: CreateIncidentInput = {
          title: title.trim(),
          impact,
          status,
          monitor_ids,
        };
        onSubmit(normalized.length > 0 ? { ...base, message: normalized } : base);
      }}
    >
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Affected Monitors</div>
        {monitors.length === 0 ? (
          <div className="text-sm text-gray-500">No monitors available</div>
        ) : (
          <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
            {monitors.map((m) => {
              const checked = selectedMonitorIds.includes(m.id);
              return (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selectedMonitorIds, m.id]
                        : selectedMonitorIds.filter((id) => id !== m.id);
                      setSelectedMonitorIds(next);
                    }}
                  />
                  <span>{m.name}</span>
                </label>
              );
            })}
          </div>
        )}
        {monitors.length > 0 && selectedMonitorIds.length === 0 && (
          <div className="mt-2 text-sm text-red-600">Select at least one monitor</div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="e.g. API latency issues"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
          <select
            value={impact}
            onChange={(e) => setImpact(e.target.value as IncidentImpact)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {impactOptions.map((it) => (
              <option key={it} value={it}>
                {it}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Exclude<IncidentStatus, 'resolved'>)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {statusOptions.map((it) => (
              <option key={it} value={it}>
                {it}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message (Markdown)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="w-full border rounded px-3 py-2 text-sm font-mono"
          placeholder="Describe the issue and current mitigation..."
        />
      </div>

      {normalized.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">Preview</div>
          <div className="border rounded p-3 bg-gray-50">
            <Markdown text={normalized} />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-md">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || title.trim().length === 0 || selectedMonitorIds.length === 0}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Create'}
        </button>
      </div>
    </form>
  );
}
