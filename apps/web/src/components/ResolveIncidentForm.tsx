import { useMemo, useState } from 'react';

import type { ResolveIncidentInput } from '../api/types';
import { Markdown } from './Markdown';

export function ResolveIncidentForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (input: ResolveIncidentInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [message, setMessage] = useState('');
  const normalized = useMemo(() => message.trim(), [message]);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(normalized.length > 0 ? { message: normalized } : {});
      }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Resolution message (Markdown, optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full border rounded px-3 py-2 text-sm font-mono"
          placeholder="Optional: Describe the resolution / follow-up steps..."
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
          disabled={isLoading}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Resolving...' : 'Resolve'}
        </button>
      </div>
    </form>
  );
}
