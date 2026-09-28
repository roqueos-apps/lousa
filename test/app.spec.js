// A Lousa como o app-sdk entende um app: o `mount` que o RoqueOS chama, com o sistema falso do
// SDK. O motor tem o spec dele (lousa.spec.js); aqui é a tela: o texto no idioma, a troca ao
// vivo, a janela larga e a estreita, o painel de IA do sistema com as ações da Lousa, o teclado
// só com a janela ativa, e o desmontar que solta tudo.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { criarSistemaFalso } from '@roqueos-apps/app-sdk/sistema-falso'
import { validarManifesto, verificarSistema } from '@roqueos-apps/app-sdk'
import lousa, { CAPACIDADES } from '../src/index.js'
import manifesto from '../app.json'

const ANA = { uid: 'ana', nome: 'Ana' }

function montar({ identidade = ANA, idioma = 'pt-BR', ativo = true } = {}) {
  const falso = criarSistemaFalso({
    appId: 'whiteboard',
    identidade,
    idioma,
    colecoes: ['quadros', 'indice'],
  })
  const el = document.createElement('div')
  document.body.appendChild(el)
  const montagem = lousa.mount(el, falso.sistema, { windowId: 'w1', ativo })
  const botao = (rotulo) =>
    [...el.querySelectorAll('button')].find(
      (b) => b.getAttribute('aria-label') === rotulo || b.textContent.trim() === rotulo,
    )
  return { ...falso, el, montagem, botao }
}

const abriu = (el) =>
  vi.waitFor(() => {
    expect(el.querySelector('.lousa')).not.toBeNull()
    expect(el.querySelector('.lousa__sobre')).toBeNull()
  })
const tecla = (key, opcoes = {}) =>
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opcoes }))

describe('a Lousa pelo app-sdk', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('o id e as capacidades são os do manifesto, e o manifesto é válido', () => {
    expect(validarManifesto(manifesto)).toEqual([])
    expect([lousa.id, [...lousa.capacidades]]).toEqual([manifesto.id, manifesto.capacidades])
    expect([...CAPACIDADES]).toEqual(manifesto.capacidades)
    const { sistema } = criarSistemaFalso({ colecoes: manifesto.colecoes })
    expect(verificarSistema(sistema, { exigidas: [...CAPACIDADES] }).ok).toBe(true)
  })

  it('abre na conta, com a barra no idioma, e o primeiro quadro nasce na conta', async () => {
    const f = montar()
    await abriu(f.el)
    expect(f.botao('Novo quadro')).toBeTruthy()
    expect(f.botao('Desfazer').disabled).toBe(true)
    expect(f.el.querySelector('.lousa__nome-do-quadro').textContent).toBe('Sem título')
    expect(f.colecoes.guardado('quadros', 'ana').map((q) => q.name)).toEqual(['Sem título'])
    f.montagem.desmontar()
  })

  it('a troca de idioma com a janela aberta troca o texto', async () => {
    const f = montar()
    await abriu(f.el)
    f.mudarIdioma('en-US')
    await vi.waitFor(() => expect(f.botao('New board')).toBeTruthy())
    expect(f.botao('Novo quadro')).toBeUndefined()
    f.montagem.desmontar()
  })

  it('o painel de IA é o do sistema, só de leitura, com as ações da Lousa no idioma', async () => {
    const f = montar()
    await abriu(f.el)
    f.botao('IA').click()
    expect(f.ia.aberto()).toEqual({
      tipo: 'read',
      acento: '#0ea5e9',
      titulo: 'IA',
      aplica: false,
      acoes: ['temas', 'acoes'],
      aberto: true,
    })
    expect(await f.ia.contexto()).toBe('')
    // O mesmo botão fecha, e a Lousa fica sabendo.
    f.botao('IA').click()
    await flushPromises()
    expect(f.ia.aberto()).toBeNull()
    expect(f.botao('IA').getAttribute('aria-pressed')).toBe('false')
    f.montagem.desmontar()
  })

  it('o teclado só mexe na Lousa com a janela ativa', async () => {
    const f = montar({ ativo: false })
    await abriu(f.el)
    const retangulo = () => f.el.querySelector('.ferramentas__ferramenta[aria-label="Retângulo"]')
    tecla('r')
    await flushPromises()
    expect(retangulo().getAttribute('aria-pressed')).toBe('false')
    f.montagem.ativar(true)
    tecla('r')
    await flushPromises()
    expect(retangulo().getAttribute('aria-pressed')).toBe('true')
    f.montagem.desmontar()
  })

  it('janela estreita: a barra curta, e as ferramentas na folha', async () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 420,
      height: 700,
      left: 0,
      top: 0,
      right: 420,
      bottom: 700,
    })
    const f = montar()
    await abriu(f.el)
    expect([
      Boolean(f.el.querySelector('.lousa__barra--estreita')),
      Boolean(f.el.querySelector('.lousa__lateral')),
    ]).toEqual([true, false])
    f.botao('Menu').click()
    await vi.waitFor(() =>
      expect(
        document.body.querySelector('.ferramentas__ferramenta[aria-label="Caneta"]'),
      ).not.toBeNull(),
    )
    f.montagem.desmontar()
  })

  it('janela larga: a lateral com as ferramentas, e a folha dos quadros', async () => {
    const f = montar()
    await abriu(f.el)
    expect(f.el.querySelector('.lousa__lateral .ferramentas')).not.toBeNull()
    f.botao('Quadros').click()
    await vi.waitFor(() =>
      expect(
        document.body.querySelector('.quadros__item--atual .quadros__nome').textContent.trim(),
      ).toBe('Sem título'),
    )
    f.montagem.desmontar()
  })

  it('desmontar solta o teclado, o painel de IA e os ouvintes do sistema', async () => {
    const pos = vi.spyOn(window, 'addEventListener')
    const tirou = vi.spyOn(window, 'removeEventListener')
    const f = montar()
    await abriu(f.el)
    const nossos = pos.mock.calls.filter(([tipo]) => ['keydown', 'keyup', 'paste'].includes(tipo))
    expect(nossos.map(([tipo]) => tipo).sort()).toEqual(['keydown', 'keyup', 'paste'])
    f.botao('IA').click()
    f.montagem.desmontar()
    for (const [tipo, fn] of nossos)
      expect(
        tirou.mock.calls.some(([t, g]) => t === tipo && g === fn),
        tipo,
      ).toBe(true)
    expect([f.ia.aberto(), f.ouvintesVivos()]).toEqual([null, 0])
    expect(f.el.querySelector('.lousa')).toBeNull()
    // A tecla depois de fechar não chega a lugar nenhum (e não quebra).
    expect(() => tecla('r')).not.toThrow()
  })

  it('sem conta, abre e desenha só na memória', async () => {
    const f = montar({ identidade: { uid: null, nome: null } })
    await abriu(f.el)
    expect(f.colecoes.guardado('quadros', 'ana')).toEqual([])
    expect(f.botao('Novo quadro')).toBeTruthy()
    f.montagem.desmontar()
  })
})
