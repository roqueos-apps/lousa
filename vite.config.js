// O Vite do repo serve dois usos: `yarn dev`, que abre a Lousa sozinha numa janela falsa do
// RoqueOS com o sistema de desenvolvimento do SDK (dev/), e `yarn test`, com o Vitest. No
// RoqueOS quem compila o app é o Vite do próprio RoqueOS: este arquivo não vai junto.
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['test/preparar.js'],
    include: ['test/**/*.spec.js'],
    // O kit de interface chega como fonte (.vue), igual chega no RoqueOS: o Vitest precisa
    // passar ele pelo plugin do Vue em vez de carregar direto do node_modules.
    server: { deps: { inline: [/@roqueos-apps\/ui/] } },
  },
})
