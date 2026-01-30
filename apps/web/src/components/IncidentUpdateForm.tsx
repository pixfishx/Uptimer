import { useMemo, useState } from 'react';

import type { CreateIncidentUpdateInput, IncidentStatus } from '../api/types';
import { Markdown } from './Markdown';

const statusOptions: Array<Exclude<IncidentStatus, 'resolved'>> = ['investigating', 'identified', 'monitoring'];

export function IncidentUpdateForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (input: CreateIncidentUpdateInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Exclude<IncidentStatus, 'resolved'> | ''>('');

  const normalized = useMemo(() => message.trim(), [message]);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const base: CreateIncidentUpdateInput = { message: normalized };
        onSubmit(status === '' ? base : { ...base, status });
      }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status (optional)</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Exclude<IncidentStatus, 'resolved'> | '')}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="">Keep current status</option>
          {statusOptions.map((it) => (
            <option key={it} value={it}>
              {it}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Update message (Markdown)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="w-full border rounded px-3 py-2 text-sm font-mono"
          placeholder="What changed? What's the latest status?"
          required
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
          disabled={isLoading || normalized.length === 0}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Post Update'}
        </button>
      </div>
    </form>
  );
}
