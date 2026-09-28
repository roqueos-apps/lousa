// A porta de entrada da Lousa (o Quadro Branco do RoqueOS): o app como o app-sdk entende um app.
//
// `montar` recebe o elemento, o sistema e se a janela está ativa, cria um app Vue próprio
// dentro do elemento e devolve `{ ativar, desmontar }`. Nenhuma store, nenhum plugin e nenhum
// estilo global do RoqueOS chega aqui dentro; o que a Lousa precisa vem pelo `sistema`:
//
//   colecoes   os quadros (um documento por quadro, lido um de cada vez) e o índice deles,
//              na conta da pessoa, nos mesmos lugares de antes de a Lousa sair do RoqueOS
//   ia         o painel de IA do sistema, sobre o que está escrito no quadro
//   arquivos   guardar o quadro como .rosboard em Documentos
//   anexos     as imagens do quadro, por um id que abre em qualquer aparelho
//
// As capacidades são as mesmas do `app.json`: o teste `app.spec.js` confere que as duas
// listas batem, porque o build do RoqueOS não deixa este arquivo importar o JSON.

import { createApp, reactive } from 'vue'
import { definirApp } from '@roqueos-apps/app-sdk'
import Lousa from './Lousa.vue'
import { carregarTextos } from './textos.js'

export const CAPACIDADES = Object.freeze(['colecoes', 'ia', 'arquivos', 'anexos'])

export default definirApp({
  id: 'whiteboard',
  capacidades: [...CAPACIDADES],
  montar(el, sistema, { ativo }) {
    const estado = reactive({
      ativo,
      idioma: sistema.idioma.atual(),
      textos: null,
      leve: sistema.desempenho.modoLeve(),
    })
    let app = null
    let desmontado = false
    // Duas trocas de idioma seguidas podem voltar fora de ordem; vale a última.
    let pedido = 0

    const trocarIdioma = async (idioma) => {
      const meu = ++pedido
      const textos = await carregarTextos(idioma)
      if (desmontado || meu !== pedido) return
      estado.idioma = idioma
      estado.textos = textos
    }
    const pararIdioma = sistema.idioma.aoMudar((novo) => {
      trocarIdioma(novo).catch((erro) => console.error('[lousa] textos do idioma', novo, erro))
    })

    // O app só monta com o texto na mão: montar antes mostraria botões sem rótulo.
    trocarIdioma(estado.idioma)
      .catch((erro) => console.error('[lousa] textos do idioma', estado.idioma, erro))
      .finally(() => {
        if (desmontado) return
        app = createApp(Lousa, { sistema, estado })
        app.mount(el)
      })

    return {
      ativar(sim) {
        estado.ativo = sim
      },
      desmontar() {
        desmontado = true
        pararIdioma?.()
        app?.unmount()
        app = null
      },
    }
  },
})
