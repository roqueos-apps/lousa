<template>
  <div class="ferramentas">
    <section class="ferramentas__secao">
      <span class="ferramentas__titulo">{{ t('tools') }}</span>
      <div class="ferramentas__lista">
        <button
          v-for="f in lista"
          :key="f.id"
          type="button"
          class="ferramentas__ferramenta"
          :class="{ 'ferramentas__ferramenta--ativa': tool === f.id }"
          :title="f.nome"
          :aria-label="f.nome"
          :aria-pressed="tool === f.id"
          @click="setTool(f.id)"
        >
          <RosIcone :nome="f.icone" :tamanho="20" />
        </button>
      </div>
    </section>

    <section class="ferramentas__secao">
      <span class="ferramentas__titulo">{{ t('color') }}</span>
      <div class="ferramentas__cores">
        <button
          v-for="c in PALETA"
          :key="c"
          type="button"
          class="ferramentas__amostra"
          :class="{
            'ferramentas__amostra--ativa': strokeColor === c,
            'ferramentas__amostra--anel': c === '#ffffff',
          }"
          :style="{ background: c }"
          :aria-label="c"
          :aria-pressed="strokeColor === c"
          @click="strokeColor = c"
        ></button>
        <label class="ferramentas__amostra ferramentas__amostra--propria" :title="t('customColor')">
          <input v-model="strokeColor" type="color" :aria-label="t('customColor')" />
          <RosIcone nome="colorize" :tamanho="14" />
        </label>
      </div>
    </section>

    <section class="ferramentas__secao">
      <span class="ferramentas__titulo">{{ t('strokeWidth') }}</span>
      <div class="ferramentas__tracos">
        <button
          v-for="w in ESPESSURAS"
          :key="w"
          type="button"
          class="ferramentas__traco"
          :class="{ 'ferramentas__traco--ativo': strokeWidth === w }"
          :aria-label="`${t('strokeWidth')} ${w}`"
          :aria-pressed="strokeWidth === w"
          @click="strokeWidth = w"
        >
          <span :style="{ width: w * 2 + 'px', height: w * 2 + 'px' }"></span>
        </button>
      </div>
    </section>

    <section v-if="tool === 'sticky'" class="ferramentas__secao">
      <span class="ferramentas__titulo">{{ t('stickyColor') }}</span>
      <div class="ferramentas__cores">
        <button
          v-for="c in PALETA_DA_NOTA"
          :key="c"
          type="button"
          class="ferramentas__amostra"
          :class="{ 'ferramentas__amostra--ativa': stickyColor === c }"
          :style="{ background: c }"
          :aria-label="c"
          :aria-pressed="stickyColor === c"
          @click="stickyColor = c"
        ></button>
      </div>
    </section>

    <section class="ferramentas__secao">
      <span class="ferramentas__titulo">{{ t('options') }}</span>
      <!-- O interruptor do kit não tem texto próprio: o texto vem do lado, e o <label> faz o
           clique nele alternar também. -->
      <label class="ferramentas__opcao">
        <RosInterruptor v-model="fillEnabled" :rotulo="t('fill')" :acento="acento" />
        <span>{{ t('fill') }}</span>
        <input
          v-if="fillEnabled"
          v-model="fillColor"
          type="color"
          class="ferramentas__cor-do-preenchimento"
          :aria-label="t('fill')"
        />
      </label>
      <label class="ferramentas__opcao">
        <RosInterruptor v-model="showGrid" :rotulo="t('showGrid')" :acento="acento" />
        <span>{{ t('showGrid') }}</span>
      </label>
    </section>

    <section class="ferramentas__secao">
      <span class="ferramentas__titulo">{{ t('comumExport') }}</span>
      <div class="ferramentas__exportar">
        <RosBotao @click="exportAs('png')">PNG</RosBotao>
        <RosBotao @click="exportAs('svg')">SVG</RosBotao>
        <RosBotao @click="exportAs('pdf')">PDF</RosBotao>
      </div>
      <RosBotao class="ferramentas__inteiro" icone="dashboard" @click="$emit('abrir-quadros')">
        {{ t('boards') }}
      </RosBotao>
    </section>
  </div>
</template>

<script setup>
// As ferramentas, as cores, a espessura e a exportação: a lateral na janela larga, e a folha na
// estreita. Mexe só no motor da Lousa que recebe.
import { computed, inject } from 'vue'
import { RosBotao, RosIcone, RosInterruptor } from '@roqueos-apps/ui'

defineProps({
  acento: { type: String, default: '#0ea5e9' },
})
defineEmits(['abrir-quadros'])

// O motor e a tradução vêm da Lousa por provide: os refs do motor mudam aqui dentro (a cor, a
// espessura), e prop não se muda.
const { motor, t } = inject('lousa')
const {
  tool,
  strokeColor,
  strokeWidth,
  stickyColor,
  fillEnabled,
  fillColor,
  showGrid,
  setTool,
  exportAs,
} = motor

const PALETA = ['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#9c36b5', '#ffffff']
const PALETA_DA_NOTA = ['#ffe27a', '#ffd1dc', '#b2f2bb', '#a5d8ff', '#d0bfff', '#ffffff']
const ESPESSURAS = [2, 4, 6, 8]

const lista = computed(() => [
  { id: 'select', nome: t('toolSelect'), icone: 'near_me' },
  { id: 'pan', nome: t('toolPan'), icone: 'pan_tool' },
  { id: 'pencil', nome: t('toolPencil'), icone: 'edit' },
  { id: 'pen', nome: t('toolPen'), icone: 'brush' },
  { id: 'line', nome: t('toolLine'), icone: 'horizontal_rule' },
  { id: 'arrow', nome: t('toolArrow'), icone: 'arrow_right_alt' },
  { id: 'rectangle', nome: t('toolRectangle'), icone: 'crop_square' },
  { id: 'ellipse', nome: t('toolEllipse'), icone: 'circle' },
  { id: 'diamond', nome: t('toolDiamond'), icone: 'change_history' },
  { id: 'text', nome: t('toolText'), icone: 'text_fields' },
  { id: 'sticky', nome: t('toolSticky'), icone: 'sticky_note_2' },
  // `ink_eraser`, o ícone de antes, é do Material Symbols e não existe no Material Icons: no
  // RoqueOS aparecia o nome escrito no botão. `cleaning_services` é o que há.
  { id: 'eraser', nome: t('toolEraser'), icone: 'cleaning_services' },
])
</script>

<style lang="scss" scoped>
@import './ferramentas.scss';
</style>
