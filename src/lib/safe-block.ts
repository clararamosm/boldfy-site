/**
 * Wrapper de safety pra blocos de query em Server Components.
 *
 * Se o bloco lança exception, loga com tag identificável (vai pro Vercel
 * runtime log com `[<scope>] block "<name>" failed`) e retorna o fallback.
 *
 * Sem isso, qualquer exception não tratada propaga pro Server Component render
 * e quebra a page inteira com erro genérico "specific message omitted".
 */

export async function safeBlock<T>(
  scope: string,
  name: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[${scope}] block "${name}" failed:`, err);
    return fallback;
  }
}
