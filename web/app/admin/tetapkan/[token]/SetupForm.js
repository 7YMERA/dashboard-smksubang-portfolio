'use client';

import { useActionState, useState } from 'react';
import { completeSetup } from '../../actions';

export default function SetupForm({ token, email }) {
  const [state, action, pending] = useActionState(completeSetup, undefined);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="login">
      <input type="hidden" name="token" value={token} />
      {/* Lets the phone's password manager save the email with the new password. */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <label>Kata laluan baharu
        <input name="password" type={show ? 'text' : 'password'} autoComplete="new-password" minLength={8} required />
      </label>
      <label>Taip sekali lagi
        <input name="confirm" type={show ? 'text' : 'password'} autoComplete="new-password" minLength={8} required />
      </label>
      <label className="check"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Tunjukkan kata laluan</label>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <button type="submit" className="btn primary" disabled={pending}>{pending ? 'Sedang menyimpan…' : 'Simpan dan masuk'}</button>
    </form>
  );
}
