/**
 * Página de login do /internal.
 *
 * Sem topbar (layout pai detecta /internal/login e omite). Centrado, minimalista.
 *
 * Senha única em DASHBOARD_PASSWORD env var. Server action valida + seta cookie.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Login interno',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <Image src="/images/boldfy-logo.svg" alt="Boldfy" width={110} height={32} priority />
        </div>
        <h1 className="login-title">Área interna</h1>
        <p className="login-subtitle">Acesso restrito.</p>
        <LoginForm next={next} />
      </div>

      <style>{`
        .login-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: radial-gradient(circle at 20% 20%, rgba(205, 80, 241, 0.06), transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(157, 133, 179, 0.05), transparent 50%),
                      #FAF7FF;
        }
        .login-card {
          background: #FFFFFF;
          border: 1px solid #E4D8ED;
          border-radius: 22px;
          padding: 36px 32px;
          width: 100%;
          max-width: 380px;
          box-shadow: 0 16px 48px rgba(93, 42, 103, 0.08);
        }
        .login-brand {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        .login-title {
          font-family: var(--font-headline);
          font-weight: 900;
          font-size: 22px;
          color: #5E2A67;
          text-align: center;
          margin-bottom: 6px;
        }
        .login-subtitle {
          color: #9D85B3;
          font-size: 13px;
          text-align: center;
          margin-bottom: 24px;
        }
      `}</style>
    </div>
  );
}
