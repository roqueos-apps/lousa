import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'

export default [
  { ignores: ['node_modules/**', 'dist/**'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'vue/multi-word-component-names': 'off',
      // O app roda num app Vue próprio, sem o Quasar do RoqueOS: componente usado sem
      // import é tela quebrada fora do RoqueOS.
      'vue/no-undef-components': 'error',
    },
  },
]
