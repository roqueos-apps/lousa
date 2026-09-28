// O que o jsdom não tem e a Lousa usa. No navegador ela recebe o de verdade; aqui
// bastam versões que não fazem nada, porque os testes não dependem do tamanho da tela nem
// de mídia.
import { afterEach } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  })
}

// Todo componente montado num teste é desmontado no fim dele: o que fica vivo continua
// com listener e timer, e roda depois que o ambiente de teste já foi desmontado.
enableAutoUnmount(afterEach)
