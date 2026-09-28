// O motor da Lousa (useLousa) contra o sistema falso do app-sdk: a máquina de ponteiro, o texto
// e o post-it, a caixa de seleção, o que vai para a conta (e quando não vai), as imagens como
// anexo, a troca de conta e a exportação.
//
// Os blocos da máquina de ponteiro, do texto e da caixa de seleção vieram do spec do RoqueOS
// (`useWhiteboard.spec.js`) sem mudança: a lógica é a mesma. O que mudou foi por baixo: no lugar
// do Firestore e do fileStorage de mentira, o sistema falso, que tem a semântica do sistema do
// RoqueOS (a coleção fora do mapa não abre, o anexo de outro app não existe, sem conta rejeita).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { defineComponent } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { criarSistemaFalso, criarBancoDeAnexos } from '@roqueos-apps/app-sdk/sistema-falso'
import { TAMANHO_MAXIMO_DE_ANEXO } from '@roqueos-apps/app-sdk'
import { useLousa, blobDaDataUrl, TIPO_DO_ROSBOARD } from '../src/useLousa.js'
import { ID_DO_INDICE, LIMITE_DO_QUADRO } from '../src/quadros.js'

const ANA = { uid: 'user-1', nome: 'Ana' }
const t = (k) => k
let urls = 0

/** Um sistema falso com as duas coleções da Lousa, na conta da Ana. */
const sistemaFalso = (opcoes = {}) =>
  criarSistemaFalso({
    appId: 'whiteboard',
    identidade: ANA,
    colecoes: ['quadros', 'indice'],
    ...opcoes,
  })

function montarMotor(f = sistemaFalso(), extra = {}) {
  const Harness = defineComponent({
    setup(_, { expose }) {
      const e = useLousa({
        sistema: f.sistema,
        t,
        criarUrl: () => `blob:local-${++urls}`,
        soltarUrl: vi.fn(),
        ...extra,
      })
      expose({ e })
      return () => null
    },
  })
  const w = mount(Harness)
  return Object.assign(w.vm.e, { f, w })
}
const mountEngine = () => montarMotor()

const RECT_RECT = { left: 0, top: 0, width: 1000, height: 800 }

/** A coleção `nome` do sistema falso com o `ler` trocado (a rede que cai no meio). */
function lerComFalha(f, nome, falha) {
  const abrirDeVerdade = f.sistema.colecoes.abrir
  f.sistema.colecoes.abrir = (qual) => {
    const c = abrirDeVerdade(qual)
    return qual === nome
      ? { ...c, ler: (id) => (falha(id) ? Promise.reject(new Error('sem rede')) : c.ler(id)) }
      : c
  }
}

/** A Ana com dois quadros, A (aberto) e B. */
function doisQuadros(f) {
  const retB = { id: 'rb', type: 'rectangle', x: 5, y: 5, w: 5, h: 5, angle: 0 }
  f.colecoes.semear('indice', 'user-1', [
    {
      id: ID_DO_INDICE,
      lastBoardId: 'wb_a',
      boards: [
        { id: 'wb_a', name: 'A' },
        { id: 'wb_b', name: 'B' },
      ],
    },
  ])
  f.colecoes.semear('quadros', 'user-1', [
    { id: 'wb_a', name: 'A', elements: [] },
    { id: 'wb_b', name: 'B', elements: [retB] },
  ])
  return retB
}

const guardadosPorId = (f) =>
  Object.fromEntries(f.colecoes.guardado('quadros', 'user-1').map((q) => [q.id, q]))

afterEach(() => {
  delete window.__ROS_E2E__
  vi.useRealTimers()
})

const desenharRetangulo = (e, x1, y1, x2, y2) => {
  e.setTool('rectangle')
  e.beginPointer({ x: x1, y: y1 }, { x: x1, y: y1 }, {})
  e.movePointer({ x: x2, y: y2 }, { x: x2, y: y2 })
  e.endPointer()
  e.setTool('select')
  return e.elements.value[e.elements.value.length - 1]
}

describe('a Lousa: a máquina de ponteiro', () => {
  it('draws a shape via the pointer machine', () => {
    const e = mountEngine()
    e.setTool('rectangle')
    e.beginPointer({ x: 0, y: 0 }, { x: 0, y: 0 }, {})
    e.movePointer({ x: 120, y: 90 }, { x: 120, y: 90 })
    e.endPointer()
    expect(e.elements.value).toHaveLength(1)
    expect(e.elements.value[0].type).toBe('rectangle')
    expect(e.canUndo.value).toBe(true)
  })

  it('selects then moves an element, recording history', () => {
    const e = mountEngine()
    e.setTool('rectangle')
    e.beginPointer({ x: 10, y: 10 }, { x: 10, y: 10 }, {})
    e.movePointer({ x: 110, y: 110 }, { x: 110, y: 110 })
    e.endPointer()
    const el = e.elements.value[0]
    const x0 = el.x

    e.setTool('select')
    e.beginPointer({ x: 50, y: 50 }, { x: 50, y: 50 }, {})
    expect(e.selectedIds.value).toContain(el.id)
    e.movePointer({ x: 90, y: 50 }, { x: 90, y: 50 })
    e.endPointer()
    expect(e.elements.value[0].x).toBeCloseTo(x0 + 40, 4)
  })

  it('copy / paste duplicates the selection with an offset', () => {
    const e = mountEngine()
    e.setTool('rectangle')
    e.beginPointer({ x: 0, y: 0 }, { x: 0, y: 0 }, {})
    e.movePointer({ x: 50, y: 50 }, { x: 50, y: 50 })
    e.endPointer()
    e.setTool('select')
    e.selectAll()
    e.copySelection()
    e.paste()
    expect(e.elements.value).toHaveLength(2)
    expect(e.elements.value[1].x).toBeCloseTo(e.elements.value[0].x + 24, 4)
  })

  it('deleteSelection removes selected elements', () => {
    const e = mountEngine()
    e.setTool('rectangle')
    e.beginPointer({ x: 0, y: 0 }, { x: 0, y: 0 }, {})
    e.movePointer({ x: 50, y: 50 }, { x: 50, y: 50 })
    e.endPointer()
    e.selectAll()
    e.deleteSelection()
    expect(e.elements.value).toHaveLength(0)
  })

  it('creates a sticky note from the sticky tool', () => {
    const e = mountEngine()
    e.setTool('sticky')
    e.beginPointer({ x: 200, y: 200 }, { x: 200, y: 200 }, {})
    const sticky = e.elements.value.find((el) => el.type === 'sticky')
    expect(sticky).toBeTruthy()
    expect(e.editing.value?.id).toBe(sticky.id)
  })

  it('zoom helpers stay within bounds', () => {
    const e = mountEngine()
    e.resetView()
    expect(e.zoom.value).toBe(1)
    for (let i = 0; i < 40; i++) e.zoomIn()
    expect(e.zoom.value).toBeLessThanOrEqual(8)
    for (let i = 0; i < 80; i++) e.zoomOut()
    expect(e.zoom.value).toBeGreaterThanOrEqual(0.1)
  })

  it('screenToWorld maps screen coords through pan/zoom', () => {
    const e = mountEngine()
    e.resetView()
    e.zoom.value = 2
    e.pan.x = 100
    e.pan.y = 50
    expect(e.screenToWorld(300, 250, RECT_RECT)).toEqual({ x: 100, y: 100 })
  })
})

describe('a Lousa: os quadros na conta', () => {
  it('sem índice, cria um quadro e grava o quadro e o índice', async () => {
    const e = mountEngine()
    await e.loadBoards()
    await flushPromises()
    expect(e.loading.value).toBe(false)
    const [quadro] = e.f.colecoes.guardado('quadros', 'user-1')
    expect([quadro.id, quadro.name, quadro.elements]).toEqual([
      e.currentBoardId.value,
      'untitled',
      [],
    ])
    expect(e.currentBoardId.value).toMatch(/^wb_el_/)
    const [indice] = e.f.colecoes.guardado('indice', 'user-1')
    expect([indice.id, indice.lastBoardId, indice.boards]).toEqual([
      ID_DO_INDICE,
      quadro.id,
      [{ id: quadro.id, name: 'untitled' }],
    ])
  })

  it('com índice, abre o último quadro, e só ele é lido', async () => {
    const f = sistemaFalso()
    f.colecoes.semear('indice', 'user-1', [
      {
        id: ID_DO_INDICE,
        lastBoardId: 'wb_b',
        boards: [
          { id: 'wb_a', name: 'A' },
          { id: 'wb_b', name: 'B' },
        ],
      },
    ])
    f.colecoes.semear('quadros', 'user-1', [
      { id: 'wb_a', name: 'A', elements: [] },
      {
        id: 'wb_b',
        name: 'B',
        elements: [{ id: 'r', type: 'rectangle', x: 1, y: 2, w: 3, h: 4, angle: 0 }],
        view: { zoom: 2, panX: 10, panY: 20 },
      },
    ])
    const e = montarMotor(f)
    await e.loadBoards()
    await flushPromises()
    expect([
      e.currentBoardId.value,
      e.boardName.value,
      e.elements.value.map((el) => el.id),
    ]).toEqual(['wb_b', 'B', ['r']])
    expect([e.zoom.value, e.pan.x, e.pan.y]).toEqual([2, 10, 20])
    expect(e.boards.value.map((b) => b.id)).toEqual(['wb_a', 'wb_b'])
  })

  it('o último quadro que sumiu do índice cai no primeiro da lista', async () => {
    const f = sistemaFalso()
    f.colecoes.semear('indice', 'user-1', [
      { id: ID_DO_INDICE, lastBoardId: 'wb_x', boards: [{ id: 'wb_a', name: 'A' }] },
    ])
    f.colecoes.semear('quadros', 'user-1', [{ id: 'wb_a', name: 'A', elements: [] }])
    const e = montarMotor(f)
    await e.loadBoards()
    expect(e.currentBoardId.value).toBe('wb_a')
  })

  it('falha ao ler o índice mostra o erro e NÃO cria um quadro por cima da lista', async () => {
    const f = sistemaFalso()
    const abrirDeVerdade = f.sistema.colecoes.abrir
    f.sistema.colecoes.abrir = (nome) => {
      const c = abrirDeVerdade(nome)
      return nome === 'indice'
        ? { ...c, ler: async () => Promise.reject(new Error('sem rede')) }
        : c
    }
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    const e = montarMotor(f)
    await e.loadBoards()
    expect([e.error.value, e.loading.value]).toEqual(['load', false])
    expect(erro.mock.calls[0][0]).toBe('[lousa] abrir os quadros')
    erro.mockRestore()
    expect(f.colecoes.guardado('quadros', 'user-1')).toEqual([])
    expect(f.colecoes.guardado('indice', 'user-1')).toEqual([])
  })

  it('o desenho vai para a conta depois do atraso', async () => {
    vi.useFakeTimers()
    const e = mountEngine()
    await e.loadBoards()
    await flushPromises()
    e.setTool('pencil')
    e.beginPointer({ x: 0, y: 0 }, { x: 0, y: 0 }, {})
    e.movePointer({ x: 10, y: 10 }, { x: 10, y: 10 })
    e.movePointer({ x: 20, y: 5 }, { x: 20, y: 5 })
    e.endPointer()
    expect(e.f.colecoes.guardado('quadros', 'user-1')[0].elements).toEqual([])
    vi.advanceTimersByTime(900)
    await flushPromises()
    const [quadro] = e.f.colecoes.guardado('quadros', 'user-1')
    expect(quadro.elements.map((el) => el.type)).toEqual(['pencil'])
    expect(quadro.elements[0]._raw).toBeUndefined()
  })

  it('convidado: o quadro fica na memória, e nada vai para a conta', async () => {
    vi.useFakeTimers()
    const f = sistemaFalso({ identidade: { uid: null, nome: null } })
    const e = montarMotor(f)
    await e.loadBoards()
    await flushPromises()
    desenharRetangulo(e, 0, 0, 50, 50)
    vi.advanceTimersByTime(900)
    await flushPromises()
    expect(e.currentBoardId.value).toBe('local')
    expect(e.elements.value).toHaveLength(1)
    expect(f.colecoes.guardado('quadros', 'user-1')).toEqual([])
  })

  it('convidado que entra na conta leva o desenho: vira um quadro novo, com a imagem como anexo', async () => {
    const banco = criarBancoDeAnexos()
    const f = sistemaFalso({ identidade: { uid: null, nome: null }, bancoDeAnexos: banco })
    const retX = { id: 'rx', type: 'rectangle', x: 1, y: 1, w: 1, h: 1, angle: 0 }
    f.colecoes.semear('indice', 'user-1', [
      { id: ID_DO_INDICE, lastBoardId: 'wb_x', boards: [{ id: 'wb_x', name: 'X' }] },
    ])
    f.colecoes.semear('quadros', 'user-1', [{ id: 'wb_x', name: 'X', elements: [retX] }])
    const e = montarMotor(f)
    await e.loadBoards()
    desenharRetangulo(e, 0, 0, 50, 50)
    e.elements.value.push({
      id: 'img',
      type: 'image',
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      angle: 0,
      src: 'data:image/png;base64,cHg=',
    })
    f.mudarIdentidade(ANA)
    await vi.waitFor(() => expect(f.colecoes.guardado('quadros', 'user-1')).toHaveLength(2))
    await vi.waitFor(() =>
      expect(f.registro.avisos.at(-1)).toMatchObject({ titulo: 'notifyGuestSavedTitle' }),
    )
    const quadros = guardadosPorId(f)
    const novo = Object.values(quadros).find((q) => q.id !== 'wb_x')
    expect(novo.elements.map((el) => el.type)).toEqual(['rectangle', 'image'])
    const img = novo.elements[1]
    expect([img.src, /^anx_[a-z2-7]{24}$/.test(img.anexo)]).toEqual(['', true])
    expect(f.anexos.guardados()).toEqual([img.anexo])
    expect(e.currentBoardId.value).toBe(novo.id)
    expect(e.srcDaImagem(e.elements.value[1])).toMatch(/^blob:local-/)
    // O quadro que já era da conta não é tocado.
    expect(quadros.wb_x.elements).toEqual([retX])
    const [indice] = f.colecoes.guardado('indice', 'user-1')
    expect([indice.lastBoardId, indice.boards.map((b) => b.id)]).toEqual([
      novo.id,
      ['wb_x', novo.id],
    ])
  })

  it('o desenho do convidado espera: se os quadros da conta não abrem, vai na próxima abertura', async () => {
    const f = sistemaFalso({ identidade: { uid: null, nome: null } })
    let semRede = true
    lerComFalha(f, 'indice', () => semRede)
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    const e = montarMotor(f)
    await e.loadBoards()
    desenharRetangulo(e, 0, 0, 50, 50)
    f.mudarIdentidade(ANA)
    await vi.waitFor(() => expect(e.error.value).toBe('load'))
    expect(f.colecoes.guardado('quadros', 'user-1')).toEqual([])
    semRede = false
    await e.loadBoards()
    await flushPromises()
    // Sem índice, a conta ganha o quadro vazio de sempre, e o desenho vira o segundo.
    const quadros = f.colecoes.guardado('quadros', 'user-1')
    expect(quadros.map((q) => q.elements.map((el) => el.type))).toEqual([[], ['rectangle']])
    expect(e.elements.value.map((el) => el.type)).toEqual(['rectangle'])
    erro.mockRestore()
  })

  it('o desenho do convidado não se perde se gravar o quadro novo falhar: vai na próxima', async () => {
    const f = sistemaFalso({ identidade: { uid: null, nome: null } })
    // A conta tem um quadro, que abre (a leitura passa); o que cai é gravar o quadro novo.
    f.colecoes.semear('indice', 'user-1', [
      { id: ID_DO_INDICE, lastBoardId: 'wb_x', boards: [{ id: 'wb_x', name: 'X' }] },
    ])
    f.colecoes.semear('quadros', 'user-1', [{ id: 'wb_x', name: 'X', elements: [] }])
    let semRede = true
    const abrirDeVerdade = f.sistema.colecoes.abrir
    f.sistema.colecoes.abrir = (qual) => {
      const c = abrirDeVerdade(qual)
      if (qual !== 'quadros') return c
      const cair = (fn) => (id, campos) =>
        semRede ? Promise.reject(new Error('sem rede')) : fn(id, campos)
      return { ...c, criar: cair(c.criar), atualizar: cair(c.atualizar) }
    }
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    const e = montarMotor(f)
    await e.loadBoards()
    desenharRetangulo(e, 0, 0, 50, 50)
    f.mudarIdentidade(ANA)
    await vi.waitFor(() => expect(e.error.value).toBe('load'))
    semRede = false
    await e.loadBoards()
    await flushPromises()
    const tipos = f.colecoes
      .guardado('quadros', 'user-1')
      .map((q) => q.elements.map((el) => el.type))
    expect(tipos).toContainEqual(['rectangle'])
    erro.mockRestore()
  })

  it('quem sai da conta não leva o quadro da conta para o convidado', async () => {
    const f = sistemaFalso()
    const e = montarMotor(f)
    await e.loadBoards()
    desenharRetangulo(e, 0, 0, 50, 50)
    await e.flushSave()
    f.mudarIdentidade({ uid: null, nome: null })
    await vi.waitFor(() => expect(e.currentBoardId.value).toBe('local'))
    expect(e.elements.value).toEqual([])
    f.mudarIdentidade({ uid: 'bia', nome: 'Bia' })
    await vi.waitFor(() => expect(f.colecoes.guardado('quadros', 'bia')).toHaveLength(1))
    await flushPromises()
    expect(f.colecoes.guardado('quadros', 'bia')[0].elements).toEqual([])
  })

  it('trocar para um quadro que não abre deixa o aberto como estava, e nada grava por cima', async () => {
    vi.useFakeTimers()
    const f = sistemaFalso()
    const retB = doisQuadros(f)
    let semRede = true
    lerComFalha(f, 'quadros', (id) => semRede && id === 'wb_b')
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    const e = montarMotor(f)
    await e.loadBoards()
    await flushPromises()
    expect(await e.switchBoard('wb_b')).toBe(false)
    expect([e.currentBoardId.value, e.boardName.value]).toEqual(['wb_a', 'A'])
    expect(f.registro.avisos.at(-1)).toEqual({
      mensagem: 'notifyOpenErrorMsg',
      tipo: 'erro',
      fixo: false,
      titulo: 'notifyOpenErrorTitle',
    })
    desenharRetangulo(e, 0, 0, 50, 50)
    vi.advanceTimersByTime(900)
    await flushPromises()
    const quadros = guardadosPorId(f)
    expect(quadros.wb_b.elements).toEqual([retB])
    expect(quadros.wb_a.elements.map((el) => el.type)).toEqual(['rectangle'])
    // A rede voltou: a mesma troca abre o B.
    semRede = false
    expect(await e.switchBoard('wb_b')).toBe(true)
    expect(e.elements.value.map((el) => el.id)).toEqual(['rb'])
    erro.mockRestore()
  })

  it('apagar o aberto quando o próximo não abre mostra a tela de erro, e o tentar de novo abre', async () => {
    const f = sistemaFalso()
    doisQuadros(f)
    let semRede = true
    lerComFalha(f, 'quadros', (id) => semRede && id === 'wb_b')
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    const e = montarMotor(f)
    await e.loadBoards()
    await e.deleteBoard('wb_a')
    expect(e.error.value).toBe('load')
    expect(f.colecoes.guardado('quadros', 'user-1').map((q) => q.id)).toEqual(['wb_b'])
    semRede = false
    await e.loadBoards()
    expect([e.error.value, e.currentBoardId.value]).toEqual([null, 'wb_b'])
    erro.mockRestore()
  })

  it('no E2E, a semente do harness é o quadro, e nada vai para a conta', async () => {
    window.__ROS_E2E__ = {
      whiteboard: [{ id: 'r', type: 'rectangle', x: 0, y: 0, w: 50, h: 50, angle: 0 }],
    }
    const e = mountEngine()
    await e.loadBoards()
    await flushPromises()
    expect([e.currentBoardId.value, e.elements.value.map((el) => el.id)]).toEqual(['e2e', ['r']])
    await e.flushSave()
    expect(e.f.colecoes.guardado('quadros', 'user-1')).toEqual([])
    expect(e.f.colecoes.guardado('indice', 'user-1')).toEqual([])
  })

  it('criar, renomear, trocar e apagar quadros mantém o índice em dia', async () => {
    const e = mountEngine()
    await e.loadBoards()
    const primeiro = e.currentBoardId.value
    await e.createBoard('Segundo')
    const segundo = e.currentBoardId.value
    expect(e.f.registro.avisos.at(-1)).toEqual({
      mensagem: 'Segundo',
      tipo: 'sucesso',
      fixo: false,
      titulo: 'notifyBoardCreatedTitle',
    })
    await e.renameBoard(segundo, 'Plano')
    await e.switchBoard(primeiro)
    let [indice] = e.f.colecoes.guardado('indice', 'user-1')
    expect([indice.lastBoardId, indice.boards.map((b) => b.name)]).toEqual([
      primeiro,
      ['untitled', 'Plano'],
    ])
    await e.deleteBoard(primeiro)
    ;[indice] = e.f.colecoes.guardado('indice', 'user-1')
    expect([e.currentBoardId.value, indice.lastBoardId, indice.boards.map((b) => b.id)]).toEqual([
      segundo,
      segundo,
      [segundo],
    ])
    expect(e.f.colecoes.guardado('quadros', 'user-1').map((q) => q.id)).toEqual([segundo])
  })

  it('a conta trocou com a Lousa aberta: o que esperava não vai para a nova, e os quadros dela abrem', async () => {
    vi.useFakeTimers()
    const f = sistemaFalso()
    f.colecoes.semear('indice', 'bia', [
      { id: ID_DO_INDICE, lastBoardId: 'wb_bia', boards: [{ id: 'wb_bia', name: 'Da Bia' }] },
    ])
    f.colecoes.semear('quadros', 'bia', [{ id: 'wb_bia', name: 'Da Bia', elements: [] }])
    const e = montarMotor(f)
    await e.loadBoards()
    await flushPromises()
    const daAna = e.currentBoardId.value
    desenharRetangulo(e, 0, 0, 50, 50) // agenda a gravação na conta da Ana
    f.mudarIdentidade({ uid: 'bia', nome: 'Bia' })
    // O atraso vence ANTES de os quadros da Bia chegarem: sem cancelar, o quadro da Ana seria
    // gravado na conta da Bia, com o desenho da Ana.
    vi.advanceTimersByTime(900)
    await flushPromises()
    expect(f.colecoes.guardado('quadros', 'bia').map((q) => q.id)).toEqual(['wb_bia'])
    expect(f.colecoes.guardado('quadros', 'user-1').find((q) => q.id === daAna).elements).toEqual(
      [],
    )
    expect([e.boardName.value, e.elements.value]).toEqual(['Da Bia', []])
    expect(f.colecoes.guardado('quadros', 'bia')[0].elements).toEqual([])
  })
})
// ─────────────────────────────────────────────────────────────────────────────
// O QUE A MÁQUINA DE PONTEIRO PROMETE
//
// ⚠️ A varredura de mutação achou aqui os defeitos mais caros da rodada:
// `el.type === 'text' && !texto.trim()` virando `||` APAGA o texto que tem
// conteúdo e apaga o post-it vazio que a própria linha de cima jura preservar.
// Nada na suíte afirmava isso -- o quadro perdia trabalho do usuário e o CI
// ficava verde.

describe('a Lousa: edição de texto e post-it', () => {
  it('texto com conteúdo sobrevive ao commit', () => {
    const e = mountEngine()
    e.setTool('text')
    e.beginPointer({ x: 10, y: 10 }, { x: 10, y: 10 }, {})
    const texto = e.elements.value.find((el) => el.type === 'text')
    expect(texto).toBeTruthy()
    e.setEditingText('reunião às 15h')
    e.commitText()
    expect(e.elements.value.map((el) => el.text)).toEqual(['reunião às 15h'])
    expect(e.editing.value).toBeNull()
  })

  it('texto vazio (ou só espaço) é recolhido no commit', () => {
    const e = mountEngine()
    e.setTool('text')
    e.beginPointer({ x: 10, y: 10 }, { x: 10, y: 10 }, {})
    e.setEditingText('   ')
    e.commitText()
    expect(e.elements.value).toEqual([])
    expect(e.selectedIds.value).toEqual([])
  })

  // O comentário do fonte é explícito: post-it vazio FICA. Sem esta asserção o
  // `||` apaga o post-it que o usuário acabou de criar e ainda não escreveu.
  it('post-it vazio fica no quadro', () => {
    const e = mountEngine()
    e.setTool('sticky')
    e.beginPointer({ x: 200, y: 200 }, { x: 200, y: 200 }, {})
    e.setEditingText('')
    e.commitText()
    expect(e.elements.value.map((el) => el.type)).toEqual(['sticky'])
  })

  it('só texto e post-it entram em edição; um retângulo não', () => {
    const e = mountEngine()
    const ret = desenharRetangulo(e, 0, 0, 60, 60)
    e.startEditElement(ret.id)
    expect(e.editing.value).toBeNull()

    e.setTool('text')
    e.beginPointer({ x: 300, y: 300 }, { x: 300, y: 300 }, {})
    const texto = e.elements.value.find((el) => el.type === 'text')
    e.cancelText()
    expect(e.editing.value).toBeNull()

    e.startEditElement(texto.id)
    expect(e.editing.value).toEqual({ id: texto.id })
    expect(e.selectedIds.value).toEqual([texto.id])
  })

  it('startEditElement num id que não existe não abre edição', () => {
    const e = mountEngine()
    e.startEditElement('id-que-nao-existe')
    expect(e.editing.value).toBeNull()
  })
})

describe('a Lousa: a caixa de seleção e o que conta como arrasto', () => {
  const arrastarCaixa = (e, x1, y1, x2, y2) => {
    e.setTool('select')
    e.beginPointer({ x: x1, y: y1 }, { x: x1, y: y1 }, {})
    expect(e.selectionBox.active).toBe(true) // a caixa aparece enquanto arrasta
    e.movePointer({ x: x2, y: y2 }, { x: x2, y: y2 })
    e.endPointer()
    expect(e.selectionBox.active).toBe(false)
  }

  // ⚠️ `Math.abs(box.w) > 3 || Math.abs(box.h) > 3` virou `>=` e virou `&&`.
  // Com `>=`, o tremor de 3px de um clique vira seleção; com `&&`, um arrasto
  // alto e fino (2 de largura por 50 de altura) não seleciona nada.
  it('tremor de 3px não seleciona; 4px seleciona', () => {
    const e = mountEngine()
    desenharRetangulo(e, 0, 0, 200, 200)
    e.clearSelection()

    arrastarCaixa(e, 400, 400, 403, 403) // 3px: ainda é clique
    expect(e.selectedIds.value).toEqual([])

    arrastarCaixa(e, -20, -20, 216, 216) // agora é arrasto de verdade
    expect(e.selectedIds.value).toHaveLength(1)
  })

  it('arrasto alto e fino seleciona: basta UM dos lados passar do limite', () => {
    const e = mountEngine()
    desenharRetangulo(e, 100, 0, 102, 300) // faixa de 2 de largura por 300 de altura
    e.clearSelection()

    // Comeca fora do elemento (50 acima) para cair em boxSelect, e nao em move.
    arrastarCaixa(e, 99, -50, 102, 400) // largura 3: so a altura passa do limite
    expect(e.selectedIds.value).toHaveLength(1)
  })

  // ⚠️ `(mode === 'move' || 'resize' || 'rotate') && moved` virou `||`: soltar o
  // ponteiro em QUALQUER modo grava um passo no histórico. O usuário clica num
  // elemento sem arrastar e queima um Ctrl+Z.
  it('clicar sem arrastar não grava passo no histórico', () => {
    const e = mountEngine()
    const ret = desenharRetangulo(e, 0, 0, 100, 100)
    e.undo() // desfaz o desenho: o histórico volta ao começo
    expect(e.canUndo.value).toBe(false)
    e.redo()
    expect(e.canUndo.value).toBe(true)
    expect(e.canRedo.value).toBe(false)

    e.setTool('select')
    e.beginPointer({ x: 50, y: 50 }, { x: 50, y: 50 }, {})
    e.movePointer({ x: 50, y: 50 }, { x: 50, y: 50 }) // dx e dy zerados
    e.endPointer()
    expect(e.selectedIds.value).toEqual([ret.id])
    expect(e.canRedo.value).toBe(false) // nada de novo entrou no histórico

    e.undo()
    expect(e.elements.value).toEqual([]) // desfez o DESENHO, não um não-movimento
  })

  it('arrastar de verdade grava o passo', () => {
    const e = mountEngine()
    desenharRetangulo(e, 0, 0, 100, 100)
    e.setTool('select')
    e.beginPointer({ x: 50, y: 50 }, { x: 50, y: 50 }, {})
    e.movePointer({ x: 90, y: 50 }, { x: 90, y: 50 })
    e.endPointer()

    e.undo() // desfaz o movimento
    expect(e.elements.value).toHaveLength(1)
    e.undo() // agora sim desfaz o desenho
    expect(e.elements.value).toEqual([])
  })

  it('apagar com a borracha grava o passo; passar por cima do vazio não', () => {
    const e = mountEngine()
    desenharRetangulo(e, 0, 0, 100, 100)

    e.setTool('eraser')
    e.beginPointer({ x: 900, y: 900 }, { x: 900, y: 900 }, {}) // longe de tudo
    e.endPointer()
    expect(e.elements.value).toHaveLength(1)
    e.undo()
    expect(e.elements.value).toEqual([]) // desfez o desenho, não a borracha vazia

    e.redo()
    e.setTool('eraser')
    e.beginPointer({ x: 50, y: 50 }, { x: 50, y: 50 }, {})
    e.endPointer()
    expect(e.elements.value).toEqual([])
    e.undo()
    expect(e.elements.value).toHaveLength(1) // a borracha virou um passo
  })

  it('a grade começa ligada e o modo pan liga a bandeira enquanto arrasta', () => {
    const e = mountEngine()
    expect(e.showGrid.value).toBe(true)
    expect(e.pan).toEqual({ x: 0, y: 0 })

    e.setTool('pan')
    e.beginPointer({ x: 0, y: 0 }, { x: 0, y: 0 }, {})
    expect(e.isPanning.value).toBe(true)
    e.movePointer({ x: 0, y: 0 }, { x: 30, y: -12 })
    expect(e.pan).toEqual({ x: 30, y: -12 })
    e.endPointer()
    expect(e.isPanning.value).toBe(false)
  })
})

describe('a Lousa: o que vai para a conta', () => {
  /** Desenha um traço e devolve o elemento, para o teste mexer nos pontos. */
  const tracar = (e, tipo, x) => {
    e.setTool(tipo)
    e.beginPointer({ x, y: 0 }, { x, y: 0 }, {})
    e.movePointer({ x: x + 10, y: 10 }, { x: x + 10, y: 10 })
    e.movePointer({ x: x + 20, y: 4 }, { x: x + 20, y: 4 })
    e.endPointer()
    return e.elements.value[e.elements.value.length - 1]
  }

  const salvar = async (e) => {
    await e.flushSave()
    await flushPromises()
    return e.f.colecoes.guardado('quadros', 'user-1')[0]?.elements ?? []
  }

  it('quadro pequeno vai para a conta sem tocar em ponto nenhum', async () => {
    const e = mountEngine()
    await e.loadBoards()
    await flushPromises()
    const traco = tracar(e, 'pencil', 0)
    traco.points = Array.from({ length: 400 }, (_, i) => i)
    const salvos = await salvar(e)
    expect(salvos[0].points).toHaveLength(400)
    expect(e.f.registro.avisos).toEqual([])
  })

  // A dizimação só entra quando o documento passa do limite, e é aí que as trocas mordem:
  // `el.points.length > 80` virando `>=` serrilha o traço de exatamente 80 pontos, e o `&&`
  // virando `||` mexe em elemento que nem traço à mão é.
  it('quadro grande dizima só o traço longo, e avisa que simplificou', async () => {
    const e = mountEngine()
    await e.loadBoards()
    await flushPromises()
    const enorme = tracar(e, 'pencil', 0)
    enorme.points = Array.from({ length: 120_000 }, (_, i) => (i % 1000) + 0.123456)
    const curto = tracar(e, 'pencil', 500)
    curto.points = Array.from({ length: 80 }, (_, i) => i)
    const retangulo = desenharRetangulo(e, 900, 0, 1000, 100)
    retangulo.points = Array.from({ length: 200 }, (_, i) => i)

    const salvos = await salvar(e)
    const porId = Object.fromEntries(salvos.map((el) => [el.id, el]))
    expect(porId[enorme.id].points).toHaveLength(60_000) // um par a cada quatro
    expect(porId[curto.id].points).toHaveLength(80) // no limite: intacto
    expect(porId[retangulo.id].points).toHaveLength(200) // não é traço à mão
    expect(e.f.registro.avisos).toEqual([
      {
        mensagem: 'notifySimplifiedMsg',
        tipo: 'info',
        fixo: false,
        titulo: 'notifySimplifiedTitle',
      },
    ])
  })

  it('quadro que nem dizimado cabe não é gravado, e avisa', async () => {
    const e = mountEngine()
    await e.loadBoards()
    await flushPromises()
    const texto = desenharRetangulo(e, 0, 0, 10, 10)
    texto.nota = 'x'.repeat(LIMITE_DO_QUADRO + 10)
    const salvos = await salvar(e)
    expect(salvos).toEqual([])
    expect(e.f.registro.avisos.at(-1)).toEqual({
      mensagem: 'notifyTooLargeMsg',
      tipo: 'aviso',
      fixo: false,
      titulo: 'notifyTooLargeTitle',
    })
  })
})

describe('a Lousa: imagem no quadro', () => {
  const fingirImagem = (w, h) => {
    global.Image = class {
      constructor() {
        this.width = w
        this.height = h
        this.naturalWidth = w
        this.naturalHeight = h
      }
      set src(_v) {
        if (typeof this.onload === 'function') this.onload()
      }
    }
  }

  // ⚠️ `dims.w > 480 ? 480 / dims.w : 1` virou `>=`: a imagem de exatamente
  // 480 de largura entraria numa divisão que dá 1 -- inofensivo por sorte, mas
  // o par abaixo prende a regra dos dois lados de qualquer forma.
  it('imagem larga encolhe para 480 mantendo a proporção; a de 480 entra igual', async () => {
    const e = mountEngine()
    fingirImagem(960, 480)
    await e.addImageFromFile(new File(['x'], 'a.png', { type: 'image/png' }), { x: 0, y: 0 })
    await flushPromises()
    const grande = e.elements.value.at(-1)
    expect([grande.w, grande.h]).toEqual([480, 240])
    // centrada no ponto onde caiu
    expect([grande.x, grande.y]).toEqual([-240, -120])

    fingirImagem(480, 300)
    await e.addImageFromFile(new File(['x'], 'b.png', { type: 'image/png' }), { x: 100, y: 100 })
    await flushPromises()
    const exata = e.elements.value.at(-1)
    expect([exata.w, exata.h]).toEqual([480, 300])
  })

  // O `?? 0` que morava aqui deixava passar NaN: a imagem entrava com x/y NaN,
  // não aparecia na tela, não dava para selecionar e ficava perdida no quadro.
  it('ponto de queda ausente ou inválido joga a imagem na origem', async () => {
    const e = mountEngine()
    fingirImagem(200, 100)
    const arquivo = () => new File(['x'], 'a.png', { type: 'image/png' })

    await e.addImageFromFile(arquivo(), undefined)
    await flushPromises()
    expect([e.elements.value.at(-1).x, e.elements.value.at(-1).y]).toEqual([-100, -50])

    await e.addImageFromFile(arquivo(), { x: NaN, y: 300 })
    await flushPromises()
    expect([e.elements.value.at(-1).x, e.elements.value.at(-1).y]).toEqual([-100, 250])
  })

  it('com conta, a imagem vira anexo: o elemento guarda o id, e o quadro reaberto a desenha', async () => {
    const banco = criarBancoDeAnexos()
    const f = sistemaFalso({ bancoDeAnexos: banco })
    const e = montarMotor(f)
    await e.loadBoards()
    fingirImagem(200, 100)
    await e.addImageFromFile(new File(['px'], 'a.png', { type: 'image/png' }), { x: 0, y: 0 })
    await e.flushSave()
    await flushPromises()
    const [img] = f.colecoes.guardado('quadros', 'user-1')[0].elements
    expect([img.type, img.src, /^anx_[a-z2-7]{24}$/.test(img.anexo)]).toEqual(['image', '', true])
    expect(f.anexos.guardados()).toEqual([img.anexo])
    expect(e.srcDaImagem(img)).toMatch(/^blob:local-/)

    // Outra janela, outra sessão: o mesmo quadro, e a imagem vem do anexo.
    const f2 = sistemaFalso({ bancoDeAnexos: banco })
    f2.colecoes.semear('quadros', 'user-1', f.colecoes.guardado('quadros', 'user-1'))
    f2.colecoes.semear('indice', 'user-1', f.colecoes.guardado('indice', 'user-1'))
    const outra = montarMotor(f2)
    await outra.loadBoards()
    await flushPromises()
    expect(outra.srcDaImagem(outra.elements.value[0])).toMatch(/^blob:local-/)
  })

  it('anexo que sumiu deixa a imagem vazia, e o resto do quadro abre', async () => {
    const f = sistemaFalso()
    f.colecoes.semear('indice', 'user-1', [
      { id: ID_DO_INDICE, lastBoardId: 'wb_a', boards: [{ id: 'wb_a', name: 'A' }] },
    ])
    f.colecoes.semear('quadros', 'user-1', [
      {
        id: 'wb_a',
        name: 'A',
        elements: [
          {
            id: 'i',
            type: 'image',
            x: 0,
            y: 0,
            w: 10,
            h: 10,
            angle: 0,
            src: '',
            anexo: 'anx_aaaaaaaaaaaaaaaaaaaaaaaa',
          },
          { id: 'r', type: 'rectangle', x: 0, y: 0, w: 10, h: 10, angle: 0 },
        ],
      },
    ])
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    const e = montarMotor(f)
    await e.loadBoards()
    await flushPromises()
    expect(e.elements.value.map((el) => el.id)).toEqual(['i', 'r'])
    expect(e.srcDaImagem(e.elements.value[0])).toBe('')
    expect(erro).toHaveBeenCalled()
    erro.mockRestore()
  })

  it('a imagem antiga, com endereço no elemento, continua desenhando pelo endereço', () => {
    const e = mountEngine()
    expect(e.srcDaImagem({ type: 'image', src: 'https://firebasestorage/x.png' })).toBe(
      'https://firebasestorage/x.png',
    )
  })

  it('convidado: a imagem entra embutida, e nenhum anexo é guardado', async () => {
    const f = sistemaFalso({ identidade: { uid: null, nome: null } })
    const e = montarMotor(f)
    await e.loadBoards()
    fingirImagem(200, 100)
    await e.addImageFromFile(new File(['px'], 'a.png', { type: 'image/png' }), { x: 0, y: 0 })
    const [img] = e.elements.value
    expect([img.anexo, img.src.startsWith('data:image/png')]).toEqual([undefined, true])
  })

  it('o anexo recusado não põe elemento no quadro, e avisa', async () => {
    const f = sistemaFalso()
    f.sistema.anexos = {
      ...f.sistema.anexos,
      guardar: async () => Promise.reject(new Error('cheio')),
    }
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    const e = montarMotor(f)
    await e.loadBoards()
    fingirImagem(200, 100)
    await e.addImageFromFile(new File(['px'], 'a.png', { type: 'image/png' }), { x: 0, y: 0 })
    expect(e.elements.value).toEqual([])
    expect(f.registro.avisos.at(-1)).toEqual({
      mensagem: 'notifyImageErrorMsg',
      tipo: 'erro',
      fixo: false,
      titulo: 'notifyImageErrorTitle',
    })
    erro.mockRestore()
  })

  it('imagem acima do limite do anexo entra redesenhada menor, em vez de recusada', async () => {
    const reduzidas = []
    const f = sistemaFalso()
    const e = montarMotor(f, {
      reduzirImagem: async (arquivo, dims) => (
        reduzidas.push([arquivo.name, dims]), new Blob(['menor'], { type: 'image/jpeg' })
      ),
    })
    await e.loadBoards()
    fingirImagem(4000, 3000)
    const grande = new File(['x'], 'print.png', { type: 'image/png' })
    Object.defineProperty(grande, 'size', { value: TAMANHO_MAXIMO_DE_ANEXO + 1 })
    await e.addImageFromFile(grande, { x: 0, y: 0 })
    expect(reduzidas).toEqual([['print.png', { w: 4000, h: 3000 }]])
    expect(e.elements.value).toHaveLength(1)
    const guardada = await f.sistema.anexos.ler(e.elements.value[0].anexo)
    expect(guardada.type).toBe('image/jpeg')
    // No limite, a imagem vai como veio.
    const noLimite = new File(['x'], 'a.png', { type: 'image/png' })
    Object.defineProperty(noLimite, 'size', { value: TAMANHO_MAXIMO_DE_ANEXO })
    await e.addImageFromFile(noLimite, { x: 0, y: 0 })
    expect(reduzidas).toHaveLength(1)
    expect(e.elements.value).toHaveLength(2)
  })

  it('arquivo que não é imagem não vira elemento', async () => {
    const e = mountEngine()
    await e.addImageFromFile(new File(['x'], 'a.txt', { type: 'text/plain' }), { x: 0, y: 0 })
    await e.addImageFromFile(null, { x: 0, y: 0 })
    await flushPromises()
    expect(e.elements.value).toEqual([])
  })
})

describe('a Lousa: exportar e guardar', () => {
  it('o SVG exportado leva a imagem do anexo embutida, e não o endereço local', async () => {
    const baixados = []
    const realCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag, opts) =>
      tag === 'a'
        ? {
            href: '',
            download: '',
            click() {
              baixados.push(this.download)
            },
          }
        : realCreate(tag, opts),
    )
    const blobs = []
    const e = montarMotor()
    await e.loadBoards()
    // O svgBlob passa por URL.createObjectURL no download: guarda o Blob para ler o SVG.
    URL.createObjectURL = (b) => (blobs.push(b), 'blob:svg')
    URL.revokeObjectURL = () => {}
    const { id } = await e.f.sistema.anexos.guardar(new Blob(['px'], { type: 'image/png' }))
    e.elements.value.push({
      id: 'i',
      type: 'image',
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      angle: 0,
      src: '',
      anexo: id,
    })
    await e.exportAs('svg')
    const svg = await new Promise((ok) => {
      const leitor = new FileReader()
      leitor.onload = () => ok(leitor.result)
      leitor.readAsText(blobs.at(-1))
    })
    expect(svg).toContain('href="data:image/png;base64,')
    expect(svg).not.toContain('blob:')
    expect(baixados).toEqual(['untitled.svg'])
    vi.restoreAllMocks()
  })

  it('guardar o quadro põe o .rosboard em Documentos, e conta o uso', async () => {
    const e = montarMotor()
    await e.loadBoards()
    desenharRetangulo(e, 0, 0, 10, 10)
    await e.saveRosboard()
    const [salvo] = e.f.registro.arquivos
    expect([salvo.nome, salvo.pasta, salvo.tipo]).toEqual([
      'untitled.rosboard',
      'Documentos',
      TIPO_DO_ROSBOARD,
    ])
    const conteudo = JSON.parse(salvo.conteudo)
    expect([conteudo.version, conteudo.elements.map((el) => el.type)]).toEqual([2, ['rectangle']])
    expect(e.f.registro.eventos).toEqual([{ nome: 'save', dados: {} }])
  })

  it('o .rosboard leva a imagem dentro, e não o anexo, que quem recebe não abre', async () => {
    const e = montarMotor()
    await e.loadBoards()
    const { id } = await e.f.sistema.anexos.guardar(new Blob(['px'], { type: 'image/png' }))
    e.elements.value.push({
      id: 'i',
      type: 'image',
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      angle: 0,
      src: '',
      anexo: id,
    })
    await e.saveRosboard()
    const [img] = JSON.parse(e.f.registro.arquivos[0].conteudo).elements
    expect(img.anexo).toBeUndefined()
    expect(img.src).toMatch(/^data:image\/png;base64,/)
    // O quadro na conta continua com o anexo: o arquivo é que leva a imagem.
    expect(e.elements.value.at(-1).anexo).toBe(id)
  })

  it('os bytes da imagem embutida saem da data URL, com o tipo', async () => {
    const blob = blobDaDataUrl('data:image/png;base64,cHg=')
    expect([blob.type, blob.size]).toEqual(['image/png', 2])
    expect(blobDaDataUrl('data:text/plain,ol%C3%A1').type).toBe('text/plain')
  })
})

// O .rosboard pelo Finder: o duplo clique e o "abrir com" entregam o arquivo pela abertura. Até
// a 0.1.3 o Quadro Branco guardava .rosboard e não abria nenhum (Goal 30).
describe('a Lousa: abrir um .rosboard que veio do Finder', () => {
  const RETANGULO = { id: 'r1', type: 'rectangle', x: 5, y: 5, w: 20, h: 10, angle: 0 }
  const rosboard = (dados, nome = 'Reunião de segunda.rosboard') => ({
    nome,
    tipo: TIPO_DO_ROSBOARD,
    conteudo: typeof dados === 'string' ? dados : JSON.stringify(dados),
  })

  it('com conta, o arquivo vira um quadro novo da conta, e é o que fica aberto', async () => {
    const f = sistemaFalso()
    const e = montarMotor(f)
    await e.loadBoards()
    f.abrirCom(rosboard({ version: 2, name: 'Reunião', elements: [RETANGULO] }))
    await vi.waitFor(() => expect(f.colecoes.guardado('quadros', 'user-1')).toHaveLength(2))
    const novo = f.colecoes.guardado('quadros', 'user-1').find((q) => q.name === 'Reunião')
    expect(novo.elements.map((el) => el.id)).toEqual(['r1'])
    expect([e.currentBoardId.value, e.boardName.value]).toEqual([novo.id, 'Reunião'])
    expect(e.boards.value.map((b) => b.name)).toContain('Reunião')
    expect(f.registro.avisos.at(-1)).toMatchObject({ titulo: 'notifyFileOpenedTitle' })
  })

  it('o arquivo que chega antes dos quadros abrirem espera por eles', async () => {
    const f = sistemaFalso()
    f.abrirCom(rosboard({ elements: [RETANGULO] }))
    const e = montarMotor(f)
    await e.loadBoards()
    const nomes = f.colecoes.guardado('quadros', 'user-1').map((q) => q.name)
    // Sem `name` dentro, o nome é o do arquivo sem a extensão.
    expect(nomes.sort()).toEqual(['Reunião de segunda', 'untitled'])
    expect(e.boardName.value).toBe('Reunião de segunda')
  })

  it('a imagem embutida no arquivo vira anexo da conta', async () => {
    const banco = criarBancoDeAnexos()
    const f = sistemaFalso({ bancoDeAnexos: banco })
    const e = montarMotor(f)
    await e.loadBoards()
    const img = {
      id: 'i1',
      type: 'image',
      x: 0,
      y: 0,
      w: 4,
      h: 4,
      angle: 0,
      src: 'data:image/png;base64,cHg=',
    }
    f.abrirCom(rosboard({ name: 'Com foto', elements: [img] }))
    await vi.waitFor(() => expect(f.anexos.guardados()).toHaveLength(1))
    await vi.waitFor(() => expect(f.colecoes.guardado('quadros', 'user-1')).toHaveLength(2))
    const novo = f.colecoes.guardado('quadros', 'user-1').find((q) => q.name === 'Com foto')
    expect([novo.elements[0].src, novo.elements[0].anexo]).toEqual(['', f.anexos.guardados()[0]])
  })

  it('o que não é quadro avisa, e os quadros ficam como estavam', async () => {
    for (const ruim of ['{isto não é json', JSON.stringify({ name: 'x' }), 'null']) {
      const f = sistemaFalso()
      const e = montarMotor(f)
      await e.loadBoards()
      const antes = f.colecoes.guardado('quadros', 'user-1').length
      f.abrirCom(rosboard(ruim))
      await vi.waitFor(() =>
        expect(f.registro.avisos.at(-1)).toMatchObject({
          titulo: 'notifyFileErrorTitle',
          mensagem: 'notifyFileNotBoardMsg',
          tipo: 'erro',
        }),
      )
      expect(f.colecoes.guardado('quadros', 'user-1')).toHaveLength(antes)
    }
  })

  it('no quadro da memória (a sessão do E2E), o arquivo entra nele, e desfazer volta ao de antes', async () => {
    window.__ROS_E2E__ = { whiteboard: [] }
    const f = sistemaFalso()
    const e = montarMotor(f)
    await e.loadBoards()
    desenharRetangulo(e, 0, 0, 50, 50)
    const meu = e.elements.value.map((el) => el.id)
    f.abrirCom(rosboard({ name: 'Do Finder', elements: [RETANGULO] }))
    await vi.waitFor(() => expect(e.boardName.value).toBe('Do Finder'))
    expect(e.elements.value.map((el) => el.id)).toEqual(['r1'])
    e.undo()
    expect(e.elements.value.map((el) => el.id)).toEqual(meu)
    expect(f.colecoes.guardado('quadros', 'user-1')).toEqual([])
  })

  it('sem conta, o sistema não lê o arquivo: a Lousa avisa, e o desenho fica', async () => {
    const f = sistemaFalso({ identidade: { uid: null, nome: null } })
    const e = montarMotor(f)
    await e.loadBoards()
    desenharRetangulo(e, 0, 0, 50, 50)
    const meu = e.elements.value.map((el) => el.id)
    f.abrirCom(rosboard({ name: 'Do Finder', elements: [RETANGULO] }))
    await vi.waitFor(() =>
      expect(f.registro.avisos.at(-1)).toMatchObject({
        titulo: 'notifyFileErrorTitle',
        mensagem: 'notifyOpenErrorMsg',
      }),
    )
    expect(e.elements.value.map((el) => el.id)).toEqual(meu)
  })
})
