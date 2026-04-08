import type { Metadata } from 'next';
import TermosClient from './termos-client';

export const metadata: Metadata = {
  title: 'Termos de Uso — Boldfy',
  description:
    'Termos de Uso da Boldfy. Conheça as condições de uso da nossa plataforma de Content Intelligence para Employee-Led Growth.',
};

export default function TermosPage() {
  return <TermosClient />;
}
