'use client';

// MODULE Akaun (admin only): add a Pentadbir/Admin, change role, send a new set-password link, remove access.
// Nobody types or sees a password here: each person sets their own through a one-time link.
import { useActionState, useState } from 'react';
import { addAccount, changeRole, removeAccount, sendSetupLink } from '@/app/admin/actions';
import { fmtDateTime } from '../ui/format';

const ROLE = { admin: 'Admin', pentadbir: 'Pentadbir (lihat sahaja)' };

const validFor = (min) => (min % 60 ? `${min} minit` : `${min / 60} jam`);

// The one-time "Tetapkan kata laluan" link: copy a ready message, or open Telegram (the teachers' official channel)
// to pick the person's chat. No bot needed.
function SetupLink({ name, email, link }) {
  const [copied, setCopied] = useState(false);
  const valid = validFor(link.valid_minutes);
  const intro = `Salam ${name}. Akaun Panel Admin Dashboard Data SMK Subang anda sudah sedia.\n`
    + `Tekan pautan ini untuk tetapkan kata laluan anda sendiri (sah ${valid}, sekali guna sahaja).`;
  const after = `Selepas itu, log masuk di ${location.origin}/admin dengan emel ${email}.`;
  const text = `${intro}\n${link.setup_url}\n${after}`;
  const telegram = `https://t.me/share/url?url=${encodeURIComponent(link.setup_url)}&text=${encodeURIComponent(`\n${intro}\n${after}`)}`;
  return (
    <div className="account-done" role="status">
      {link.emailed
        ? <p>✉ Pautan juga dihantar ke emel <strong>{email}</strong>.</p>
        : <p>Hantar pautan ini kepada <strong>{name}</strong> secara peribadi (Telegram). Ia sah <strong>{valid}</strong> dan boleh digunakan sekali sahaja.</p>}
      <span className="link-actions">
        <button type="button" className="btn primary" onClick={async () => {
          await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000);
        }}>{copied ? 'Disalin ✓' : 'Salin pautan'}</button>
        <a className="btn" href={telegram} target="_blank" rel="noopener noreferrer">Hantar di Telegram</a>
      </span>
    </div>
  );
}

function AddAccount() {
  const [state, action, pending] = useActionState(addAccount, undefined);
  const v = state?.values ?? {};
  return (
    <form action={action} className="account-add">
      <h3>Tambah akaun</h3>
      <div className="account-fields">
        <label>Nama<input name="name" required maxLength={80} placeholder="cth. Pengetua" defaultValue={v.name} /></label>
        <label>Emel<input name="email" type="email" required placeholder="nama@sekolah.edu.my" defaultValue={v.email} /></label>
        <label>Peranan
          <select name="role" defaultValue={v.role ?? 'pentadbir'}>
            <option value="pentadbir">Pentadbir (lihat sahaja)</option>
            <option value="admin">Admin (boleh ubah)</option>
          </select>
        </label>
      </div>
      <p className="muted small">Tiada kata laluan perlu dibuat. Orang itu menerima pautan untuk menetapkan kata laluannya sendiri.</p>
      <button type="submit" className="btn primary" disabled={pending}>{pending ? 'Sedang menambah…' : 'Tambah akaun'}</button>
      {state?.error && <p className="row-msg error" role="alert">{state.error}</p>}
      {state?.created && (
        <>
          <p className="row-msg ok">✓ Akaun <strong>{state.created.name}</strong> ({ROLE[state.created.role]}) sudah dibuat.</p>
          <SetupLink name={state.created.name} email={state.created.email} link={state.created} />
        </>
      )}
    </form>
  );
}

function AccountRow({ a }) {
  const [roleState, roleAction] = useActionState(changeRole, undefined);
  const [pwState, pwAction, pwPending] = useActionState(sendSetupLink, undefined);
  const [delState, delAction] = useActionState(removeAccount, undefined);
  const msg = [roleState, pwState, delState].find((s) => s?.error)?.error;
  return (
    <li className="account-row">
      <div className="account-who">
        <strong>{a.name || a.email}{a.is_me && <span className="chip neutral">anda</span>}</strong>
        <small className="muted">{a.email} · {a.last_sign_in_at ? `log masuk terakhir ${fmtDateTime(a.last_sign_in_at)}` : 'belum pernah log masuk'}</small>
      </div>
      <form action={roleAction} className="account-role">
        <input type="hidden" name="id" value={a.user_id} />
        <select name="role" defaultValue={a.role} aria-label={`Peranan ${a.name}`} disabled={a.is_me}
          onChange={(e) => e.target.form.requestSubmit()}>
          <option value="pentadbir">Pentadbir</option>
          <option value="admin">Admin</option>
        </select>
      </form>
      <form action={pwAction}>
        <input type="hidden" name="id" value={a.user_id} />
        <button className="btn" disabled={pwPending}>{pwPending ? 'Sedang membuat…' : 'Pautan kata laluan baharu'}</button>
      </form>
      {!a.is_me && (
        <form action={delAction}>
          <input type="hidden" name="id" value={a.user_id} />
          <button className="btn danger" onClick={(e) => { if (!confirm(`Buang akses ${a.name || a.email}?`)) e.preventDefault(); }}>Buang</button>
        </form>
      )}
      {roleState?.ok && <p className="row-msg ok">Peranan dikemas kini ✓</p>}
      {pwState?.ok && <SetupLink name={a.name || a.email} email={a.email} link={pwState.link} />}
      {msg && <p className="row-msg error" role="alert">{msg}</p>}
    </li>
  );
}

export default function Accounts({ accounts }) {
  return (
    <>
      <ul className="account-list">{accounts.map((a) => <AccountRow key={a.user_id} a={a} />)}</ul>
      <AddAccount />
    </>
  );
}
