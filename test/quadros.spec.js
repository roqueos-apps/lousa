// As peças puras dos quadros na conta: o que se limpa antes de gravar, o tamanho, o id e o
// índice vazio. O que vai para a conta em uso de verdade está no lousa.spec.js.
import { describe, it, expect } from 'vitest'
import { criarSistemaFalso } from '@roqueos-apps/app-sdk/sistema-falso'
import {
  ID_DO_INDICE,
  criarQuadros,
  estimarBytes,
  limparElementos,
  novoIdDeQuadro,
} from '../src/quadros.js'

describe('os quadros na conta: as peças', () => {
  it('limpar tira o traço em andamento e o campo undefined, e não mexe no resto', () => {
    const els = [
      { id: 'a', type: 'pencil', points: [0, 0, 1, 1], _raw: [{ x: 0, y: 0 }], fill: undefined },
      { id: 'b', type: 'rectangle', fill: null, text: '' },
    ]
    expect(limparElementos(els)).toEqual([
      { id: 'a', type: 'pencil', points: [0, 0, 1, 1] },
      { id: 'b', type: 'rectangle', fill: null, text: '' },
    ])
    // O original fica como estava: o motor continua desenhando com ele.
    expect(els[0]._raw).toHaveLength(1)
    expect(limparElementos(undefined)).toEqual([])
  })

  it('o tamanho é o do JSON em bytes UTF-8, e o que não vira JSON conta zero', () => {
    expect(estimarBytes({ a: 'é' })).toBe(10)
    const circular = {}
    circular.eu = circular
    expect(estimarBytes(circular)).toBe(0)
  })

  it('o id do quadro é o de sempre, e o do índice também', () => {
    expect(novoIdDeQuadro()).toMatch(/^wb_el_[a-z0-9]+_\d+_[a-z0-9]+$/)
    expect(novoIdDeQuadro()).not.toBe(novoIdDeQuadro())
    expect(ID_DO_INDICE).toBe('whiteboards')
  })

  it('sem índice (ou sem conta), a lista é vazia, e o quadro que não existe é null', async () => {
    const { sistema } = criarSistemaFalso({ colecoes: ['quadros', 'indice'] })
    const q = criarQuadros(sistema)
    expect(await q.lerIndice()).toEqual({ lastBoardId: null, boards: [] })
    expect(await q.lerQuadro('wb_x')).toBeNull()
    expect(await q.lerQuadro('')).toBeNull()
  })

  it('o quadro sem nome grava como Untitled, e a vista padrão vai junto', async () => {
    const f = criarSistemaFalso({
      identidade: { uid: 'ana', nome: 'Ana' },
      colecoes: ['quadros', 'indice'],
    })
    const q = criarQuadros(f.sistema)
    await q.salvarQuadro('wb_a', { name: '', elements: [] })
    const [salvo] = f.colecoes.guardado('quadros', 'ana')
    expect([salvo.name, salvo.view]).toEqual(['Untitled', { zoom: 1, panX: 0, panY: 0 }])
  })
})
