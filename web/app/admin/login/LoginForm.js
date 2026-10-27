'use client';

import { useActionState } from 'react';
import { login } from '../actions';

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="login">
      <label>
        Emel
        <input name="email" type="email" autoComplete="username" required defaultValue={state?.email} />
      </label>
      <label>
        Kata laluan
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? 'Sedang log masuk…' : 'Log masuk'}
      </button>
    </form>
  );
}
