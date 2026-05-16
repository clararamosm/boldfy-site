/**
 * Root do /internal — redireciona pro dashboard por padrão.
 *
 * Se quiser mudar default pra CRM, troca aqui.
 */

import { redirect } from 'next/navigation';

export default function InternalRootPage(): never {
  redirect('/internal/dashboard');
}
