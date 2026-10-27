import 'server-only';
import { cache } from 'react';
import { apiFetch } from './api';

// Shared by the Panel Admin sidebar (badges) and its pages; fetched once per request.
export const getOverview = cache((token) => apiFetch('api/admin/overview', { token }));

/** Numbers for the sidebar badges and the Ringkasan tiles. */
export function summarise(overview) {
  const pending = overview.trackers.reduce((n, t) => n + t.pending.length, 0);
  const last = overview.syncRuns[0];
  return {
    pending,
    problems: last?.warnings?.length ?? 0,
    lastSync: last?.ran_at ?? null,
    syncFresh: last ? Date.now() - Date.parse(last.ran_at) < 2 * 3600 * 1000 : false,
  };
}
