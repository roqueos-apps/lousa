// Os textos da Lousa, um JSON por idioma em `i18n/`, carregados quando o app monta.
// A Lousa não usa o vue-i18n do RoqueOS: ele roda num app Vue próprio, e fora do RoqueOS (no
// `yarn dev` do repo) não existe i18n de sistema nenhum.
//
// O mapa é ESTÁTICO de propósito: `import(variável)` faz o Vite desistir de recortar e
// empacotar os dez idiomas juntos, em silêncio. Assim o navegador baixa um pedaço, o da
// pessoa.
//
// ⚠️ O JSON vem como TEXTO (`?raw`) e vira objeto no `JSON.parse`, e não por `import` de
// JSON direto: o build do RoqueOS quebra em import de JSON fora de `src/i18n/` (o plugin do
// vue-i18n embrulha o transform do `vite:json`). Medido nos jogos em 25/09/2026; o `?raw`
// passa por fora do embrulho e funciona igual no RoqueOS e no Vite do repo.

export const IDIOMA_CANONICO = 'pt-BR'

const CARREGADORES = {
  'pt-BR': () => import('../i18n/pt-BR.json?raw'),
  'en-US': () => import('../i18n/en-US.json?raw'),
  'es-ES': () => import('../i18n/es-ES.json?raw'),
  'fr-FR': () => import('../i18n/fr-FR.json?raw'),
  'de-DE': () => import('../i18n/de-DE.json?raw'),
  'ja-JP': () => import('../i18n/ja-JP.json?raw'),
  'zh-CN': () => import('../i18n/zh-CN.json?raw'),
  'hi-IN': () => import('../i18n/hi-IN.json?raw'),
  'ru-RU': () => import('../i18n/ru-RU.json?raw'),
  'ar-AR': () => import('../i18n/ar-AR.json?raw'),
}

export const IDIOMAS_COM_TEXTO = Object.freeze(Object.keys(CARREGADORES))

/**
 * @param {string} idioma um dos dez; outro cai no canônico
 * @returns {Promise<Record<string, string>>}
 */
export async function carregarTextos(idioma) {
  const carregar = CARREGADORES[idioma] ?? CARREGADORES[IDIOMA_CANONICO]
  const modulo = await carregar()
  return JSON.parse(modulo.default)
}

/**
 * Traduz uma chave. Sem textos carregados devolve vazio (a tela fica sem rótulo por um
 * instante, em vez de mostrar o caminho da chave); com textos e sem a chave devolve a chave,
 * que é defeito de programação e o teste pega.
 * @param {Record<string, string> | null} textos
 * @param {string} chave
 */
export function traduzir(textos, chave) {
  if (!textos) return ''
  const bruto = textos[chave]
  return typeof bruto === 'string' ? bruto : chave
}
