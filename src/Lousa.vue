<template>
  <div
    ref="raizRef"
    class="lousa"
    :class="{ 'lousa--leve': estado.leve, 'lousa--estreita': estreita }"
    :style="estiloDoAcento"
  >
    <div class="lousa__malha" aria-hidden="true"></div>

    <!-- A barra da janela larga -->
    <div v-if="!estreita" class="lousa__barra">
      <div class="lousa__grupo">
        <RosBotao icone="note_add" :rotulo="t('newBoard')" @click="createBoard()" />
        <RosBotao icone="dashboard" :rotulo="t('boards')" @click="quadrosAbertos = true" />
        <RosBotao icone="save" :rotulo="t('comumSave')" @click="saveRosboard" />
        <RosBotao
          icone="auto_awesome"
          :rotulo="t('iaTitulo')"
          :ligado="iaAberta"
          :acento="ACENTO"
          @click="alternarIa"
        />
      </div>
      <div class="lousa__separador"></div>
      <div class="lousa__grupo">
        <RosBotao icone="undo" :rotulo="t('comumUndo')" :disabled="!canUndo" @click="undo" />
        <RosBotao icone="redo" :rotulo="t('comumRedo')" :disabled="!canRedo" @click="redo" />
      </div>
      <div class="lousa__separador"></div>
      <div class="lousa__grupo">
        <RosBotao
          icone="delete"
          :rotulo="t('comumDelete')"
          :disabled="!selectedIds.length"
          @click="deleteSelection"
        />
        <RosBotao icone="delete_sweep" :rotulo="t('clearAll')" @click="clearBoard" />
      </div>
      <div class="lousa__espaco"></div>
      <span class="lousa__nome-do-quadro">{{ boardName }}</span>
      <div class="lousa__separador"></div>
      <div class="lousa__grupo">
        <RosBotao icone="zoom_out" :rotulo="t('zoomOut')" @click="zoomOut" />
        <span class="lousa__zoom">{{ Math.round(zoom * 100) }}%</span>
        <RosBotao icone="zoom_in" :rotulo="t('zoomIn')" @click="zoomIn" />
        <RosBotao icone="fit_screen" :rotulo="t('resetView')" @click="ajustarAVista" />
      </div>
    </div>

    <!-- A barra da janela estreita (celular, ou janela pequena na mesa) -->
    <div v-else class="lousa__barra lousa__barra--estreita">
      <RosBotao icone="menu" :rotulo="t('comumMenu')" @click="folhaAberta = true" />
      <span class="lousa__titulo">{{ boardName || t('title') }}</span>
      <RosBotao icone="undo" :rotulo="t('comumUndo')" :disabled="!canUndo" @click="undo" />
      <RosBotao icone="redo" :rotulo="t('comumRedo')" :disabled="!canRedo" @click="redo" />
      <RosBotao
        icone="auto_awesome"
        :rotulo="t('iaTitulo')"
        :ligado="iaAberta"
        :acento="ACENTO"
        @click="alternarIa"
      />
    </div>

    <div class="lousa__corpo">
      <!-- A âncora do painel de IA do sistema: vazia, e o Vue da Lousa nunca desenha nada
           dentro dela. Com `display: contents` ela não ocupa caixa, e o painel cobre o corpo
           (position: relative). O painel lê o que está ESCRITO no quadro: resumir, agrupar em
           temas, tirar as ações. Só leitura: o quadro é o arranjo da pessoa. -->
      <div ref="ancoraDaIa" class="lousa__ancora-ia"></div>

      <aside v-if="!estreita" class="lousa__lateral">
        <Ferramentas :acento="ACENTO" @abrir-quadros="quadrosAbertos = true" />
      </aside>

      <div
        ref="palcoRef"
        class="lousa__palco"
        :class="{
          'lousa__palco--grade': showGrid,
          'lousa__palco--arrastando': isPanning || espacoApertado,
        }"
        :style="estiloDaGrade"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
        @dblclick="onDblClick"
        @wheel.prevent="onWheel"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend.prevent="onTouchEnd"
        @drop.prevent="onDrop"
        @dragover.prevent
        @contextmenu.prevent
      >
        <svg class="lousa__svg" :width="larguraDoPalco" :height="alturaDoPalco">
          <g :transform="`translate(${pan.x} ${pan.y}) scale(${zoom})`">
            <!-- Committed elements -->
            <g v-for="el in elements" :key="el.id" :transform="rotateTransform(el) || undefined">
              <rect
                v-if="el.type === 'rectangle'"
                :x="el.x"
                :y="el.y"
                :width="el.w"
                :height="el.h"
                :stroke="el.stroke"
                :stroke-width="el.strokeWidth"
                :fill="el.fill || 'none'"
                rx="2"
              />
              <ellipse
                v-else-if="el.type === 'ellipse'"
                :cx="el.x + el.w / 2"
                :cy="el.y + el.h / 2"
                :rx="el.w / 2"
                :ry="el.h / 2"
                :stroke="el.stroke"
                :stroke-width="el.strokeWidth"
                :fill="el.fill || 'none'"
              />
              <polygon
                v-else-if="el.type === 'diamond'"
                :points="diamondPoints(el)"
                :stroke="el.stroke"
                :stroke-width="el.strokeWidth"
                :fill="el.fill || 'none'"
              />
              <line
                v-else-if="el.type === 'line'"
                :x1="segEnds(el).x1"
                :y1="segEnds(el).y1"
                :x2="segEnds(el).x2"
                :y2="segEnds(el).y2"
                :stroke="el.stroke"
                :stroke-width="el.strokeWidth"
                stroke-linecap="round"
              />
              <g v-else-if="el.type === 'arrow'">
                <line
                  :x1="segEnds(el).x1"
                  :y1="segEnds(el).y1"
                  :x2="segEnds(el).x2"
                  :y2="segEnds(el).y2"
                  :stroke="el.stroke"
                  :stroke-width="el.strokeWidth"
                  stroke-linecap="round"
                />
                <polygon :points="arrowHeadPoints(el)" :fill="el.stroke" />
              </g>
              <path
                v-else-if="el.type === 'pencil' || el.type === 'pen'"
                :d="freehandPathD(el)"
                :stroke="el.stroke"
                :stroke-width="el.strokeWidth"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <g v-else-if="el.type === 'sticky'">
                <rect
                  :x="el.x"
                  :y="el.y"
                  :width="el.w"
                  :height="el.h"
                  :fill="el.bg || '#ffe27a'"
                  rx="6"
                  class="lousa__sticky-shadow"
                />
                <foreignObject
                  v-if="editing?.id !== el.id"
                  :x="el.x"
                  :y="el.y"
                  :width="el.w"
                  :height="el.h"
                >
                  <div class="lousa__sticky-text" :style="{ fontSize: (el.fontSize || 18) + 'px' }">
                    {{ el.text }}
                  </div>
                </foreignObject>
              </g>
              <image
                v-else-if="el.type === 'image'"
                :x="el.x"
                :y="el.y"
                :width="el.w"
                :height="el.h"
                :href="srcDaImagem(el)"
                preserveAspectRatio="none"
                crossorigin="anonymous"
              />
              <text
                v-else-if="el.type === 'text' && editing?.id !== el.id"
                :x="el.x"
                :y="el.y + (el.fontSize || 24) * 0.8"
                :fill="el.stroke"
                :font-size="el.fontSize || 24"
                font-family="sans-serif"
              >
                {{ el.text }}
              </text>
            </g>

            <!-- Draft preview -->
            <g v-if="currentElement" opacity="0.75">
              <rect
                v-if="currentElement.type === 'rectangle'"
                :x="Math.min(currentElement.x, currentElement.x + currentElement.w)"
                :y="Math.min(currentElement.y, currentElement.y + currentElement.h)"
                :width="Math.abs(currentElement.w)"
                :height="Math.abs(currentElement.h)"
                :stroke="currentElement.stroke"
                :stroke-width="currentElement.strokeWidth"
                :fill="currentElement.fill || 'none'"
                rx="2"
              />
              <ellipse
                v-else-if="currentElement.type === 'ellipse'"
                :cx="currentElement.x + currentElement.w / 2"
                :cy="currentElement.y + currentElement.h / 2"
                :rx="Math.abs(currentElement.w / 2)"
                :ry="Math.abs(currentElement.h / 2)"
                :stroke="currentElement.stroke"
                :stroke-width="currentElement.strokeWidth"
                :fill="currentElement.fill || 'none'"
              />
              <polygon
                v-else-if="currentElement.type === 'diamond'"
                :points="draftDiamond(currentElement)"
                :stroke="currentElement.stroke"
                :stroke-width="currentElement.strokeWidth"
                :fill="currentElement.fill || 'none'"
              />
              <line
                v-else-if="currentElement.type === 'line' || currentElement.type === 'arrow'"
                :x1="currentElement.x"
                :y1="currentElement.y"
                :x2="currentElement.x + currentElement.w"
                :y2="currentElement.y + currentElement.h"
                :stroke="currentElement.stroke"
                :stroke-width="currentElement.strokeWidth"
                stroke-linecap="round"
              />
              <path
                v-else-if="currentElement._path"
                :d="currentElement._path"
                :stroke="currentElement.stroke"
                :stroke-width="currentElement.strokeWidth"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>

            <!-- Selection -->
            <g v-if="selectionBounds" class="lousa__selection">
              <g
                :transform="
                  selectionBounds.angle
                    ? `rotate(${selectionBounds.angle} ${selBoundsCx} ${selBoundsCy})`
                    : undefined
                "
              >
                <rect
                  :x="selectionBounds.x"
                  :y="selectionBounds.y"
                  :width="selectionBounds.w"
                  :height="selectionBounds.h"
                  fill="none"
                  :stroke="ACENTO"
                  :stroke-width="1 / zoom"
                  :stroke-dasharray="`${4 / zoom},${4 / zoom}`"
                />
                <template v-if="selectionBounds.single">
                  <line
                    :x1="selectionBounds.x + selectionBounds.w / 2"
                    :y1="selectionBounds.y"
                    :x2="selectionBounds.x + selectionBounds.w / 2"
                    :y2="selectionBounds.y - 28 / zoom"
                    :stroke="ACENTO"
                    :stroke-width="1 / zoom"
                  />
                  <template v-for="h in handles" :key="h.name">
                    <circle
                      v-if="h.name === 'rotate'"
                      :cx="h.x"
                      :cy="h.y"
                      :r="6 / zoom"
                      :fill="ACENTO"
                    />
                    <rect
                      v-else
                      :x="h.x - 4 / zoom"
                      :y="h.y - 4 / zoom"
                      :width="8 / zoom"
                      :height="8 / zoom"
                      fill="#fff"
                      :stroke="ACENTO"
                      :stroke-width="1 / zoom"
                    />
                  </template>
                </template>
              </g>
            </g>

            <!-- Drag-select box -->
            <rect
              v-if="selectionBox.active"
              :x="Math.min(selectionBox.x, selectionBox.x + selectionBox.w)"
              :y="Math.min(selectionBox.y, selectionBox.y + selectionBox.h)"
              :width="Math.abs(selectionBox.w)"
              :height="Math.abs(selectionBox.h)"
              :fill="`rgba(${ACENTO_RGB}, 0.1)`"
              :stroke="ACENTO"
              :stroke-width="1 / zoom"
              :stroke-dasharray="`${5 / zoom},${5 / zoom}`"
            />
          </g>
        </svg>

        <!-- O editor de texto e de nota, sobre o quadro -->
        <textarea
          v-if="editingEl"
          ref="editorRef"
          class="lousa__editor"
          :class="{ 'lousa__editor--sticky': editingEl.type === 'sticky' }"
          :style="estiloDoEditor"
          :value="editingEl.text"
          @input="setEditingText($event.target.value)"
          @keydown.escape.prevent="cancelText"
          @keydown.enter.exact.prevent="commitText"
          @blur="commitText"
        />

        <!-- O zoom flutuante da janela estreita -->
        <div v-if="estreita && !folhaAberta" class="lousa__zoom-flutuante">
          <RosBotao
            icone="zoom_out"
            :rotulo="t('zoomOut')"
            :tamanho-do-icone="20"
            @click="zoomOut"
          />
          <span>{{ Math.round(zoom * 100) }}%</span>
          <RosBotao icone="zoom_in" :rotulo="t('zoomIn')" :tamanho-do-icone="20" @click="zoomIn" />
          <RosBotao
            icone="fit_screen"
            :rotulo="t('resetView')"
            :tamanho-do-icone="20"
            @click="ajustarAVista"
          />
        </div>

        <!-- Abrindo, ou a falha de abrir -->
        <div v-if="loading || error" class="lousa__sobre" role="status">
          <RosVazio
            v-if="loading"
            icone="draw"
            :acento="ACENTO"
            :titulo="t('loadingTitle')"
            carregando
            :leve="estado.leve"
          />
          <RosVazio
            v-else
            icone="draw"
            :acento="ACENTO"
            :titulo="t('saveError')"
            :subtitulo="t('erroGenerico')"
          >
            <RosBotao variante="primario" :acento="ACENTO" @click="loadBoards">
              {{ t('comumRetry') }}
            </RosBotao>
          </RosVazio>
        </div>
      </div>
    </div>

    <!-- As ferramentas da janela estreita -->
    <RosFolha
      v-if="estreita"
      v-model="folhaAberta"
      :titulo="t('title')"
      icone="draw"
      :acento="ACENTO"
      :rotulo-fechar="t('comumClose')"
    >
      <div class="lousa__acoes-da-folha">
        <RosBotao icone="note_add" @click="createBoard()">{{ t('comumNew') }}</RosBotao>
        <RosBotao icone="dashboard" @click="quadrosAbertos = true">{{ t('boards') }}</RosBotao>
        <RosBotao icone="save" @click="saveRosboard">{{ t('comumSave') }}</RosBotao>
        <RosBotao icone="delete" :disabled="!selectedIds.length" @click="deleteSelection">
          {{ t('comumDelete') }}
        </RosBotao>
        <RosBotao icone="delete_sweep" @click="clearBoard">{{ t('clearAll') }}</RosBotao>
        <RosBotao icone="fit_screen" @click="ajustarAVista">{{ t('resetView') }}</RosBotao>
      </div>
      <Ferramentas :acento="ACENTO" @abrir-quadros="quadrosAbertos = true" />
    </RosFolha>

    <Quadros v-model="quadrosAbertos" :acento="ACENTO" />
  </div>
</template>

<script setup>
// A Lousa: o quadro infinito, as barras e as folhas. O motor (useLousa.js) tem o estado e a
// máquina de ponteiro; aqui só se liga o DOM a ele. Tudo o que é do RoqueOS chega pelo
// `sistema`, e o texto pelo `estado.textos` (index.js).
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { RosBotao, RosFolha, RosVazio } from '@roqueos-apps/ui'
import { useLousa } from './useLousa.js'
import { traduzir } from './textos.js'
import {
  rotateTransform,
  diamondPoints,
  arrowHeadPoints,
  segmentEnds,
  freehandPathD,
  boardToText,
} from './elements.js'
import Ferramentas from './Ferramentas.vue'
import Quadros from './Quadros.vue'

const props = defineProps({
  /** O sistema do app-sdk que o RoqueOS (ou o yarn dev) entregou no mount. */
  sistema: { type: Object, required: true },
  /** `{ ativo, idioma, textos, leve }`, do index.js. */
  estado: { type: Object, required: true },
})

/** A cor da Lousa: a mesma do app.json. */
const ACENTO = '#0ea5e9'
const ACENTO_RGB = '14, 165, 233'
/** Abaixo desta largura a janela vira a Lousa de celular: barra curta e ferramentas na folha. */
const LARGURA_ESTREITA = 700

const t = (chave) => traduzir(props.estado.textos, chave)
const e = useLousa({ sistema: props.sistema, t })
provide('lousa', { motor: e, t })

const {
  elements,
  selectedIds,
  currentElement,
  editing,
  loading,
  error,
  zoom,
  pan,
  showGrid,
  isPanning,
  selectionBox,
  boardName,
  canUndo,
  canRedo,
  selectionBounds,
  handles,
  srcDaImagem,
  undo,
  redo,
  deleteSelection,
  clearBoard,
  createBoard,
  saveRosboard,
  zoomIn,
  zoomOut,
  loadBoards,
  setEditingText,
  commitText,
  cancelText,
} = e

const estiloDoAcento = { '--lousa-acento': ACENTO, '--lousa-acento-rgb': ACENTO_RGB }

const raizRef = ref(null)
const palcoRef = ref(null)
const editorRef = ref(null)
const ancoraDaIa = ref(null)
const folhaAberta = ref(false)
const quadrosAbertos = ref(false)
const espacoApertado = ref(false)
const larguraDoPalco = ref(800)
const alturaDoPalco = ref(600)
const estreita = ref(false)

// --- IA: o painel é do sistema -------------------------------------------------------------
// O quadro é onde um brainstorm cai, então as duas ações que valem além do catálogo de
// leitura são agrupar em temas e tirar as ações a fazer. Os pedidos ao modelo ficam em
// português, como no catálogo do sistema; o rótulo vai no idioma de quem usa.
const iaAberta = ref(false)
let painel = null
function alternarIa() {
  if (painel) {
    painel.fechar()
    return
  }
  if (!ancoraDaIa.value) return
  painel = props.sistema.ia.abrirPainel({
    ancora: ancoraDaIa.value,
    tipo: 'read',
    contexto: () => boardToText(elements.value),
    acento: ACENTO,
    titulo: t('iaTitulo'),
    acoes: [
      {
        id: 'temas',
        icone: 'category',
        rotulo: t('aiThemes'),
        prompt:
          'Agrupe as ideias a seguir em temas, com um título curto por tema e as ideias sob ele. Responda APENAS com a lista agrupada.',
      },
      {
        id: 'acoes',
        icone: 'checklist',
        rotulo: t('aiActions'),
        prompt:
          'Extraia as ações concretas do conteúdo a seguir, uma por linha, começando por um verbo. Ignore o que não for acionável. Responda APENAS com a lista.',
      },
    ],
    aoFechar: () => {
      painel = null
      iaAberta.value = false
    },
  })
  iaAberta.value = true
}

const segEnds = (el) => segmentEnds(el)
const draftDiamond = (el) => {
  const cx = el.x + el.w / 2
  const cy = el.y + el.h / 2
  const hw = el.w / 2
  const hh = el.h / 2
  return `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`
}

const selBoundsCx = computed(() =>
  selectionBounds.value ? selectionBounds.value.x + selectionBounds.value.w / 2 : 0,
)
const selBoundsCy = computed(() =>
  selectionBounds.value ? selectionBounds.value.y + selectionBounds.value.h / 2 : 0,
)

// Grid background follows pan/zoom.
const estiloDaGrade = computed(() => {
  const size = 24 * zoom.value
  return {
    backgroundSize: `${size}px ${size}px`,
    backgroundPosition: `${pan.x}px ${pan.y}px`,
  }
})

const editingEl = computed(() =>
  editing.value ? elements.value.find((el) => el.id === editing.value.id) : null,
)
const estiloDoEditor = computed(() => {
  const el = editingEl.value
  if (!el) return {}
  return {
    left: `${el.x * zoom.value + pan.x}px`,
    top: `${el.y * zoom.value + pan.y}px`,
    width: `${Math.max(120, el.w * zoom.value)}px`,
    height: el.type === 'sticky' ? `${el.h * zoom.value}px` : 'auto',
    fontSize: `${(el.fontSize || 20) * zoom.value}px`,
    color: el.type === 'sticky' ? '#1e1e1e' : el.stroke,
  }
})

// Auto-focus the inline editor whenever editing opens (sticky/text creation +
// double-click-to-edit) so the user can type immediately — without this, a freshly
// created sticky had an editor box but no focus, so typing did nothing.
// A short timeout (not just nextTick) lets the creating click gesture (mousedown→
// mouseup→click, which renders the textarea under the cursor) fully settle first,
// otherwise the gesture races the focus and it lands on <body> intermittently.
watch(editing, (val) => {
  // Focus ONLY after the creating gesture (mousedown→mouseup→click) has fully
  // settled. Focusing earlier (nextTick) gets immediately blurred by the gesture's
  // own click landing on the stage, which fires the editor's @blur → commitText →
  // the editor closes before the user can type ("post-it didn't work").
  if (val) setTimeout(() => editorRef.value?.focus(), 60)
})

// --- Pointer plumbing ----------------------------------------------------------
function rect() {
  return palcoRef.value.getBoundingClientRect()
}
function onMouseDown(ev) {
  if (ev.button !== 0 && ev.button !== 1) return
  const r = rect()
  const world = e.screenToWorld(ev.clientX, ev.clientY, r)
  e.beginPointer(
    world,
    { x: ev.clientX, y: ev.clientY },
    { shift: ev.shiftKey, space: espacoApertado.value || ev.button === 1 },
  )
}
function onMouseMove(ev) {
  const r = rect()
  const world = e.screenToWorld(ev.clientX, ev.clientY, r)
  e.movePointer(world, { x: ev.clientX, y: ev.clientY })
}
function onMouseUp() {
  e.endPointer()
}
function onDblClick(ev) {
  const r = rect()
  const world = e.screenToWorld(ev.clientX, ev.clientY, r)
  const hit = elements.value
    .slice()
    .reverse()
    .find((el) => (el.type === 'text' || el.type === 'sticky') && pointInBox(world, el))
  if (hit) startEdit(hit)
}
function pointInBox(p, el) {
  return p.x >= el.x - 6 && p.x <= el.x + el.w + 6 && p.y >= el.y - 6 && p.y <= el.y + el.h + 6
}
function startEdit(el) {
  // The editing watcher focuses the editor (after the gesture settles).
  e.startEditElement(el.id)
}
function onWheel(ev) {
  const r = rect()
  e.zoomAtScreen(ev.deltaY, ev.clientX - r.left, ev.clientY - r.top)
}
function ajustarAVista() {
  e.fitToContent(rect())
}

// Touch (1-finger draw/move, 2-finger pinch+pan)
let pinch = null
function pinchState(ev) {
  const a = ev.touches[0]
  const b = ev.touches[1]
  return {
    dist: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY) || 1,
    cx: (a.clientX + b.clientX) / 2,
    cy: (a.clientY + b.clientY) / 2,
  }
}
function onTouchStart(ev) {
  if (ev.touches.length === 2) {
    e.endPointer()
    pinch = pinchState(ev)
    return
  }
  const tch = ev.touches[0]
  const r = rect()
  e.beginPointer(
    e.screenToWorld(tch.clientX, tch.clientY, r),
    { x: tch.clientX, y: tch.clientY },
    {},
  )
}
function onTouchMove(ev) {
  if (ev.touches.length === 2 && pinch) {
    const cur = pinchState(ev)
    const r = rect()
    const factor = cur.dist / pinch.dist
    const nz = Math.max(0.1, Math.min(8, zoom.value * factor))
    const sx = cur.cx - r.left
    const sy = cur.cy - r.top
    pan.x = sx - (sx - pan.x) * (nz / zoom.value) + (cur.cx - pinch.cx)
    pan.y = sy - (sy - pan.y) * (nz / zoom.value) + (cur.cy - pinch.cy)
    zoom.value = nz
    pinch = cur
    return
  }
  const tch = ev.touches[0]
  if (!tch) return
  const r = rect()
  e.movePointer(e.screenToWorld(tch.clientX, tch.clientY, r), { x: tch.clientX, y: tch.clientY })
}
function onTouchEnd(ev) {
  if (ev.touches.length === 0) {
    pinch = null
    e.endPointer()
  }
}

// Drag-drop + paste images
function onDrop(ev) {
  const file = ev.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    const r = rect()
    e.addImageFromFile(file, e.screenToWorld(ev.clientX, ev.clientY, r))
  }
}
function onPaste(ev) {
  if (props.estado.ativo === false) return
  const items = ev.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        const r = palcoRef.value?.getBoundingClientRect()
        const center = r
          ? e.screenToWorld(r.left + r.width / 2, r.top + r.height / 2, r)
          : { x: 0, y: 0 }
        e.addImageFromFile(file, center)
        ev.preventDefault()
      }
      return
    }
  }
}

// Keyboard
function onKeyDown(ev) {
  if (props.estado.ativo === false) return
  const tag = ev.target?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || ev.target?.isContentEditable) return
  if (ev.code === 'Space') {
    espacoApertado.value = true
    return
  }
  const mod = ev.ctrlKey || ev.metaKey
  if (mod && ev.key.toLowerCase() === 'z') {
    ev.preventDefault()
    ev.shiftKey ? redo() : undo()
  } else if (mod && ev.key.toLowerCase() === 'y') {
    ev.preventDefault()
    redo()
  } else if (mod && ev.key.toLowerCase() === 'c') {
    e.copySelection()
  } else if (mod && ev.key.toLowerCase() === 'v') {
    e.paste()
  } else if (mod && ev.key.toLowerCase() === 'd') {
    ev.preventDefault()
    e.duplicateSelection()
  } else if (mod && ev.key.toLowerCase() === 'a') {
    ev.preventDefault()
    e.selectAll()
  } else if (ev.key === 'Delete' || ev.key === 'Backspace') {
    deleteSelection()
  } else if (ev.key === 'Escape') {
    e.clearSelection()
  } else {
    const shortcuts = {
      v: 'select',
      h: 'pan',
      p: 'pencil',
      b: 'pen',
      l: 'line',
      a: 'arrow',
      r: 'rectangle',
      o: 'ellipse',
      t: 'text',
      s: 'sticky',
      e: 'eraser',
    }
    if (shortcuts[ev.key]) e.setTool(shortcuts[ev.key])
  }
}
function onKeyUp(ev) {
  if (ev.code === 'Space') espacoApertado.value = false
}

function medir() {
  const r = palcoRef.value?.getBoundingClientRect()
  if (r) {
    larguraDoPalco.value = Math.max(1, Math.round(r.width))
    alturaDoPalco.value = Math.max(1, Math.round(r.height))
  }
  const largura = raizRef.value?.getBoundingClientRect().width
  if (largura) estreita.value = largura < LARGURA_ESTREITA
}

// A janela muda de tamanho sem a página mudar (a pessoa arrasta a borda): quem mede é o
// ResizeObserver da raiz, e não o resize da janela do navegador.
let observador = null
// A janela larga some a lateral e a estreita some a folha: com a troca, o palco muda de lugar.
watch(estreita, () => requestAnimationFrame(medir))

onMounted(async () => {
  observador = new ResizeObserver(medir)
  if (raizRef.value) observador.observe(raizRef.value)
  medir()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('paste', onPaste)
  await loadBoards()
  medir()
})
onBeforeUnmount(() => {
  observador?.disconnect()
  painel?.fechar()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('paste', onPaste)
})
</script>

<style lang="scss" scoped>
@import './lousa.scss';
</style>
