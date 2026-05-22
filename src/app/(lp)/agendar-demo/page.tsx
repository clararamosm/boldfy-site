/**
 * /agendar-demo — Landing page minimalista pra agendamento de demo.
 *
 * Decisões:
 *  - Mora no route group `(lp)` (sem header/footer global — ConditionalChrome).
 *  - Mesmo form/cal embed do popup acionado no site, via `<DemoForm />`
 *    reutilizável. Mantém comportamento idêntico ao popup.
 *  - Sem copy de venda pesada — só logo, título curto, frase de contexto,
 *    form. Pra mandar link direto pra pessoas vindo de outras origens
 *    (LinkedIn, WhatsApp, indicação).
 *  - Origem rastreada como 'LP Agendar Demo' no CRM Boldfy + AC.
 *  - noindex (LP de captura, não conteúdo público) — ver metadata em layout.
 *  - Pós-agendamento: lead vê a confirmação dentro do iframe do Cal.com
 *    e o webhook do Cal atualiza tags do AC + status no CRM Boldfy em background.
 *    Não tem redirect automático (mesmo comportamento do popup).
 */

import { LogoFull } from '@/components/logo';
import { DemoForm } from '@/components/forms/demo-form';
import Link from 'next/link';

export default function AgendarDemoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      {/* Header minimal — só logo clicável de volta pra home */}
      <header className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          <LogoFull height={28} />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12 max-w-3xl w-full">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Marque sua demo
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Uma conversa de 30 minutos pra entender como a Boldfy pode virar o
            seu time de liderança em motor de marketing B2B no LinkedIn.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 sm:p-8 shadow-sm">
          <DemoForm source="LP Agendar Demo" calHeight="700px" />
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-4 max-w-3xl text-center sm:text-left">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Voltar pra boldfy.com.br
          </Link>
        </div>
      </footer>
    </div>
  );
}
