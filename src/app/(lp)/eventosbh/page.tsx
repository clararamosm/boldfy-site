'use client';

/**
 * /eventosbh — Landing page minimalista de PRÉ-INSCRIÇÃO pros eventos B2B
 * presenciais que a Boldfy está construindo em BH (jun/2026).
 *
 * Decisões (mesmo padrão do /agendar-demo):
 *  - Mora no route group `(lp)` (sem header/footer global — ConditionalChrome).
 *  - Standalone: logo clicável de volta pra home + form + footer.
 *  - Sem data/local definidos ainda — é lista de demonstração de interesse pra
 *    dimensionar e construir os eventos. Copy evergreen.
 *  - Captura CRM-first via `submitEventosbhLead` → adapter `adaptEventosbh`.
 *    Sempre Líder B2B; o campo `empresa` (obrigatório) é o gate.
 *  - Campos: nome*, email*, empresa* obrigatórios; zap e cargo opcionais.
 *  - noindex (LP de captura, não conteúdo público) — ver metadata no layout.
 */

import { useState } from 'react';
import Link from 'next/link';
import { LogoFull } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { submitEventosbhLead } from '@/app/actions/eventosbh-leads';
import { useUtmParams } from '@/hooks/use-utm-params';
import { captureSubmissionMeta } from '@/lib/source-detection';
import { trackEvent } from '@/lib/track';

export default function EventosBhPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState('');

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const utms = useUtmParams();

  const canSubmit =
    nome.trim().length > 0 && email.trim().length > 0 && empresa.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSending(true);

    trackEvent('form_submit_start', { form_type: 'eventosbh', source: 'eventosbh-page' });

    const result = await submitEventosbhLead({
      nome,
      email,
      empresa,
      telefone,
      cargo,
      origem: 'LP Eventos BH',
      ...utms,
      ...captureSubmissionMeta(),
    });

    if (result.success) {
      setSent(true);
      trackEvent('form_submit_success', { form_type: 'eventosbh', source: 'eventosbh-page' });
    } else {
      const msg = result.error || 'Algo deu errado. Tenta de novo em instantes.';
      setError(msg);
      trackEvent('form_submit_error', { form_type: 'eventosbh', error_message: msg });
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      {/* Header minimal — só logo clicável de volta pra home */}
      <header className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          <Link href="/" aria-label="Voltar pra boldfy.com.br">
            <LogoFull height={28} />
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12 max-w-3xl w-full">
        <div className="mb-8 text-center sm:text-left">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Eventos B2B · Belo Horizonte
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Vamos movimentar a cena B2B de BH
          </h1>
          <p className="mt-3 text-base text-gray-600">
            SP e RJ têm roda de conversa, palestra e evento de networking o ano
            inteiro. BH, quase nada, mesmo sendo casa de empresas B2B que viraram
            referência nacional e global. A Boldfy está construindo um espaço pra
            mudar isso: eventos e conversas de alto nível sobre o futuro do
            marketing, com quem realmente faz acontecer.
          </p>
          <p className="mt-4 text-base text-gray-600">
            Ainda não tem data nem local fechados, é daqui que a gente começa a
            construir. Deixa seu interesse e você fica sabendo em primeira mão.
          </p>
          <p className="mt-4 text-sm font-medium text-gray-700">
            É pra você se:
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              É de BH ou região
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              Lidera marketing em uma empresa B2B
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              Se anima com a ideia de construir isso junto
            </li>
          </ul>
        </div>

        <div className="rounded-xl border bg-white p-6 sm:p-8 shadow-sm">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <h2 className="text-xl font-bold text-gray-900">Interesse registrado 💜</h2>
              <p className="max-w-md text-sm text-gray-600">
                Você está na lista. Assim que a gente tiver os primeiros eventos
                de BH desenhados, te chamo em primeira mão. Bora construir isso
                junto.
              </p>
              <Link
                href="/"
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                Conhecer a Boldfy
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-500">
                Esses eventos são pensados pra líderes B2B. Por isso o nome da
                empresa é obrigatório.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com.br"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="empresa">Empresa *</Label>
                <Input
                  id="empresa"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Onde você lidera marketing"
                  autoComplete="organization"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="telefone">WhatsApp</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(31) 9 0000-0000"
                    autoComplete="tel"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ex: Head de Marketing"
                    autoComplete="organization-title"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={sending || !canSubmit}
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  'Quero participar'
                )}
              </Button>

              <p className="text-center text-xs text-gray-400">
                Sem spam. Só te chamo quando tiver evento de verdade pra te
                contar.
              </p>
            </form>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-4 max-w-3xl text-center sm:text-left">
          <Link
            href="/"
            className="text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            ← Voltar pra boldfy.com.br
          </Link>
        </div>
      </footer>
    </div>
  );
}
