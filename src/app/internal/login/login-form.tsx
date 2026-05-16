'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/app/internal/actions/auth';

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<LoginState | null, FormData>(
    login,
    null,
  );

  return (
    <form action={formAction} className="login-form">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <label htmlFor="password" className="login-label">Senha</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        className="login-input"
        aria-invalid={state?.error ? 'true' : undefined}
        aria-describedby={state?.error ? 'login-error' : undefined}
      />

      {state?.error ? (
        <p id="login-error" className="login-error" role="alert">{state.error}</p>
      ) : null}

      <button type="submit" disabled={pending} className="login-btn">
        {pending ? 'Entrando…' : 'Entrar'}
      </button>

      <style>{`
        .login-form { display: flex; flex-direction: column; gap: 10px; }
        .login-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #9D85B3;
        }
        .login-input {
          padding: 11px 14px;
          border: 1px solid #E4D8ED;
          border-radius: 10px;
          font-family: inherit;
          font-size: 14px;
          color: #45336B;
          background: #FFFFFF;
          transition: border-color 0.15s ease;
        }
        .login-input:focus {
          outline: none;
          border-color: #CD50F1;
          box-shadow: 0 0 0 3px rgba(205, 80, 241, 0.12);
        }
        .login-input[aria-invalid='true'] {
          border-color: #EE5A52;
        }
        .login-error {
          color: #C0392B;
          font-size: 12px;
          margin-top: -4px;
          font-weight: 500;
        }
        .login-btn {
          margin-top: 8px;
          padding: 12px 16px;
          background: #CD50F1;
          color: white;
          border: none;
          border-radius: 10px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(205, 80, 241, 0.28);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(205, 80, 241, 0.38);
        }
        .login-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}
