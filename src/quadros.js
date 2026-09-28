// OS QUADROS NA CONTA, pelo sistema.
//
// Dentro do RoqueOS a Lousa falava com o Firestore direto (`persistence.js`). Fora dele ela pede
// ao sistema duas coleções, nos mesmos lugares de antes, sem migração nenhuma:
//
//   quadros  um documento por quadro, `{ name, elements, view }`, lido UM de cada vez com
//            `ler(id)`: um quadro chega perto do limite de 1 MB do banco, e observar a coleção
//            baixaria todos para mostrar um.
//   indice   o documento `whiteboards`, `{ lastBoardId, boards: [{ id, name }] }`: a lista de
//            quadros sem abrir nenhum, e qual estava aberto por último.
//
// O sistema carimba `atualizadoEm` (o `updatedAt` de antes). `atualizar` troca só os campos
// enviados, e cria o documento quando ele não existe.
//
// Erro de leitura NÃO vira lista vazia aqui: quem chama decide. Antes, uma falha de rede ao abrir
// devolvia "nenhum quadro", e a Lousa criava um quadro novo e gravava o índice só com ele, por
// cima da lista da pessoa.

import { genId } from './elements.js'

/** O id do documento do índice, o mesmo desde antes da Lousa sair do RoqueOS. */
export const ID_DO_INDICE = 'whiteboards'

/** Bytes: folga embaixo do 1 MB que o banco aceita por documento. */
export const LIMITE_DO_QUADRO = 900_000

/** Um id novo de quadro, no formato de sempre. */
export const novoIdDeQuadro = () => `wb_${genId()}`

/**
 * Tira o que não pode ir para o banco: o traço à mão livre em andamento (`_raw`) e campo
 * `undefined`, que o banco recusa.
 * @param {object[]} elementos
 */
export function limparElementos(elementos) {
  return (elementos || []).map((el) => {
    const limpo = {}
    for (const k of Object.keys(el)) {
      if (k === '_raw' || el[k] === undefined) continue
      limpo[k] = el[k]
    }
    return limpo
  })
}

/** O tamanho do que vai ser gravado, em bytes (0 se não der para medir). */
export function estimarBytes(valor) {
  try {
    return new TextEncoder().encode(JSON.stringify(valor)).length
  } catch {
    return 0
  }
}

/**
 * O acesso aos quadros de UMA sessão da Lousa.
 * @param {{ colecoes: { abrir: (nome: string) => object } }} sistema
 */
export function criarQuadros(sistema) {
  const quadros = sistema.colecoes.abrir('quadros')
  const indice = sistema.colecoes.abrir('indice')

  return Object.freeze({
    /** O índice, ou vazio quando a pessoa nunca abriu a Lousa (ou está sem conta). */
    async lerIndice() {
      const doc = await indice.ler(ID_DO_INDICE)
      return {
        lastBoardId: doc?.lastBoardId || null,
        boards: Array.isArray(doc?.boards) ? doc.boards : [],
      }
    },

    /** Um quadro, ou null quando ele não existe mais. */
    async lerQuadro(id) {
      if (!id) return null
      return quadros.ler(id)
    },

    async salvarQuadro(id, { name, elements, view }) {
      await quadros.atualizar(id, {
        name: name || 'Untitled',
        elements: limparElementos(elements),
        view: view || { zoom: 1, panX: 0, panY: 0 },
      })
    },

    async salvarIndice({ lastBoardId, boards }) {
      await indice.atualizar(ID_DO_INDICE, {
        lastBoardId: lastBoardId || null,
        boards: (boards || []).map((b) => ({ id: b.id, name: b.name || 'Untitled' })),
      })
    },

    async apagarQuadro(id) {
      await quadros.apagar(id)
    },
  })
}
