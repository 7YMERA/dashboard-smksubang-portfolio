'use client';

// MODULE Akaun (admin only): add a Pentadbir/Admin, change role, set a new password, remove access.
import { useActionState, useEffect, useState } from 'react';
import { addAccount, changeRole, removeAccount, setPassword } from '@/app/admin/actions';
import { fmtDateTime } from '../ui/format';

const ROLE = { admin: 'Admin', pentadbir: 'Pentadbir (lihat sahaja)' };

// Easy to read aloud / type on a phone: no 0/O, 1/l/I.
function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function CopyLogin({ name, email, password }) {
  const [copied, setCopied] = useState(false);
  const text = `Salam ${name}. Akaun Dashboard Data SMK Subang anda:\n${location.origin}/admin\nEmel: ${email}\nKata laluan: ${password}\n(Sila simpan dengan selamat.)`;
  return (
    <button type="button" className="btn" onClick={async () => {
      await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000);
    }}>{copied ? 'Disalin ✓' : 'Salin maklumat log masuk'}</button>
  );
}

function AddAccount() {
  const [state, action, pending] = useActionState(addAccount, undefined);
  const [pw, setPw] = useState('');
  useEffect(() => { if (state?.created) setPw(''); }, [state]); // ready for the next account
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
        <label>Kata laluan sementara
          <span className="pw-row">
            <input name="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
            <button type="button" className="btn" onClick={() => setPw(generatePassword())}>Jana</button>
          </span>
        </label>
      </div>
      <button type="submit" className="btn primary" disabled={pending}>{pending ? 'Sedang menambah…' : 'Tambah akaun'}</button>
      {state?.error && <p className="row-msg error" role="alert">{state.error}</p>}
      {state?.created && (
        <div className="account-done" role="status">
          <p>✓ Akaun <strong>{state.created.name}</strong> ({ROLE[state.created.role]}) sudah dibuat.
            Hantar maklumat log masuk kepadanya (contoh melalui WhatsApp):</p>
          <CopyLogin {...state.created} />
        </div>
      )}
    </form>
  );
}

function AccountRow({ a }) {
  const [roleState, roleAction] = useActionState(changeRole, undefined);
  const [pwState, pwAction, pwPending] = useActionState(setPassword, undefined);
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
        <input type="hidden" name="password" value="" />
        <button className="btn" disabled={pwPending} onClick={(e) => {
          if (!confirm(`Buat kata laluan baharu untuk ${a.name || a.email}? Kata laluan lama tidak akan berfungsi lagi.`)) { e.preventDefault(); return; }
          e.currentTarget.form.password.value = generatePassword();
        }}>
          Kata laluan baharu
        </button>
      </form>
      {!a.is_me && (
        <form action={delAction}>
          <input type="hidden" name="id" value={a.user_id} />
          <button className="btn danger" onClick={(e) => { if (!confirm(`Buang akses ${a.name || a.email}?`)) e.preventDefault(); }}>Buang</button>
        </form>
      )}
      {roleState?.ok && <p className="row-msg ok">Peranan dikemas kini ✓</p>}
      {pwState?.ok && (
        <div className="account-done">
          <p>Kata laluan baharu: <code>{pwState.password}</code></p>
          <CopyLogin name={a.name || ''} email={a.email} password={pwState.password} />
        </div>
      )}
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
