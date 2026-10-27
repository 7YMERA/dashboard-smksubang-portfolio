'use client';

// "Sync sekarang" button. The Apps Script checks for requests every 5 minutes (checkSyncRequest).
import { useActionState } from 'react';
import { requestSync } from '@/app/admin/actions';
import { fmtDateTime } from '../ui/format';

export default function SyncNow({ request }) {
  const [state, action, pending] = useActionState(requestSync, undefined);
  const waitingMin = request ? (Date.now() - Date.parse(request.requested_at)) / 60000 : 0;
  return (
    <form action={action} className="sync-now">
      <button className="btn primary" disabled={pending || Boolean(request)}>
        {pending ? 'Menghantar…' : request ? '⏳ Sedang menunggu sync' : '↻ Sync sekarang'}
      </button>
      {request ? (
        <span className="muted">
          Diminta oleh {request.requested_by} pada {fmtDateTime(request.requested_at)}. Data baharu dalam masa ~5 minit
          {waitingMin > 15 && <strong className="row-msg error"> · Sudah lebih 15 minit: jalankan installHourlyTrigger dalam Apps Script.</strong>}
        </span>
      ) : (
        <span className="muted">Tak mahu tunggu sejam? Tekan untuk ambil data terkini (siap dalam ~5 minit).</span>
      )}
      {state?.error && <span className="row-msg error">{state.error}</span>}
    </form>
  );
}
