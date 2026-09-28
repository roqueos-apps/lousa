// O MOTOR DA LOUSA: elementos, seleção, vista, ferramenta, histórico, a máquina de ponteiro
// (desenhar, selecionar por caixa, mover, redimensionar, girar, arrastar a vista, apagar), o
// salvamento automático (lido uma vez e gravado com atraso, sem tempo real: colaboração é outra
// versão), vários quadros, área de transferência, imagem e exportação. O `Lousa.vue` só liga
// os eventos do DOM a estes métodos.
//
// É o `useWhiteboard.js` do RoqueOS, com o que era do núcleo trocado pelo `sistema`:
//
//   stores/auth                → sistema.identidade (a conta, e a troca dela)
//   rosStore.showNotification  → sistema.avisar
//   Firestore (persistence.js) → sistema.colecoes, pelo `quadros.js`
//   fileStorage '/Imagens'     → sistema.anexos: a imagem é do quadro, e não um arquivo da
//                                pessoa; o elemento guarda o id (`anexo`), e o endereço nunca
//                                chega aqui
//   fileStorage '/Documentos'  → sistema.arquivos.salvar (o .rosboard)
//   isE2EMode                  → emModoE2E do SDK
//
// Sem conta (convidado) o quadro vive em memória e a imagem entra embutida (data URL), como
// sempre foi. No E2E, idem: o harness semeia `window.__ROS_E2E__.whiteboard` com os elementos.

import { ref, reactive, computed, onUnmounted } from 'vue'
import { emModoE2E, estadoE2E } from '@roqueos-apps/app-sdk'
import {
  createElement,
  pushFreehandPoint,
  growDraft,
  finalizeDraft,
  freehandPathD,
  migrateElement,
  genId,
  FREEHAND_TYPES,
  SEGMENT_TYPES,
  SHAPE_TYPES,
} from './elements.js'
import {
  selectionBounds as computeSelectionBounds,
  handlePositions,
  hitTestHandle,
  hitTestElements,
  elementsInBox,
  applyMove,
  applyResize,
  applyRotate,
  contentBounds,
} from './geometry.js'
import { createBoardHistory } from './history.js'
import { buildSvg } from './serialize.js'
import { boardPngBlob, boardPdfBlob, svgBlob, downloadBlob } from './export.js'
import {
  LIMITE_DO_QUADRO,
  criarQuadros,
  estimarBytes,
  limparElementos,
  novoIdDeQuadro,
} from './quadros.js'

const SAVE_DEBOUNCE = 800
const DRAWING_TOOLS = [...FREEHAND_TYPES, ...SEGMENT_TYPES, ...SHAPE_TYPES]

/** O tipo do aviso da Lousa no nome do contrato do `avisar`. */
const TIPO_DO_AVISO = Object.freeze({
  success: 'sucesso',
  info: 'info',
  warning: 'aviso',
  error: 'erro',
})

/** Um arquivo lido como data URL (a imagem do convidado, e a exportação). */
export function lerComoDataUrl(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(leitor.result)
    leitor.onerror = () => reject(new Error('read failed'))
    leitor.readAsDataURL(arquivo)
  })
}

/**
 * @param {{
 *   sistema: object,
 *   t: (chave: string) => string,
 *   criarUrl?: (blob: Blob) => string,
 *   soltarUrl?: (url: string) => void,
 * }} opcoes `criarUrl` e `soltarUrl` são o `URL.createObjectURL`/`revokeObjectURL`; o teste
 *   troca.
 */
export function useLousa({
  sistema,
  t,
  criarUrl = (blob) => URL.createObjectURL(blob),
  soltarUrl = (url) => URL.revokeObjectURL(url),
}) {
  const quadros = criarQuadros(sistema)
  const conta = ref(sistema.identidade.atual().uid)
  const uid = computed(() => conta.value)
  // O quadro que não vai para a conta: convidado, e o E2E (a sessão falsa não tem token).
  const soNaMemoria = () => !uid.value || emModoE2E()
  const notify = (title, message, type = 'success') =>
    sistema.avisar(message, { tipo: TIPO_DO_AVISO[type] ?? 'info', titulo: title })

  // --- State -------------------------------------------------------------------
  const elements = ref([])
  const selectedIds = ref([])
  const currentElement = ref(null) // draft being drawn (absolute coords)
  const editing = ref(null) // { id } while a text/sticky is being edited
  const loading = ref(true)
  const error = ref(null)

  const tool = ref('select')
  const strokeColor = ref('#1e1e1e')
  const strokeWidth = ref(2)
  const fillEnabled = ref(false)
  const fillColor = ref('#ffffff')
  const stickyColor = ref('#ffe27a')

  const zoom = ref(1)
  const pan = reactive({ x: 0, y: 0 })
  const showGrid = ref(true)
  const isPanning = ref(false)

  const selectionBox = reactive({ active: false, x: 0, y: 0, w: 0, h: 0 })

  // Boards
  const boards = ref([]) // [{ id, name }]
  const currentBoardId = ref(null)
  const boardName = ref('')

  // As imagens guardadas como anexo: id do anexo → URL local do Blob, para o <image> desenhar.
  // O endereço mora só aqui, na memória desta janela, e sai no desmontar.
  const urlsDosAnexos = reactive({})
  const anexosPedidos = new Set()

  // History
  const history = createBoardHistory()
  const canUndo = ref(false)
  const canRedo = ref(false)
  const syncHistory = () => {
    canUndo.value = history.canUndo()
    canRedo.value = history.canRedo()
  }

  // Clipboard (internal)
  let clipboard = []

  // Pointer machine internals
  let mode = 'idle'
  let last = { x: 0, y: 0 }
  let panStart = { x: 0, y: 0 }
  let activeHandle = null
  let moved = false
  let eraseChanged = false

  // --- Computed ----------------------------------------------------------------
  const selectedElements = computed(() =>
    elements.value.filter((el) => selectedIds.value.includes(el.id)),
  )
  const selectionBounds = computed(() => computeSelectionBounds(selectedElements.value))
  const handles = computed(() =>
    selectionBounds.value && selectionBounds.value.single
      ? handlePositions(selectionBounds.value)
      : [],
  )

  /** O endereço que o <image> desenha: o do anexo, resolvido aqui, ou o `src` de sempre. */
  function srcDaImagem(el) {
    if (el?.anexo) return urlsDosAnexos[el.anexo] || ''
    return el?.src || ''
  }

  /** Busca os anexos das imagens do quadro que ainda não têm URL local. */
  async function resolverAnexos(lista = elements.value) {
    const faltam = lista
      .filter((el) => el?.type === 'image' && el.anexo && !anexosPedidos.has(el.anexo))
      .map((el) => el.anexo)
    await Promise.all(
      faltam.map(async (id) => {
        anexosPedidos.add(id)
        try {
          urlsDosAnexos[id] = criarUrl(await sistema.anexos.ler(id))
        } catch (erro) {
          // Anexo que sumiu (ou de outra conta): a imagem fica vazia, e o resto do quadro abre.
          anexosPedidos.delete(id)
          console.error('[lousa] anexo', id, erro?.codigo ?? erro)
        }
      }),
    )
  }

  // --- Coordinate mapping ------------------------------------------------------
  function screenToWorld(clientX, clientY, rect) {
    return {
      x: (clientX - rect.left - pan.x) / zoom.value,
      y: (clientY - rect.top - pan.y) / zoom.value,
    }
  }

  // --- History + autosave ------------------------------------------------------
  function commit() {
    history.push(elements.value)
    syncHistory()
    scheduleSave()
  }

  let saveTimer = null
  function scheduleSave() {
    if (soNaMemoria()) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(flushSave, SAVE_DEBOUNCE)
  }

  async function flushSave() {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    if (soNaMemoria() || !currentBoardId.value) return
    try {
      let els = limparElementos(elements.value)
      let payload = {
        name: boardName.value,
        elements: els,
        view: { zoom: zoom.value, panX: pan.x, panY: pan.y },
      }
      if (estimarBytes(payload) > LIMITE_DO_QUADRO) {
        els = decimateForSave(els)
        payload = { ...payload, elements: els }
        if (estimarBytes(payload) > LIMITE_DO_QUADRO) {
          notify(t('notifyTooLargeTitle'), t('notifyTooLargeMsg'), 'warning')
          return
        }
        notify(t('notifySimplifiedTitle'), t('notifySimplifiedMsg'), 'info')
      }
      await quadros.salvarQuadro(currentBoardId.value, payload)
    } catch (e) {
      console.error('[lousa] salvar o quadro', e?.codigo ?? e)
    }
  }

  // Drop every other freehand point to fit a huge board under the doc limit.
  function decimateForSave(els) {
    return els.map((el) => {
      if (FREEHAND_TYPES.includes(el.type) && el.points && el.points.length > 80) {
        const out = []
        for (let i = 0; i < el.points.length; i += 4) out.push(el.points[i], el.points[i + 1])
        return { ...el, points: out }
      }
      return el
    })
  }

  function undo() {
    const els = history.undo()
    if (els) {
      elements.value = els
      selectedIds.value = []
      syncHistory()
      scheduleSave()
    }
  }
  function redo() {
    const els = history.redo()
    if (els) {
      elements.value = els
      selectedIds.value = []
      syncHistory()
      scheduleSave()
    }
  }

  // --- Pointer state machine ---------------------------------------------------
  function beginPointer(world, screen, mods = {}) {
    if (editing.value) commitText() // clicking elsewhere commits an open editor
    moved = false

    if (mods.space || tool.value === 'pan') {
      mode = 'panning'
      isPanning.value = true
      panStart = { x: screen.x, y: screen.y }
      return
    }

    if (DRAWING_TOOLS.includes(tool.value)) {
      mode = 'drawing'
      const draft = createElement(tool.value, world.x, world.y, {
        stroke: strokeColor.value,
        strokeWidth: strokeWidth.value,
        fill: fillEnabled.value ? fillColor.value : null,
      })
      if (FREEHAND_TYPES.includes(tool.value)) draft._path = `M ${world.x} ${world.y}`
      currentElement.value = draft
      return
    }

    if (tool.value === 'text') {
      const el = createElement('text', world.x, world.y - 16, { stroke: strokeColor.value })
      el.w = 160
      el.h = 32
      elements.value.push(el)
      selectedIds.value = [el.id]
      editing.value = { id: el.id }
      tool.value = 'select'
      return
    }

    if (tool.value === 'sticky') {
      const el = createElement('sticky', world.x - 90, world.y - 90, { bg: stickyColor.value })
      elements.value.push(el)
      selectedIds.value = [el.id]
      commit()
      editing.value = { id: el.id }
      tool.value = 'select'
      return
    }

    if (tool.value === 'eraser') {
      mode = 'erasing'
      eraseChanged = false
      eraseAt(world)
      last = world
      return
    }

    // select tool
    const handle = hitTestHandle(world, selectionBounds.value)
    if (handle === 'rotate') {
      mode = 'rotate'
      last = world
      return
    }
    if (handle) {
      mode = 'resize'
      activeHandle = handle
      last = world
      return
    }
    const hit = hitTestElements(world, elements.value)
    if (hit) {
      if (mods.shift) {
        selectedIds.value = selectedIds.value.includes(hit.id)
          ? selectedIds.value.filter((id) => id !== hit.id)
          : [...selectedIds.value, hit.id]
      } else if (!selectedIds.value.includes(hit.id)) {
        selectedIds.value = [hit.id]
      }
      mode = 'move'
      last = world
      return
    }
    // empty space → box select
    if (!mods.shift) selectedIds.value = []
    selectionBox.active = true
    selectionBox.x = world.x
    selectionBox.y = world.y
    selectionBox.w = 0
    selectionBox.h = 0
    mode = 'boxSelect'
    last = world
  }

  function movePointer(world, screen) {
    if (mode === 'panning') {
      pan.x += screen.x - panStart.x
      pan.y += screen.y - panStart.y
      panStart = { x: screen.x, y: screen.y }
      return
    }
    if (mode === 'drawing' && currentElement.value) {
      const d = currentElement.value
      if (FREEHAND_TYPES.includes(d.type)) {
        pushFreehandPoint(d, world.x, world.y)
        d._path += ` L ${world.x} ${world.y}`
      } else {
        growDraft(d, world.x, world.y)
      }
      return
    }
    if (mode === 'erasing') {
      eraseAt(world)
      return
    }
    if (mode === 'boxSelect') {
      selectionBox.w = world.x - selectionBox.x
      selectionBox.h = world.y - selectionBox.y
      return
    }
    if (mode === 'move') {
      const dx = world.x - last.x
      const dy = world.y - last.y
      if (dx || dy) moved = true
      for (const el of selectedElements.value) applyMove(el, dx, dy)
      last = world
      return
    }
    if (mode === 'resize') {
      const el = selectedElements.value[0]
      if (el) {
        applyResize(el, activeHandle, world.x - last.x, world.y - last.y)
        moved = true
      }
      last = world
      return
    }
    if (mode === 'rotate') {
      const el = selectedElements.value[0]
      if (el) {
        applyRotate(el, world, 0)
        moved = true
      }
      last = world
    }
  }

  function endPointer() {
    if (mode === 'panning') {
      isPanning.value = false
      mode = 'idle'
      scheduleSave()
      return
    }
    if (mode === 'drawing' && currentElement.value) {
      const d = currentElement.value
      delete d._path
      if (finalizeDraft(d)) {
        elements.value.push(d)
        commit()
      }
      currentElement.value = null
      mode = 'idle'
      return
    }
    if (mode === 'erasing') {
      if (eraseChanged) commit()
      mode = 'idle'
      return
    }
    if (mode === 'boxSelect') {
      selectionBox.active = false
      const box = { x: selectionBox.x, y: selectionBox.y, w: selectionBox.w, h: selectionBox.h }
      if (Math.abs(box.w) > 3 || Math.abs(box.h) > 3) {
        selectedIds.value = elementsInBox(box, elements.value).map((el) => el.id)
      }
      mode = 'idle'
      return
    }
    if ((mode === 'move' || mode === 'resize' || mode === 'rotate') && moved) {
      commit()
    }
    mode = 'idle'
    activeHandle = null
  }

  function eraseAt(world) {
    const hit = hitTestElements(world, elements.value, 10 / zoom.value)
    if (hit) {
      elements.value = elements.value.filter((el) => el.id !== hit.id)
      selectedIds.value = selectedIds.value.filter((id) => id !== hit.id)
      eraseChanged = true
    }
  }

  // --- Selection / clipboard ---------------------------------------------------
  function selectAll() {
    selectedIds.value = elements.value.map((el) => el.id)
  }
  function clearSelection() {
    selectedIds.value = []
  }
  function deleteSelection() {
    if (!selectedIds.value.length) return
    elements.value = elements.value.filter((el) => !selectedIds.value.includes(el.id))
    selectedIds.value = []
    commit()
  }
  function copySelection() {
    clipboard = selectedElements.value.map((el) => JSON.parse(JSON.stringify(el)))
  }
  function paste() {
    if (!clipboard.length) return
    const fresh = clipboard.map((el) => ({
      ...JSON.parse(JSON.stringify(el)),
      id: genId(),
      x: el.x + 24,
      y: el.y + 24,
    }))
    elements.value.push(...fresh)
    selectedIds.value = fresh.map((el) => el.id)
    commit()
  }
  function duplicateSelection() {
    copySelection()
    paste()
  }

  // --- Text / sticky editing ---------------------------------------------------
  function startEditElement(id) {
    const el = elements.value.find((e) => e.id === id)
    if (el && (el.type === 'text' || el.type === 'sticky')) {
      selectedIds.value = [id]
      editing.value = { id }
    }
  }
  function setEditingText(text) {
    const ed = editing.value
    if (!ed) return
    const el = elements.value.find((e) => e.id === ed.id)
    if (el) el.text = text
  }
  function commitText() {
    const ed = editing.value
    editing.value = null
    if (!ed) return
    const el = elements.value.find((e) => e.id === ed.id)
    // Remove an empty text element (sticky notes are kept even if empty).
    if (el && el.type === 'text' && !String(el.text || '').trim()) {
      elements.value = elements.value.filter((e) => e.id !== el.id)
      selectedIds.value = []
    }
    commit()
  }
  function cancelText() {
    editing.value = null
  }

  // --- View --------------------------------------------------------------------
  function zoomIn() {
    zoom.value = Math.min(8, zoom.value * 1.2)
  }
  function zoomOut() {
    zoom.value = Math.max(0.1, zoom.value / 1.2)
  }
  function resetView() {
    zoom.value = 1
    pan.x = 0
    pan.y = 0
  }
  function zoomAtScreen(deltaY, sx, sy) {
    const factor = deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(8, zoom.value * factor))
    pan.x = sx - (sx - pan.x) * (newZoom / zoom.value)
    pan.y = sy - (sy - pan.y) * (newZoom / zoom.value)
    zoom.value = newZoom
  }
  function fitToContent(rect) {
    const b = contentBounds(elements.value, 40)
    if (!b || !rect) return resetView()
    const z = Math.min(rect.width / b.w, rect.height / b.h, 1)
    zoom.value = Math.max(0.1, z)
    pan.x = rect.width / 2 - (b.x + b.w / 2) * zoom.value
    pan.y = rect.height / 2 - (b.y + b.h / 2) * zoom.value
  }

  // --- Images ------------------------------------------------------------------
  // Com conta, a imagem vira um anexo da Lousa (`sistema.anexos`) e o elemento guarda só o id:
  // abre em qualquer aparelho da pessoa, não conta contra o 1 MB do quadro e não aparece nas
  // Imagens do Finder (é do quadro). Sem conta, ou no E2E, ela entra embutida no elemento.
  async function addImageFromFile(file, world) {
    if (!file || !file.type?.startsWith('image/')) return
    try {
      const dims = await readImageDims(file)
      const maxW = 480
      const scale = dims.w > maxW ? maxW / dims.w : 1
      const w = Math.round(dims.w * scale)
      const h = Math.round(dims.h * scale)
      let estilo
      if (soNaMemoria()) {
        estilo = { src: await lerComoDataUrl(file) }
      } else {
        const { id } = await sistema.anexos.guardar(file)
        urlsDosAnexos[id] = criarUrl(file)
        anexosPedidos.add(id)
        estilo = { anexo: id }
      }
      // Ponto de queda: sem `world` (colar pelo teclado, por exemplo) a imagem
      // vai para a origem. `Number.isFinite` em vez de `?? 0` porque uma
      // coordenada NaN não cai no `??` e produz um elemento com x/y NaN --
      // invisível na tela, impossível de selecionar, e perdido no quadro.
      const cx = Number.isFinite(world?.x) ? world.x : 0
      const cy = Number.isFinite(world?.y) ? world.y : 0
      const el = createElement('image', cx - w / 2, cy - h / 2, estilo)
      el.w = w
      el.h = h
      elements.value.push(el)
      selectedIds.value = [el.id]
      commit()
    } catch (e) {
      console.error('[lousa] inserir imagem', e?.codigo ?? e)
      notify(t('notifyImageErrorTitle'), t('notifyImageErrorMsg'), 'error')
    }
  }
  function readImageDims(file) {
    return new Promise((resolve, reject) => {
      const url = criarUrl(file)
      const img = new Image()
      img.onload = () => {
        soltarUrl(url)
        resolve({
          w: img.naturalWidth || img.width || 320,
          h: img.naturalHeight || img.height || 240,
        })
      }
      img.onerror = () => {
        soltarUrl(url)
        reject(new Error('image decode failed'))
      }
      img.src = url
    })
  }

  // --- Board ops ---------------------------------------------------------------
  function applyBoardData(data) {
    const els = Array.isArray(data?.elements)
      ? data.elements.map(migrateElement).filter(Boolean)
      : []
    elements.value = els
    selectedIds.value = []
    boardName.value = data?.name || t('untitled')
    if (data?.view) {
      zoom.value = data.view.zoom || 1
      pan.x = data.view.panX || 0
      pan.y = data.view.panY || 0
    } else resetView()
    history.reset()
    history.push(elements.value)
    syncHistory()
    resolverAnexos(els)
  }

  function clearBoard() {
    elements.value = []
    selectedIds.value = []
    commit()
  }

  async function loadBoards() {
    loading.value = true
    error.value = null
    try {
      if (soNaMemoria()) {
        // E2E: a semente do harness (QA visual sem token do banco). Convidado: um quadro em
        // memória, sem salvamento automático.
        const semente = emModoE2E() ? estadoE2E('whiteboard') : null
        currentBoardId.value = Array.isArray(semente) ? 'e2e' : 'local'
        boards.value = Array.isArray(semente) ? [{ id: 'e2e', name: 'E2E' }] : []
        applyBoardData(
          Array.isArray(semente) ? { name: 'E2E', elements: semente } : { elements: [] },
        )
        return
      }
      const index = await quadros.lerIndice()
      boards.value = index.boards
      let target = index.lastBoardId
      if (target && !index.boards.some((b) => b.id === target)) target = index.boards[0]?.id || null
      if (!target) {
        await createBoard(t('untitled'), { silent: true })
      } else {
        currentBoardId.value = target
        const data = await quadros.lerQuadro(target)
        applyBoardData(data || { name: t('untitled'), elements: [] })
      }
    } catch (e) {
      console.error('[lousa] abrir os quadros', e?.codigo ?? e)
      error.value = 'load'
    } finally {
      loading.value = false
    }
  }

  async function persistIndex() {
    if (soNaMemoria()) return
    try {
      await quadros.salvarIndice({ lastBoardId: currentBoardId.value, boards: boards.value })
    } catch (e) {
      console.error('[lousa] salvar o índice', e?.codigo ?? e)
    }
  }

  async function createBoard(name, { silent = false } = {}) {
    await flushSave()
    const id = soNaMemoria() ? 'local' : novoIdDeQuadro()
    currentBoardId.value = id
    elements.value = []
    selectedIds.value = []
    boardName.value = name || t('untitled')
    resetView()
    history.reset()
    history.push([])
    syncHistory()
    if (!soNaMemoria()) {
      boards.value = [...boards.value.filter((b) => b.id !== id), { id, name: boardName.value }]
      await quadros.salvarQuadro(id, {
        name: boardName.value,
        elements: [],
        view: { zoom: 1, panX: 0, panY: 0 },
      })
      await persistIndex()
    }
    if (!silent) notify(t('notifyBoardCreatedTitle'), boardName.value)
  }

  async function switchBoard(id) {
    if (id === currentBoardId.value) return
    await flushSave()
    currentBoardId.value = id
    const data = await quadros.lerQuadro(id)
    applyBoardData(data || { name: t('untitled'), elements: [] })
    await persistIndex()
  }

  async function renameBoard(id, name) {
    const b = boards.value.find((x) => x.id === id)
    if (b) b.name = name
    if (id === currentBoardId.value) boardName.value = name
    await persistIndex()
    if (id === currentBoardId.value) scheduleSave()
  }

  async function deleteBoard(id) {
    boards.value = boards.value.filter((b) => b.id !== id)
    const eraOAberto = id === currentBoardId.value
    if (eraOAberto) {
      // O quadro aberto está sendo apagado: o que esperava para gravar não grava mais. Antes, a
      // troca para o próximo quadro gravava o apagado de volta (o salvar cria o documento que
      // não existe), e ele ficava na conta, fora do índice, para sempre.
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = null
      currentBoardId.value = null
    }
    if (!soNaMemoria()) {
      try {
        await quadros.apagarQuadro(id)
      } catch (e) {
        console.error('[lousa] apagar o quadro', e?.codigo ?? e)
      }
    }
    if (eraOAberto) {
      const next = boards.value[0]?.id
      if (next) await switchBoard(next)
      else await createBoard(t('untitled'), { silent: true })
    }
    await persistIndex()
  }

  // --- Export / .rosboard ------------------------------------------------------
  // O SVG vira imagem num <img>, e um <img> de SVG não busca nada de fora: a imagem do quadro
  // precisa ir embutida (data URL) para aparecer no PNG e no PDF. O anexo vem do sistema; a
  // imagem antiga, do endereço dela, e fica como está se o navegador recusar.
  async function elementosParaExportar() {
    return Promise.all(
      elements.value.map(async (el) => {
        if (el.type !== 'image') return el
        try {
          if (el.anexo)
            return { ...el, src: await lerComoDataUrl(await sistema.anexos.ler(el.anexo)) }
          if (/^https?:/.test(el.src || '')) {
            const resposta = await fetch(el.src, { credentials: 'omit' })
            if (resposta.ok) return { ...el, src: await lerComoDataUrl(await resposta.blob()) }
          }
        } catch (erro) {
          console.error('[lousa] imagem para exportar', erro?.codigo ?? erro)
        }
        return el
      }),
    )
  }

  async function exportAs(format) {
    try {
      const stamp = (boardName.value || 'whiteboard').replace(/[^\w-]+/g, '_')
      const els = await elementosParaExportar()
      if (format === 'svg') {
        const { svg } = buildSvg(els)
        downloadBlob(svgBlob(svg), `${stamp}.svg`)
      } else if (format === 'pdf') {
        downloadBlob(await boardPdfBlob(els), `${stamp}.pdf`)
      } else {
        downloadBlob(await boardPngBlob(els), `${stamp}.png`)
      }
      notify(t('notifyExportedTitle'), format.toUpperCase())
    } catch (e) {
      console.error('[lousa] exportar', e)
      notify(t('exportError'), t('erroGenerico'), 'error')
    }
  }

  async function saveRosboard() {
    // O uso que conta da Lousa: a pessoa guardou o quadro (o mesmo evento de antes de sair).
    sistema.metricas.evento('save')
    try {
      const nome = `${(boardName.value || 'whiteboard').replace(/[^\w-]+/g, '_')}.rosboard`
      const conteudo = JSON.stringify({
        version: 2,
        name: boardName.value,
        elements: limparElementos(elements.value),
      })
      if (soNaMemoria()) {
        downloadBlob(new Blob([conteudo], { type: 'application/json' }), nome)
      } else {
        await sistema.arquivos.salvar({
          nome,
          conteudo,
          tipo: 'application/json',
          pasta: 'Documentos',
        })
      }
      notify(t('comumSuccess'), t('saveSuccess'))
    } catch (e) {
      console.error('[lousa] salvar o .rosboard', e?.codigo ?? e)
      notify(t('comumError'), t('saveError'), 'error')
    }
  }

  function setTool(id) {
    if (editing.value) commitText()
    tool.value = id
    if (id !== 'select') selectedIds.value = []
  }

  // Seed an initial empty snapshot so the first edit is undoable even before a
  // board finishes loading (loadBoards/applyBoardData reset + reseed afterwards).
  history.push([])
  syncHistory()

  // --- Lifecycle ---------------------------------------------------------------
  // A conta trocou com a Lousa aberta: o que esperava para gravar era da conta anterior e não
  // vai para a nova; os quadros da conta nova abrem.
  const pararConta = sistema.identidade.aoMudar(({ uid: novo }) => {
    if (novo === conta.value) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = null
    conta.value = novo
    loadBoards()
  })

  function cleanup() {
    flushSave()
    pararConta()
    for (const url of Object.values(urlsDosAnexos)) if (url) soltarUrl(url)
  }
  onUnmounted(cleanup)

  return {
    // state
    elements,
    selectedIds,
    selectedElements,
    currentElement,
    editing,
    loading,
    error,
    tool,
    strokeColor,
    strokeWidth,
    fillEnabled,
    fillColor,
    stickyColor,
    zoom,
    pan,
    showGrid,
    isPanning,
    selectionBox,
    boards,
    currentBoardId,
    boardName,
    canUndo,
    canRedo,
    selectionBounds,
    handles,
    conta,
    // helpers exposed for rendering
    freehandPathD,
    srcDaImagem,
    // coordinate + pointer
    screenToWorld,
    beginPointer,
    movePointer,
    endPointer,
    // selection/clipboard
    setTool,
    selectAll,
    clearSelection,
    deleteSelection,
    copySelection,
    paste,
    duplicateSelection,
    // text
    startEditElement,
    setEditingText,
    commitText,
    cancelText,
    // images
    addImageFromFile,
    // view
    zoomIn,
    zoomOut,
    resetView,
    zoomAtScreen,
    fitToContent,
    // history
    undo,
    redo,
    // board
    loadBoards,
    clearBoard,
    createBoard,
    switchBoard,
    renameBoard,
    deleteBoard,
    flushSave,
    // export
    exportAs,
    saveRosboard,
    cleanup,
  }
}
