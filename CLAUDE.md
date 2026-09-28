# Quadro Branco (Lousa)

App da organização roqueos-apps, montado pelo RoqueOS através do `app-sdk`. Leia o README
antes de mudar qualquer coisa.

- Gate: `yarn verificar` (o mesmo do CI e do pre-push).
- O app só importa `vue`, `@roqueos-apps/app-sdk`, `@roqueos-apps/ui` e arquivo deste repo. O
  `app check` e a catraca `apps-fora-do-nucleo` do RoqueOS reprovam o resto.
- Os quadros moram onde moravam antes de o app sair do RoqueOS (coleções `quadros` e `indice`
  no mapa do RoqueOS; o índice é o documento `whiteboards`). O formato do quadro e o `id`
  (`whiteboard`) são permanentes: campo novo é aditivo.
- Imagem com conta é `sistema.anexos` (o elemento guarda `anexo`, nunca endereço); sem conta e
  no E2E, embutida. Nunca pedir URL do Storage ao sistema.
- Erro de leitura não vira "nenhum quadro": vira a tela de erro. Nada grava por cima da lista
  da pessoa por causa de uma falha.
- JSON de texto entra com `?raw` e `JSON.parse` (`src/textos.js`): o build do RoqueOS quebra
  com import de JSON direto, e é por isso que `src/index.js` repete as capacidades do
  `app.json` (o teste confere que batem). Chave de texto sem ponto: o `app check` lê ponto como
  caminho.
- Do tema do RoqueOS só as variáveis CSS do contrato do SDK; as cores do app são `--lousa-*`.
- Toda correção vem com teste que reprova sem ela; check novo passa por mutação.
- Todo commit com `Signed-off-by` (`git commit -s`): o workflow `dco` reprova sem.
- Português do Brasil no código novo e nos commits.
