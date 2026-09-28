<template>
  <RosFolha
    :model-value="modelValue"
    :titulo="t('boards')"
    icone="dashboard"
    :acento="acento"
    :rotulo-fechar="t('comumClose')"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="quadros">
      <RosBotao
        class="quadros__novo"
        variante="primario"
        icone="add"
        :acento="acento"
        @click="criarNovo"
      >
        {{ t('newBoard') }}
      </RosBotao>

      <ul class="quadros__lista">
        <li
          v-for="b in boards"
          :key="b.id"
          class="quadros__item"
          :class="{ 'quadros__item--atual': b.id === currentBoardId }"
        >
          <RosIcone nome="draw" :tamanho="18" class="quadros__icone" />

          <input
            v-if="renomeando === b.id"
            ref="campoDoNome"
            v-model="nomeNovo"
            class="quadros__renomear"
            :aria-label="t('comumEdit')"
            @keydown.enter="confirmarNome(b)"
            @keydown.escape="renomeando = null"
            @blur="confirmarNome(b)"
          />
          <button v-else type="button" class="quadros__nome" @click="abrir(b.id)">
            {{ b.name || t('untitled') }}
          </button>

          <template v-if="confirmando === b.id">
            <RosBotao variante="perigo" @click="apagar(b.id)">{{ t('comumDelete') }}</RosBotao>
            <RosBotao @click="confirmando = null">{{ t('comumCancel') }}</RosBotao>
          </template>
          <template v-else>
            <RosBotao
              icone="edit"
              :tamanho-do-icone="16"
              :rotulo="t('comumEdit')"
              @click="comecarNome(b)"
            />
            <RosBotao
              icone="delete"
              :tamanho-do-icone="16"
              :rotulo="t('comumDelete')"
              :disabled="boards.length <= 1"
              @click="confirmando = b.id"
            />
          </template>
        </li>
      </ul>
    </div>
  </RosFolha>
</template>

<script setup>
// Os quadros da pessoa: abrir outro, criar, renomear e apagar (com a confirmação no próprio
// item, e nunca o último). Na janela larga e na estreita é a mesma folha.
import { inject, nextTick, ref } from 'vue'
import { RosBotao, RosFolha, RosIcone } from '@roqueos-apps/ui'

defineProps({
  modelValue: { type: Boolean, default: false },
  acento: { type: String, default: '#0ea5e9' },
})
const emit = defineEmits(['update:modelValue'])

const { motor, t } = inject('lousa')
const { boards, currentBoardId } = motor

const renomeando = ref(null)
const nomeNovo = ref('')
const confirmando = ref(null)
const campoDoNome = ref(null)

function abrir(id) {
  motor.switchBoard(id)
  emit('update:modelValue', false)
}
async function criarNovo() {
  await motor.createBoard(t('untitled'))
  emit('update:modelValue', false)
}
async function comecarNome(b) {
  renomeando.value = b.id
  nomeNovo.value = b.name || ''
  await nextTick()
  // O `ref` dentro do v-for é uma lista; só existe um campo de nome por vez.
  campoDoNome.value?.[0]?.focus()
}
function confirmarNome(b) {
  if (renomeando.value !== b.id) return
  const nome = nomeNovo.value.trim()
  if (nome) motor.renameBoard(b.id, nome)
  renomeando.value = null
}
function apagar(id) {
  confirmando.value = null
  motor.deleteBoard(id)
}
</script>

<style lang="scss" scoped>
@import './quadros.scss';
</style>
