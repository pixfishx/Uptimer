import { useMemo, useState } from 'react';

import type { CreateMaintenanceWindowInput, MaintenanceWindow, PatchMaintenanceWindowInput } from '../api/types';
import { Markdown } from './Markdown';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toDatetimeLocal(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): number | null {
  if (!value) return null;
  const d = new Date(value);
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.floor(ms / 1000);
}

type CommonProps = {
  onCancel: () => void;
  isLoading?: boolean;
  monitors: Array<{ id: number; name: string }>;
};

type CreateProps = CommonProps & {
  window?: undefined;
  onSubmit: (input: CreateMaintenanceWindowInput) => void;
};

type EditProps = CommonProps & {
  window: MaintenanceWindow;
  onSubmit: (input: PatchMaintenanceWindowInput) => void;
};

export function MaintenanceWindowForm(props: CreateProps | EditProps) {
  const window = props.window;
  const onCancel = props.onCancel;
  const isLoading = props.isLoading;
  const monitors = props.monitors;

  const [title, setTitle] = useState(window?.title ?? '');
  const [message, setMessage] = useState(window?.message ?? '');
  const [startsAt, setStartsAt] = useState(window ? toDatetimeLocal(window.starts_at) : '');
  const [endsAt, setEndsAt] = useState(window ? toDatetimeLocal(window.ends_at) : '');
  const [selectedMonitorIds, setSelectedMonitorIds] = useState<number[]>(window?.monitor_ids ?? []);

  const normalized = useMemo(() => message.trim(), [message]);

  const parsed = useMemo(() => {
    const s = fromDatetimeLocal(startsAt);
    const e = fromDatetimeLocal(endsAt);
    return { starts_at: s, ends_at: e };
  }, [startsAt, endsAt]);

  const timeError =
    parsed.starts_at === null || parsed.ends_at === null
      ? 'Start/end time is required'
      : parsed.starts_at >= parsed.ends_at
        ? 'Start time must be earlier than end time'
        : null;

  const monitorsError =
    monitors.length === 0
      ? 'No monitors available'
      : selectedMonitorIds.length === 0
        ? 'Select at least one monitor'
        : null;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        if (timeError || parsed.starts_at === null || parsed.ends_at === null) return;
        if (selectedMonitorIds.length === 0) return;

        const base = {
          title: title.trim(),
          starts_at: parsed.starts_at,
          ends_at: parsed.ends_at,
          monitor_ids: selectedMonitorIds,
        };

        if (props.window) {
          props.onSubmit({ ...base, message: normalized.length > 0 ? normalized : null });
        } else {
          props.onSubmit(normalized.length > 0 ? { ...base, message: normalized } : base);
        }
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
        {monitorsError && <div className="mt-2 text-sm text-red-600">{monitorsError}</div>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="e.g. Database maintenance"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Starts</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ends</label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      {timeError && <div className="text-sm text-red-600">{timeError}</div>}

      <div className="text-xs text-gray-500">
        Unix seconds: start={parsed.starts_at ?? '-'}, end={parsed.ends_at ?? '-'}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message (Markdown, optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full border rounded px-3 py-2 text-sm font-mono"
          placeholder="Optional maintenance details..."
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
          disabled={isLoading || title.trim().length === 0 || !!timeError || selectedMonitorIds.length === 0}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : window ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  );
}
