'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sendContactLeadToNotion } from '@/app/actions/contact-leads';
import { Mail, MessageSquare, CalendarDays, Send, CheckCircle, AlertCircle } from 'lucide-react';

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function ContatoPage() {
  const t = useT();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [collaboratorRange, setCollaboratorRange] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check — bots fill hidden fields
    const honeypot = formData.get('website') as string;
    if (honeypot) {
      // Silently "succeed" to not alert the bot
      setSubmitting(false);
      setSubmitted(true);
      return;
    }

    const result = await sendContactLeadToNotion({
      nome: formData.get('name') as string,
      email: formData.get('email') as string,
      telefone: (formData.get('phone') as string) || undefined,
      empresa: formData.get('company') as string,
      colaboradores: collaboratorRange || undefined,
      mensagem: (formData.get('message') as string) || undefined,
    });

    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error || 'Erro ao enviar. Tente novamente.');
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h1 className="font-headline text-3xl md:text-5xl font-black text-accent-foreground leading-tight mb-4">
              {t.contato.heroTitle}
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto">
              {t.contato.heroSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-foreground">{t.contato.formSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">{t.contato.formName} {t.contato.formRequired}</Label>
                      <Input id="name" name="name" required className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="email">{t.contato.formEmail} {t.contato.formRequired}</Label>
                      <Input id="email" name="email" type="email" required className="mt-1.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">{t.contato.formPhone} {t.contato.formOptional}</Label>
                      <Input id="phone" name="phone" className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="company">{t.contato.formCompany} {t.contato.formRequired}</Label>
                      <Input id="company" name="company" required className="mt-1.5" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="collaborators">{t.contato.formCollaborators}</Label>
                    <select
                      id="collaborators"
                      name="collaborators"
                      value={collaboratorRange}
                      onChange={(e) => setCollaboratorRange(e.target.value)}
                      className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">—</option>
                      {t.contato.selectCollaborators.map((opt: { value: string; label: string }) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="message">{t.contato.formMessage} {t.contato.formOptional}</Label>
                    <Textarea id="message" name="message" rows={4} className="mt-1.5" />
                  </div>

                  {/* Honeypot — hidden from real users, catches bots */}
                  <div className="hidden" aria-hidden="true">
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full font-bold" disabled={submitting}>
                    {submitting ? (
                      t.contato.formSubmitting
                    ) : (
                      <>
                        {t.contato.formSubmit}
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Side panel */}
            <div className="lg:col-span-2 space-y-8">
              {/* Calendar */}
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">{t.contato.calendarTitle}</h3>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer">
                    {t.contato.calendarCta}
                  </a>
                </Button>
              </div>

              {/* Other channels */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-base font-bold text-foreground mb-4">{t.contato.otherChannelsTitle}</h3>
                <div className="space-y-4">
                  <a href="mailto:clara@boldfy.com.br" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>{t.contato.emailLabel}: clara@boldfy.com.br</span>
                  </a>
                  <a href="https://linkedin.com/company/boldfy-branding" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <LinkedInIcon className="h-4 w-4 text-primary" />
                    <span>{t.contato.linkedinLabel}: /company/boldfy-branding</span>
                  </a>
                  <a href="https://wa.me/5511913688100" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span>{t.contato.whatsappLabel}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
